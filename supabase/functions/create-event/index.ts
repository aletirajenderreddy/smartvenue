import { corsHeaders, json } from '../_shared/cors.ts';
import { createAdminClient, getUser } from '../_shared/client.ts';

type Payload = {
  event_name: string;
  event_description: string;
  city: string;
  venue_name: string;
  latitude?: number | null;
  longitude?: number | null;
  event_start_date: string;
  event_end_date: string;
  max_participants: number;
  number_of_stalls: number;
  event_category: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  optional_banner_image?: string | null;
};

function required(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${label} is required`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await getUser(req);
    const payload = (await req.json()) as Payload;

    required(payload.event_name, 'event_name');
    required(payload.city, 'city');
    required(payload.venue_name, 'venue_name');
    required(payload.event_start_date, 'event_start_date');
    required(payload.event_end_date, 'event_end_date');
    required(payload.max_participants, 'max_participants');
    required(payload.event_category, 'event_category');

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile?.role !== 'admin') {
      throw new Error('Select the admin role before creating an event');
    }

    const { data: event, error: eventError } = await admin
      .from('events')
      .insert({
        name: payload.event_name,
        description: payload.event_description ?? '',
        location: {
          city: payload.city,
          venue_name: payload.venue_name
        },
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        start_date: payload.event_start_date,
        end_date: payload.event_end_date,
        max_participants: payload.max_participants,
        number_of_stalls: payload.number_of_stalls ?? 0,
        category: payload.event_category,
        contact_email: payload.contact_email ?? user.email ?? null,
        contact_phone: payload.contact_phone ?? null,
        banner_url: payload.optional_banner_image ?? null,
        admin_id: user.id,
        event_code: undefined
      })
      .select('*')
      .single();

    if (eventError) throw eventError;

    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({
        event_id: event.id,
        onboarding_completed: true,
        email: user.email ?? null
      })
      .eq('id', user.id);

    if (profileUpdateError) throw profileUpdateError;

    return json({ ok: true, event });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unable to create event' }, { status: 400 });
  }
});
