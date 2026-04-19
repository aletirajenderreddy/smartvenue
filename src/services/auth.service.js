import { supabase } from '../config/supabase';

function throwIfError(error, fallback) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

export async function signUpEmail({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });
  throwIfError(error, 'Unable to create account');
  return data;
}

export async function signInEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  throwIfError(error, 'Unable to sign in');
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  throwIfError(error, 'Unable to sign out');
}

export async function getActiveSession() {
  const { data, error } = await supabase.auth.getSession();
  throwIfError(error, 'Unable to get session');
  return data.session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getUserProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  throwIfError(error, 'Unable to load profile');
  return data;
}

export async function setUserRole(role) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sign in required');

  const { error } = await supabase
    .from('profiles')
    .update({
      role,
      onboarding_completed: false
    })
    .eq('id', user.id);

  throwIfError(error, 'Unable to save role');
}

export async function updateOwnProfile(patch) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Sign in required');
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  throwIfError(error, 'Unable to update profile');
}
