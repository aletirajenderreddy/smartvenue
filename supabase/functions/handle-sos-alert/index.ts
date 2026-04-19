import { corsHeaders, json } from '../_shared/cors.ts';
import { createUserClient, getUser } from '../_shared/client.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    await getUser(req);
    const payload = await req.json();
    if (!payload?.eventId) throw new Error('eventId is required');

    const userClient = createUserClient(req);
    const { data, error } = await userClient.rpc('handle_sos_alert', {
      input_event_id: payload.eventId,
      input_location: payload.location ?? {},
      input_message: payload.message ?? null
    });

    if (error) throw error;

    return json({ ok: true, alert: data });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unable to send SOS alert' }, { status: 400 });
  }
});
