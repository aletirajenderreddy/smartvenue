import QRCode from 'qrcode';
import { corsHeaders, json } from '../_shared/cors.ts';
import { createAdminClient, getUser } from '../_shared/client.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user } = await getUser(req);
    const admin = createAdminClient();
    const payload = await req.json().catch(() => ({}));
    const participantId = payload?.participantId as string | undefined;

    const participantQuery = admin
      .from('participants')
      .select('id, profile_id, event_id, qr_code_url')
      .eq(participantId ? 'id' : 'profile_id', participantId ?? user.id)
      .single();

    const { data: participant, error: participantError } = await participantQuery;
    if (participantError || !participant) throw new Error('Participant not found');
    if (participant.profile_id !== user.id) {
      const { data: profile } = await admin.from('profiles').select('role, event_id').eq('id', user.id).single();
      if (profile?.role !== 'admin' || profile?.event_id !== participant.event_id) {
        throw new Error('You do not have access to this participant pass');
      }
    }

    const { data: token, error: tokenError } = await admin.rpc('generate_qr_code', {
      input_participant_id: participant.id
    });
    if (tokenError || !token) throw tokenError ?? new Error('Unable to generate QR token');

    const qrPayload = JSON.stringify({
      participantId: participant.id,
      profileId: participant.profile_id,
      eventId: participant.event_id,
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

    const objectPath = `${participant.profile_id}/${participant.id}.svg`;
    const { error: uploadError } = await admin.storage.from('qr_codes').upload(objectPath, svg, {
      contentType: 'image/svg+xml',
      upsert: true
    });
    if (uploadError) throw uploadError;

    const { error: updateError } = await admin
      .from('participants')
      .update({ qr_code_url: objectPath })
      .eq('id', participant.id);
    if (updateError) throw updateError;

    return json({
      ok: true,
      participantId: participant.id,
      qrCodePath: objectPath,
      qrToken: token
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unable to generate QR code' }, { status: 400 });
  }
});
