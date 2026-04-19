import { useEffect, useState, useCallback } from 'react';
import { Bell, Clock } from 'lucide-react';
import PageTransition from '../../components/common/PageTransition';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { timeAgo } from '../../utils/crowd';

export default function NotificationsListPage() {
  const { activeEvent, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeEvent?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('event_id', activeEvent.id)
      .or(`target_role.is.null,target_role.eq.${profile?.role || 'participant'}`)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [activeEvent?.id, profile?.role]);

  useEffect(() => {
    load();
    const channel = supabase.channel('notifications-page');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, load);
    channel.subscribe();
    return () => supabase.removeChannel(channel);
  }, [load]);

  if (loading) {
    return (
      <PageTransition className='space-y-3'>
        {[1, 2, 3].map((i) => <div key={i} className='h-20 animate-pulse rounded-2xl bg-white/10' />)}
      </PageTransition>
    );
  }

  return (
    <PageTransition className='space-y-5'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>🔔 Notifications</h1>
        <p className='mt-0.5 text-sm text-white/50'>Event announcements and updates</p>
      </div>

      {notifications.length ? (
        <div className='space-y-3'>
          {notifications.map((note) => (
            <div key={note.id} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <div className='flex items-start gap-3'>
                <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20'>
                  <Bell size={14} className='text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm text-white leading-relaxed'>{note.message}</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Clock size={11} className='text-white/30' />
                    <p className='text-[11px] text-white/40'>{timeAgo(note.created_at)}</p>
                    {note.target_role ? (
                      <span className='rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary'>
                        {note.target_role}
                      </span>
                    ) : (
                      <span className='rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40'>All</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title='No notifications yet' description="You'll see event announcements here." />
      )}
    </PageTransition>
  );
}
