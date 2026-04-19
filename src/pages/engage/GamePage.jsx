import { useEffect, useMemo, useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import { collectStamp, recordTriviaScore, subscribeLeaderboard } from '../../services/engagement.service';
import { useAuth } from '../../hooks/useAuth';

const questions = [
  { q: 'Nearest gate to Zone A?', a: 'gate 1' },
  { q: 'Emergency number in India?', a: '112' },
  { q: 'Low crowd threshold percentage?', a: '40' },
  { q: 'Which page shows bus ETAs?', a: 'transport' },
  { q: 'How many hotspot stamps unlock the badge?', a: '5' }
];

const hotspots = ['gate-a', 'zone-b', 'heritage-wall', 'fan-zone', 'merch-hub'];

export default function GamePage() {
  const { profile, refresh } = useAuth();
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [correct, setCorrect] = useState(0);
  const [timer, setTimer] = useState(30);
  const [done, setDone] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => subscribeLeaderboard(setLeaders), []);
  useEffect(() => {
    if (done) return undefined;
    const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (timer === 0 && !done) finish();
  }, [timer, done]);

  const stamps = useMemo(() => profile?.stamps || [], [profile?.stamps]);

  const submit = () => {
    const ok = answer.trim().toLowerCase() === questions[idx].a;
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    setAnswer('');
    if (idx === questions.length - 1) {
      finish(nextCorrect);
    } else {
      setIdx((value) => value + 1);
    }
  };

  const finish = async (finalCorrect = correct) => {
    setDone(true);
    const points = finalCorrect * 10;
    try {
      await recordTriviaScore({ eventId: 'demoEvent', points, correct: finalCorrect });
      await refresh();
      setMessage(`Score saved. You earned ${points} loyalty points.`);
    } catch (err) {
      setMessage(err.message || 'Score could not be saved');
    }
  };

  const scanStamp = async (hotspotId) => {
    try {
      const result = await collectStamp({ hotspotId });
      await refresh();
      setMessage(result.completed ? 'Souvenir badge unlocked.' : `Stamp collected. ${result.stamps.length}/5 complete.`);
    } catch (err) {
      setMessage(err.message || 'Stamp scan failed');
    }
  };

  return (
    <PageTransition className='space-y-5 p-4' role='main' aria-label='Game page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Trivia & Stamps</h1>
        <p className='text-sm text-white/70'>Earn loyalty points and unlock a souvenir badge.</p>
      </div>

      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
        <div className='flex items-center justify-between'>
          <p className='font-bold'>Question {Math.min(idx + 1, questions.length)} of {questions.length}</p>
          <p className='rounded-full bg-primary px-3 py-1 text-sm font-bold'>{timer}s</p>
        </div>
        <p className='mt-4 text-lg'>{questions[idx].q}</p>
        {!done ? (
          <div className='mt-4 flex gap-2'>
            <input
              className='min-w-0 flex-1 rounded-md border border-white/10 bg-white/10 p-3'
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              aria-label='Trivia answer'
            />
            <button className='rounded-md bg-success px-4 font-bold text-navy' onClick={submit}>
              Answer
            </button>
          </div>
        ) : (
          <p className='mt-4 rounded-md bg-success/15 p-3 text-sm'>Round complete: {correct} correct.</p>
        )}
      </section>

      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
        <h2 className='font-heading text-lg font-bold'>Stamp Collection</h2>
        <div className='mt-3 grid grid-cols-2 gap-2'>
          {hotspots.map((hotspot) => {
            const collected = stamps.includes(hotspot);
            return (
              <button
                key={hotspot}
                className={`rounded-md p-3 text-sm font-bold ${collected ? 'bg-success text-navy' : 'bg-white/10'}`}
                onClick={() => scanStamp(hotspot)}
              >
                {hotspot.replaceAll('-', ' ')}
              </button>
            );
          })}
        </div>
      </section>

      <section className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
        <h2 className='font-heading text-lg font-bold'>Leaderboard</h2>
        <div className='mt-3 space-y-2'>
          {leaders.map((user, index) => (
            <p key={user.id} className='flex justify-between rounded-md bg-white/5 p-2 text-sm'>
              <span>{index + 1}. {user.name || 'Fan'}</span>
              <span>{user.loyaltyPoints || 0}</span>
            </p>
          ))}
        </div>
      </section>

      {message ? <p className='rounded-md bg-primary/20 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
