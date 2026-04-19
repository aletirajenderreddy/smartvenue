import QRCode from 'qrcode';
import { corsHeaders, json } from '../_shared/cors.ts';
import { createAdminClient, createUserClient, getUser } from '../_shared/client.ts';

type ParticipantPayload = {
  role: 'participant';
  event_code: string;
  full_name: string;
  phone_number: string;
  college_name?: string;
  organization?: string;
  course?: string;
  year_of_study?: string;
  city?: string;
  state?: string;
  gender?: string;
  emergency_contact?: string;
  id_proof_url?: string | null;
};

type VendorPayload = {
  role: 'vendor';
  event_code: string;
  vendor_name: string;
  owner_name: string;
  phone_number: string;
  service_type: 'food' | 'merchandise' | 'service' | 'other';
  stall_name?: string;
  items_offered?: unknown;
  pricing_range?: string;
  required_resources?: unknown;
  setup_time?: string | null;
  license_document_url?: string | null;
};

type Payload = ParticipantPayload | VendorPayload;

function asArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim());
  return [];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await getUser(req);
    const payload = (await req.json()) as Payload;
    if (!payload?.role) throw new Error('role is required');
    if (!payload.event_code?.trim()) throw new Error('event_code is required');

    const admin = createAdminClient();
    const userClient = createUserClient(req);
    const { data: joinedEvent, error: joinError } = await userClient.rpc('join_event', {
      input_event_code: payload.event_code.trim()
    });
    if (joinError || !joinedEvent) throw joinError ?? new Error('Invalid event code');

    const profilePatch: Record<string, unknown> = {
      event_id: joinedEvent.id,
      onboarding_completed: false,
      email: user.email ?? null
    };

    if (payload.role === 'participant') {
      profilePatch.role = 'participant';
      profilePatch.full_name = payload.full_name;
      profilePatch.phone_number = payload.phone_number;

      const { data: participant, error: participantError } = await admin
        .from('participants')
        .upsert(
          {
            profile_id: user.id,
            event_id: joinedEvent.id,
            full_name: payload.full_name,
            email: user.email ?? '',
            phone_number: payload.phone_number,
            college_name: payload.college_name ?? null,
            organization: payload.organization ?? null,
            course: payload.course ?? null,
            year_of_study: payload.year_of_study ?? null,
            city: payload.city ?? null,
            state: payload.state ?? null,
            gender: payload.gender ?? null,
            emergency_contact: payload.emergency_contact ?? null,
            id_proof_url: payload.id_proof_url ?? null
          },
          { onConflict: 'profile_id' }
        )
        .select('id, qr_code_url')
        .single();

      if (participantError || !participant) throw participantError ?? new Error('Unable to save participant');

      const { data: token, error: tokenError } = await admin.rpc('generate_qr_code', {
        input_participant_id: participant.id
      });
      if (tokenError || !token) throw tokenError ?? new Error('Unable to generate QR pass');

      const qrPayload = JSON.stringify({
        participantId: participant.id,
        profileId: user.id,
        eventId: joinedEvent.id,
        qrToken: token
      });

      const svg = await QRCode.toString(qrPayload, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#0D1B2A',
          light: '#FFFFFF'
        }
      });

      const objectPath = `${user.id}/${participant.id}.svg`;
      const { error: uploadError } = await admin.storage.from('qr_codes').upload(objectPath, svg, {
        contentType: 'image/svg+xml',
        upsert: true
      });
      if (uploadError) throw uploadError;

      const { error: qrUpdateError } = await admin.from('participants').update({ qr_code_url: objectPath }).eq('id', participant.id);
      if (qrUpdateError) throw qrUpdateError;

      profilePatch.onboarding_completed = true;

      const { error: profileError } = await admin.from('profiles').update(profilePatch).eq('id', user.id);
      if (profileError) throw profileError;

      return json({
        ok: true,
        role: 'participant',
        event: joinedEvent,
        participantId: participant.id,
        qrCodePath: objectPath
      });
    }

    profilePatch.role = 'vendor';
    profilePatch.full_name = payload.owner_name;
    profilePatch.phone_number = payload.phone_number;

    const { data: vendor, error: vendorError } = await admin
      .from('vendors')
      .upsert(
        {
          profile_id: user.id,
          event_id: joinedEvent.id,
          vendor_name: payload.vendor_name,
          owner_name: payload.owner_name,
          phone_number: payload.phone_number,
          email: user.email ?? '',
          service_type: payload.service_type,
          stall_name: payload.stall_name ?? null,
          items_offered: asArray(payload.items_offered),
          pricing_range: payload.pricing_range ?? null,
          required_resources: asArray(payload.required_resources),
          setup_time: payload.setup_time ?? null,
          license_document_url: payload.license_document_url ?? null
        },
        { onConflict: 'profile_id' }
      )
      .select('id, stall_name')
      .single();

    if (vendorError || !vendor) throw vendorError ?? new Error('Unable to save vendor');

    const { data: existingStall } = await admin.from('stalls').select('id, name').eq('vendor_id', vendor.id).maybeSingle();
    if (!existingStall) {
      const { error: assignError } = await admin.rpc('assign_stall_to_vendor', {
        input_vendor_id: vendor.id
      });
      if (assignError) throw assignError;
    }

    profilePatch.onboarding_completed = true;
    const { error: profileError } = await admin.from('profiles').update(profilePatch).eq('id', user.id);
    if (profileError) throw profileError;

    const { data: stall } = await admin.from('stalls').select('id, name, location_zone, status').eq('vendor_id', vendor.id).maybeSingle();

    return json({
      ok: true,
      role: 'vendor',
      event: joinedEvent,
      vendorId: vendor.id,
      stall
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unable to complete onboarding' }, { status: 400 });
  }
});
