/**
 * chatbot.service.js
 * Role-aware Gemini chatbot with local data fallback.
 */
import { geminiClient } from '../config/gemini';

/**
 * Build a rich system prompt tailored to the user's role and live event data.
 */
function buildSystemPrompt(role, contextData, event) {
  const eventName = event?.name || 'this event';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const scheduleText = (contextData?.schedule || [])
    .slice(0, 6)
    .map((s) => `  • ${new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — ${s.title}${s.location ? ` @ ${s.location}` : ''}`)
    .join('\n') || '  (No schedule set yet)';

  const notifText = (contextData?.notifications || [])
    .slice(0, 3)
    .map((n) => `  • ${n.message}`)
    .join('\n') || '  (No recent announcements)';

  if (role === 'admin') {
    const pCount = contextData?.participants?.length ?? 0;
    const vCount = contextData?.vendors?.length ?? 0;
    const sosOpen = (contextData?.sos || []).filter((s) => s.status !== 'resolved').length;
    const liveOrders = (contextData?.orders || []).filter((o) => o.status !== 'completed').length;

    return `You are SmartVenueX AdminBot — an intelligent event operations assistant for admins.
Event: "${eventName}" | Date: ${today}
Stats: ${pCount} participants, ${vCount} vendors, ${sosOpen} open SOS alerts, ${liveOrders} live orders.
Recent announcements:
${notifText}
Schedule overview:
${scheduleText}
Help the admin manage crowd control, vendors, SOS alerts, notifications, and overall event operations.
Be concise, practical, and professional. If asked to perform an action (like send notification), explain how to do it in the dashboard.`;
  }

  if (role === 'participant') {
    const participant = contextData?.participant;
    const seatNo = participant?.seat_number ?? '—';
    const participantName = participant?.full_name ?? 'Attendee';
    const wifiSsid = event?.wifi_ssid ?? null;
    const stallList = (contextData?.stalls || []).slice(0, 5).map((s) => s.name).join(', ') || 'None open yet';
    const helplines = (event?.helpline_numbers || []).map((h) => `${h.label}: ${h.number}`).join(', ') || 'Contact admin desk';

    return `You are SmartVenueX EventGuide — a friendly, helpful assistant for event participants.
Event: "${eventName}" | Date: ${today}
Participant: ${participantName} | Seat: ${seatNo}
${wifiSsid ? `WiFi: Network "${wifiSsid}" (ask staff for password if needed)` : ''}
Open stalls: ${stallList}
Helplines: ${helplines}
Schedule today:
${scheduleText}
Recent announcements:
${notifText}
Help the participant navigate the venue, find stalls, check the schedule, understand their seat and QR pass, and get emergency help.
Be warm, clear and concise. Keep answers short (2–4 sentences max).`;
  }

  // Vendor
  const vendor = contextData?.vendor;
  const vendorName = vendor?.vendor_name ?? 'Vendor';
  const stallName = vendor?.stall_name ?? 'your stall';
  const pendingOrders = (contextData?.orders || []).filter((o) => !['completed', 'cancelled'].includes(o.status)).length;

  return `You are SmartVenueX VendorBot — a support assistant for event vendors.
Event: "${eventName}" | Date: ${today}
Vendor: ${vendorName} | Stall: ${stallName} | Pending orders: ${pendingOrders}
Schedule overview:
${scheduleText}
Recent announcements:
${notifText}
Help the vendor manage their order queue, understand event rules, set up their stall, and handle customer queries.
Be practical and direct. If you don't know something specific, direct them to the admin desk.`;
}

/**
 * Search local data for answer keywords — used as fallback when Gemini is unavailable.
 */
function localFallback(message, role, contextData, event) {
  const q = message.toLowerCase();

  // WiFi query
  if (q.includes('wifi') || q.includes('wi-fi') || q.includes('internet') || q.includes('password')) {
    if (event?.wifi_ssid) {
      return `WiFi network: **${event.wifi_ssid}**${event.wifi_password ? ` | Password: **${event.wifi_password}**` : ''}. Connect and enjoy the event!`;
    }
    return 'WiFi details have not been set for this event yet. Please contact the admin desk.';
  }

  // Helpline query
  if (q.includes('help') || q.includes('emergency') || q.includes('contact') || q.includes('number') || q.includes('call')) {
    const helplines = event?.helpline_numbers || [];
    if (helplines.length > 0) {
      return `Helpline contacts:\n${helplines.map((h) => `• **${h.label}**: ${h.number}`).join('\n')}`;
    }
    if (event?.contact_phone) {
      return `Admin contact: ${event.contact_phone}${event.contact_email ? ` | Email: ${event.contact_email}` : ''}`;
    }
    return 'For emergencies, use the SOS button in your dashboard or find the nearest event staff.';
  }

  // Schedule query
  if (q.includes('schedule') || q.includes('when') || q.includes('time') || q.includes('session') || q.includes('workshop') || q.includes('next')) {
    const schedule = (contextData?.schedule || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const now = Date.now();
    const upcoming = schedule.filter((s) => new Date(s.start_time).getTime() > now).slice(0, 3);
    if (upcoming.length > 0) {
      return `Upcoming sessions:\n${upcoming.map((s) => {
        const t = new Date(s.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        return `• **${t}** — ${s.title}${s.location ? ` @ ${s.location}` : ''}${s.speaker ? ` (${s.speaker})` : ''}`;
      }).join('\n')}`;
    }
    if (schedule.length > 0) {
      return `Event schedule has ${schedule.length} session(s). Check the Schedule tab in your dashboard for full details.`;
    }
    return 'Schedule has not been published yet. Check back soon or contact the admin.';
  }

  // Seat query
  if (q.includes('seat') || q.includes('number') || q.includes('pass') || q.includes('ticket') || q.includes('qr')) {
    const participant = contextData?.participant;
    if (participant?.seat_number) {
      return `Your seat number is **${participant.seat_number}**. You can view and download your QR pass from the "My Pass" section in your dashboard.`;
    }
    return 'Your seat number will appear on your QR pass in the dashboard once assigned.';
  }

  // Stall/food query
  if (q.includes('stall') || q.includes('food') || q.includes('eat') || q.includes('order') || q.includes('vendor')) {
    const stalls = (contextData?.stalls || []).filter((s) => s.status === 'active');
    if (stalls.length > 0) {
      return `Active stalls:\n${stalls.slice(0, 5).map((s) => `• **${s.name}** (${s.location_zone})`).join('\n')}\nOrder from the Food tab in your dashboard.`;
    }
    return 'No stalls are active yet. Check back soon or visit the Food tab in your dashboard.';
  }

  // Crowd/zone query
  if (q.includes('crowd') || q.includes('zone') || q.includes('busy') || q.includes('area') || q.includes('congested')) {
    const zones = contextData?.zones || [];
    if (zones.length > 0) {
      const sorted = [...zones].sort((a, b) => a.crowd_density - b.crowd_density);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return `Current crowd status — Least busy: **${best.name}** (${best.crowd_density}%), Most busy: **${worst.name}** (${worst.crowd_density}%). Check the live map for full view.`;
    }
    return 'Live crowd data is being updated. Check the Crowd Map in your dashboard.';
  }

  // Notification query
  if (q.includes('announcement') || q.includes('update') || q.includes('news') || q.includes('notice')) {
    const notifs = (contextData?.notifications || []).slice(0, 3);
    if (notifs.length > 0) {
      return `Latest announcements:\n${notifs.map((n) => `• ${n.message}`).join('\n')}`;
    }
    return 'No announcements yet. Check the Notifications section in your dashboard.';
  }

  // SOS/admin-specific
  if (role === 'admin') {
    if (q.includes('sos') || q.includes('alert') || q.includes('incident')) {
      const open = (contextData?.sos || []).filter((s) => s.status !== 'resolved');
      return open.length > 0
        ? `There are **${open.length}** open SOS alert(s). Go to Admin → SOS to manage them.`
        : 'No open SOS alerts. All incidents are resolved.';
    }
    if (q.includes('participant') || q.includes('attendee')) {
      return `Currently **${contextData?.participants?.length ?? 0}** participants have joined. View them in Admin → Participants.`;
    }
  }

  // Generic fallback
  return `I'm your SmartVenueX assistant for **${event?.name || 'this event'}**. I can help with WiFi info, schedule, seat numbers, stalls, crowd zones, and emergency contacts. Try asking: "What's the WiFi password?", "What's next on schedule?", or "Where's my seat?"`;
}

/**
 * Main chatbot function.
 * Tries Gemini first; falls back to local data-driven answers.
 */
export async function askChatbot(message, role, contextData, event) {
  // Try Gemini if API key is present
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const systemPrompt = buildSystemPrompt(role, contextData, event);

      const result = await Promise.race([
        model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Understood! I\'m ready to assist.' }] },
            { role: 'user', parts: [{ text: message }] },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 8000)),
      ]);

      const text = result.response.text();
      if (text) return { reply: text, source: 'gemini' };
      throw new Error('Empty response');
    } catch (_err) {
      // Fall through to local fallback
    }
  }

  // Local fallback
  const reply = localFallback(message, role, contextData, event);
  return { reply, source: 'local' };
}
