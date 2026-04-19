import { createContext, useEffect, useMemo, useState } from 'react';
import { fetchEventById } from '../services/eventflow.service';
import { getActiveSession, getUserProfile, onAuthStateChange } from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  async function hydrate(nextSession) {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (!nextUser) {
      setProfile(null);
      setActiveEvent(null);
      setLoading(false);
      return;
    }

    const nextProfile = await getUserProfile(nextUser.id);
    setProfile(nextProfile);
    const nextEvent = nextProfile?.event_id ? await fetchEventById(nextProfile.event_id) : null;
    setActiveEvent(nextEvent);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    getActiveSession()
      .then((currentSession) => {
        if (mounted) hydrate(currentSession);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription }
    } = onAuthStateChange((_event, nextSession) => {
      hydrate(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      activeEvent,
      loading,
      refresh: async () => hydrate(await getActiveSession())
    }),
    [session, user, profile, activeEvent, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
