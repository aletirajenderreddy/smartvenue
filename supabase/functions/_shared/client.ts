import { createClient } from '@supabase/supabase-js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export function createUserClient(req: Request) {
  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: req.headers.get('Authorization') ?? ''
      }
    }
  });
}

export function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function getUser(req: Request) {
  const client = createUserClient(req);
  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return { client, user };
}
