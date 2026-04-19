/**
 * eventflow.service.js
 * All operations use the Supabase JS client directly (no edge functions).
 * This ensures auth tokens are always passed correctly and avoids 401 errors.
 */
import QRCode from 'qrcode';
import { supabase, storageBuckets } from '../config/supabase';

function throwIfError(error, fallback) {
  if (error) throw new Error(error.message || fallback);
}

function fileExt(file) {
  return file?.name?.split('.').pop()?.toLowerCase() || 'bin';
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}

async function uploadPrivateFile(bucket, userId, file, prefix) {
  if (!file) return null;
  const path = `${userId}/${prefix}-${Date.now()}.${fileExt(file)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true, contentType: file.type || undefined
  });
  throwIfError(error, 'Upload failed');
  return path;
}

/* ─────────────────────────────────────────────────────── */
/*  EVENT HELPERS                                          */
/* ─────────────────────────────────────────────────────── */

export async function fetchEventById(eventId) {
  if (!eventId) return null;
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).single();
  throwIfError(error, 'Unable to load event');
  return data;
}

export async function fetchAdminEvents(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('events').select('*').eq('admin_id', userId).order('created_at', { ascending: false });
  throwIfError(error, 'Unable to load admin events');
  return data || [];
}

/* ─────────────────────────────────────────────────────── */
/*  ADMIN: CREATE EVENT (direct insert, no edge function)  */
/* ─────────────────────────────────────────────────────── */

export async function createEvent(payload, bannerFile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Generate unique event code
  const { data: codeRow } = await supabase.rpc('generate_event_code');
  const eventCode = codeRow || Math.random().toString(36).slice(2, 8).toUpperCase();

  const { data: event, error: eventError } = await supabase.from('events').insert({
    name: payload.event_name,
    description: payload.event_description ?? '',
    event_code: eventCode,
    location: { city: payload.city || '', venue: payload.venue_name || '' },
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    start_date: payload.event_start_date,
    end_date: payload.event_end_date,
    max_participants: Number(payload.max_participants) || 200,
    number_of_stalls: Number(payload.number_of_stalls) || 0,
    category: payload.event_category,
    contact_email: payload.contact_email ?? user.email ?? null,
    contact_phone: payload.contact_phone ?? null,
    wifi_ssid: payload.wifi_ssid ?? null,
    wifi_password: payload.wifi_password ?? null,
    helpline_numbers: Array.isArray(payload.helpline_numbers) ? payload.helpline_numbers : [],
    admin_id: user.id,
  }).select('*').single();

  throwIfError(eventError, 'Unable to create event');

  // Auto-create stalls if number_of_stalls > 0 (only if not already created)
  const numStalls = Number(payload.number_of_stalls) || 0;
  if (numStalls > 0) {
    const { count: existingCount } = await supabase.from('stalls').select('id', { count: 'exact', head: true }).eq('event_id', event.id);
    if (!existingCount || existingCount === 0) {
      const stallInserts = Array.from({ length: numStalls }, (_, i) => ({
        event_id: event.id,
        name: `Stall ${i + 1}`,
        location_zone: 'Main Area',
        status: 'unassigned',
        queue_time: 0,
      }));
      await supabase.from('stalls').insert(stallInserts);
    }
  }

  // Auto-create a notification
  await supabase.from('notifications').insert({
    event_id: event.id,
    message: `🎉 Welcome to ${event.name}! Event code: ${eventCode}`,
    target_role: null,
  });

  // Upload banner if provided
  if (bannerFile && event.id) {
    const bannerPath = `${event.id}/banner-${Date.now()}.${fileExt(bannerFile)}`;
    const { error: uploadErr } = await supabase.storage.from(storageBuckets.eventAssets || 'event-assets').upload(bannerPath, bannerFile, { upsert: true });
    if (!uploadErr) {
      await supabase.from('events').update({ banner_url: bannerPath }).eq('id', event.id);
      event.banner_url = bannerPath;
    }
  }

  // Mark admin onboarding complete
  await supabase.from('profiles').update({
    event_id: event.id,
    onboarding_completed: true,
    full_name: payload.full_name || user.email,
    email: user.email ?? null,
  }).eq('id', user.id);

  return event;
}

/* ─────────────────────────────────────────────────────── */
/*  PARTICIPANT ONBOARDING (direct insert, no edge fn)     */
/* ─────────────────────────────────────────────────────── */

export async function completeParticipantOnboarding(payload, idProofFile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Find the event by code
  const code = (payload.event_code || '').trim().toUpperCase();
  const { data: event, error: evErr } = await supabase.from('events').select('id, name').eq('event_code', code).maybeSingle();
  if (evErr || !event) throw new Error('Invalid event code. Please check and try again.');

  // Upload ID proof if provided
  const id_proof_url = await uploadPrivateFile(
    storageBuckets?.participantDocs || 'participant-docs',
    user.id, idProofFile, 'id-proof'
  ).catch(() => null); // don't fail if upload fails

  // Upsert participant record
  const { data: participant, error: pErr } = await supabase.from('participants').upsert({
    profile_id: user.id,
    event_id: event.id,
    full_name: payload.full_name,
    email: user.email ?? payload.email ?? '',
    phone_number: payload.phone_number,
    college_name: payload.college_name ?? null,
    organization: payload.organization ?? null,
    course: payload.course ?? null,
    year_of_study: payload.year_of_study ?? null,
    city: payload.city ?? null,
    state: payload.state ?? null,
    gender: payload.gender ?? null,
    emergency_contact: payload.emergency_contact ?? null,
    id_proof_url: id_proof_url ?? null,
  }, { onConflict: 'profile_id' }).select('id, seat_number').single();

  throwIfError(pErr, 'Unable to save participant details');

  // Generate QR code and upload to storage
  try {
    const qrToken = `${participant.id}-${user.id}-${Date.now()}`;
    const qrPayload = JSON.stringify({
      participantId: participant.id,
      eventId: event.id,
      userId: user.id,
      seatNumber: participant.seat_number,
      token: qrToken,
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 400,
      margin: 2,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    });
    // Convert data URL to blob for storage upload
    const res = await fetch(qrDataUrl);
    const blob = await res.blob();
    const qrPath = `${participant.id}/qr-pass.png`;
    await supabase.storage
      .from(storageBuckets?.qrCodes || 'qr-codes')
      .upload(qrPath, blob, { contentType: 'image/png', upsert: true });
    await supabase.from('participants').update({
      qr_code_url: qrPath,
      qr_token: qrToken,
    }).eq('id', participant.id);
  } catch (_qrErr) {
    // QR generation is non-fatal — participant can still proceed
    console.warn('[SmartVenueX] QR generation failed:', _qrErr);
  }

  // Mark profile complete
  const { error: profileErr } = await supabase.from('profiles').update({
    event_id: event.id,
    role: 'participant',
    full_name: payload.full_name,
    phone_number: payload.phone_number,
    email: user.email ?? null,
    onboarding_completed: true,
  }).eq('id', user.id);
  throwIfError(profileErr, 'Unable to update profile');

  // Add welcome notification
  await supabase.from('notifications').insert({
    event_id: event.id,
    message: `👋 ${payload.full_name} just joined as a participant!`,
    target_role: null,
  }).then(() => {});

  return { ok: true, role: 'participant', event, participantId: participant?.id };
}

/* ─────────────────────────────────────────────────────── */
/*  VENDOR ONBOARDING (direct insert, no edge function)    */
/* ─────────────────────────────────────────────────────── */

export async function completeVendorOnboarding(payload, licenseFile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // Find the event by code
  const code = (payload.event_code || '').trim().toUpperCase();
  const { data: event, error: evErr } = await supabase.from('events').select('id, name').eq('event_code', code).maybeSingle();
  if (evErr || !event) throw new Error('Invalid event code. Please check and try again.');

  // Upload license if provided
  const license_document_url = await uploadPrivateFile(
    storageBuckets?.vendorDocs || 'vendor-docs',
    user.id, licenseFile, 'license'
  ).catch(() => null);

  // Upsert vendor record
  const { data: vendor, error: vErr } = await supabase.from('vendors').upsert({
    profile_id: user.id,
    event_id: event.id,
    vendor_name: payload.vendor_name,
    owner_name: payload.owner_name,
    email: user.email ?? payload.email ?? '',
    phone_number: payload.phone_number,
    service_type: payload.service_type,
    stall_name: payload.stall_name ?? null,
    items_offered: asArray(payload.items_offered),
    pricing_range: payload.pricing_range ?? null,
    required_resources: asArray(payload.required_resources),
    setup_time: payload.setup_time ?? null,
    license_document_url: license_document_url ?? null,
  }, { onConflict: 'profile_id' }).select('id, stall_name').single();

  throwIfError(vErr, 'Unable to save vendor details');

  // Try to auto-assign an unassigned stall
  const { data: freeStall } = await supabase.from('stalls')
    .select('id, name')
    .eq('event_id', event.id)
    .is('vendor_id', null)
    .eq('status', 'unassigned')
    .limit(1)
    .maybeSingle();

  if (freeStall) {
    await supabase.from('stalls').update({
      vendor_id: vendor.id,
      status: 'active',
    }).eq('id', freeStall.id);
  }

  // Mark profile complete
  const { error: profileErr } = await supabase.from('profiles').update({
    event_id: event.id,
    role: 'vendor',
    full_name: payload.owner_name,
    phone_number: payload.phone_number,
    email: user.email ?? null,
    onboarding_completed: true,
  }).eq('id', user.id);
  throwIfError(profileErr, 'Unable to update profile');

  // Welcome notification
  await supabase.from('notifications').insert({
    event_id: event.id,
    message: `🏪 ${payload.vendor_name} joined as a vendor!`,
    target_role: null,
  }).then(() => {});

  return { ok: true, role: 'vendor', event, vendorId: vendor?.id };
}

/* ─────────────────────────────────────────────────────── */
/*  OTHER HELPERS                                          */
/* ─────────────────────────────────────────────────────── */

export async function attachExistingAdminEvent(eventId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');
  const { error } = await supabase.from('profiles').update({
    event_id: eventId,
    onboarding_completed: true,
  }).eq('id', user.id);
  throwIfError(error, 'Unable to activate existing event');
}

export async function fetchParticipantPass(profileId) {
  const { data: participant, error } = await supabase
    .from('participants').select('*').eq('profile_id', profileId).maybeSingle();
  if (error) throw error;
  if (!participant) return null;
  let qrSignedUrl = null;
  if (participant.qr_code_url) {
    const { data: signed } = await supabase.storage
      .from(storageBuckets?.qrCodes || 'qr-codes')
      .createSignedUrl(participant.qr_code_url, 3600);
    qrSignedUrl = signed?.signedUrl ?? null;
  }
  return { ...participant, qrSignedUrl };
}

export async function createOrder({ participantId, stallId, eventId, items, totalPrice }) {
  const { data: { user } } = await supabase.auth.getUser();

  // If no explicit participantId, look it up
  let pId = participantId;
  if (!pId && user?.id) {
    const { data: p } = await supabase.from('participants').select('id').eq('profile_id', user.id).maybeSingle();
    pId = p?.id ?? null;
  }

  const { data, error } = await supabase.from('orders').insert({
    participant_id: pId,
    stall_id: stallId,
    event_id: eventId || null,
    items: Array.isArray(items) ? items : [],
    total_price: Number(totalPrice || 0),
    status: 'pending',
  }).select('*').single();

  throwIfError(error, 'Unable to create order');
  return data;
}

export async function updateOrderStatus(orderId, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  throwIfError(error, 'Unable to update order status');
}

export async function updateZone(zoneId, patch) {
  const { error } = await supabase.from('zones').update(patch).eq('id', zoneId);
  throwIfError(error, 'Unable to update zone');
}

export async function createNotification({ eventId, message, targetRole }) {
  const { error } = await supabase.from('notifications').insert({
    event_id: eventId,
    message,
    target_role: targetRole || null,
  });
  throwIfError(error, 'Unable to publish notification');
}

export async function sendSosAlert({ eventId, userId, location, message, userName }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('sos_requests').insert({
    user_id: userId || user?.id,
    event_id: eventId,
    message: message || 'Emergency assistance needed!',
    user_name: userName || user?.email || 'Unknown',
    location: location || {},
    status: 'open',
  });
  throwIfError(error, 'Unable to send SOS');
}

export async function fetchDashboardData(profile) {
  const event = await fetchEventById(profile?.event_id);
  if (!profile?.role || !event) return { event, zones: [], notifications: [], schedule: [] };

  const zonesQ = supabase.from('zones').select('*').eq('event_id', event.id).order('name');
  const notifsQ = supabase.from('notifications').select('*').eq('event_id', event.id).order('created_at', { ascending: false }).limit(20);
  const scheduleQ = supabase.from('event_schedule').select('*').eq('event_id', event.id).order('start_time');

  if (profile.role === 'admin') {
    const [parts, vends, stalls, zones, orders, sos, notifs, sched] = await Promise.all([
      supabase.from('participants').select('*').eq('event_id', event.id).order('seat_number', { ascending: true, nullsFirst: false }),
      supabase.from('vendors').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
      supabase.from('stalls').select('*').eq('event_id', event.id).order('name'),
      zonesQ,
      supabase.from('orders').select('*, stalls(event_id)').order('created_at', { ascending: false }).limit(50),
      supabase.from('sos_requests').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
      notifsQ,
      scheduleQ,
    ]);
    return {
      event,
      participants: parts.data || [],
      vendors: vends.data || [],
      stalls: stalls.data || [],
      zones: zones.data || [],
      orders: orders.data || [],
      sos: sos.data || [],
      notifications: notifs.data || [],
      schedule: sched.data || [],
    };
  }

  if (profile.role === 'participant') {
    const [participant, stalls, zones, orders, notifs, sched] = await Promise.all([
      fetchParticipantPass(profile.id),
      supabase.from('stalls').select('*').eq('event_id', event.id).eq('status', 'active').order('name'),
      zonesQ,
      supabase.from('orders').select('*').eq('event_id', event.id).order('created_at', { ascending: false }).limit(20),
      notifsQ,
      scheduleQ,
    ]);
    return {
      event,
      participant,
      stalls: stalls.data || [],
      zones: zones.data || [],
      orders: orders.data || [],
      notifications: notifs.data || [],
      schedule: sched.data || [],
    };
  }

  // Vendor
  const [vendor, stalls, orders, notifs, sched] = await Promise.all([
    supabase.from('vendors').select('*').eq('profile_id', profile.id).maybeSingle(),
    supabase.from('stalls').select('*').eq('event_id', event.id).order('name'),
    supabase.from('orders').select('*').eq('event_id', event.id).order('created_at', { ascending: false }),
    notifsQ,
    scheduleQ,
  ]);
  return {
    event,
    vendor: vendor.data,
    stalls: stalls.data || [],
    orders: orders.data || [],
    notifications: notifs.data || [],
    schedule: sched.data || [],
  };
}

/* ─────────────────────────────────────────────────────── */
/*  EVENT SCHEDULE CRUD                                    */
/* ─────────────────────────────────────────────────────── */

export async function fetchSchedule(eventId) {
  if (!eventId) return [];
  const { data, error } = await supabase
    .from('event_schedule')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time');
  throwIfError(error, 'Unable to load schedule');
  return data || [];
}

export async function createScheduleItem(payload) {
  const { data, error } = await supabase
    .from('event_schedule')
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error, 'Unable to create schedule item');
  return data;
}

export async function updateScheduleItem(id, payload) {
  const { error } = await supabase
    .from('event_schedule')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id);
  throwIfError(error, 'Unable to update schedule item');
}

export async function deleteScheduleItem(id) {
  const { error } = await supabase
    .from('event_schedule')
    .delete()
    .eq('id', id);
  throwIfError(error, 'Unable to delete schedule item');
}

export function subscribeRealtime(role, onChange) {
  const channel = supabase.channel(`smartvenuex-${role}-${Date.now()}`);
  ['zones', 'orders', 'sos_requests', 'notifications', 'stalls', 'vendors', 'participants', 'event_schedule'].forEach((table) => {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange());
  });
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
