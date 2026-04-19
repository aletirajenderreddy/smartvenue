import { useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import { browseFoundItems, reportLostItem } from '../../services/lostfound.service';

export default function LostFoundPage() {
  const [tab, setTab] = useState('lost');
  const [items, setItems] = useState([]);
  const [matches, setMatches] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage('');
    try {
      const result = await reportLostItem({
        description: form.get('description'),
        location: form.get('location'),
        contactInfo: form.get('contactInfo'),
        photoFile: form.get('photo')?.size ? form.get('photo') : null,
        status: form.get('status') || 'lost'
      });
      setMatches(result.matches || []);
      setMessage('Report submitted. AI match check completed.');
      event.currentTarget.reset();
    } catch (err) {
      setMessage(err.message || 'Unable to submit report');
    } finally {
      setBusy(false);
    }
  };

  const browse = async () => {
    setTab('found');
    setItems(await browseFoundItems());
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Lost and found page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Lost & Found</h1>
        <p className='text-sm text-white/70'>Gemini embeddings suggest potential item matches.</p>
      </div>
      <div className='grid grid-cols-2 gap-2 rounded-md bg-white/10 p-1' role='tablist'>
        <button
          aria-label='Report lost item tab'
          role='tab'
          aria-selected={tab === 'lost'}
          onClick={() => setTab('lost')}
          className={`rounded px-3 py-2 text-sm font-bold ${tab === 'lost' ? 'bg-primary' : ''}`}
        >
          Report Lost
        </button>
        <button
          aria-label='Browse found items tab'
          role='tab'
          aria-selected={tab === 'found'}
          onClick={browse}
          className={`rounded px-3 py-2 text-sm font-bold ${tab === 'found' ? 'bg-primary' : ''}`}
        >
          Browse Found
        </button>
      </div>
      {tab === 'lost' ? (
        <>
          <form onSubmit={submit} className='space-y-3'>
            <input aria-label='Item description' required name='description' placeholder='Description' className='w-full rounded-md bg-white/10 p-3' />
            <input aria-label='Last known location' required name='location' placeholder='Last location' className='w-full rounded-md bg-white/10 p-3' />
            <input aria-label='Contact info' required name='contactInfo' placeholder='Contact info' className='w-full rounded-md bg-white/10 p-3' />
            <input aria-label='Item photo' name='photo' type='file' accept='image/*' className='w-full rounded-md border border-dashed border-white/25 bg-white/5 p-3' />
            <button disabled={busy} className='w-full rounded-md bg-primary p-3 font-bold disabled:opacity-50'>
              Submit Report
            </button>
          </form>
          {matches.length > 0 ? (
            <section className='rounded-lg border border-success/30 bg-success/15 p-4'>
              <p className='font-heading font-bold'>AI Suggested Matches</p>
              {matches.map((match) => (
                <p key={match.id} className='mt-2 text-sm'>
                  {match.description} at {match.location} (score: {match.score})
                </p>
              ))}
            </section>
          ) : null}
        </>
      ) : (
        <section className='space-y-3'>
          {items.map((item) => (
            <article key={item.id} className='rounded-lg border border-white/10 bg-white/[0.06] p-4'>
              <p className='font-bold'>{item.description}</p>
              <p className='text-sm text-white/70'>{item.location}</p>
              {item.photo ? <img src={item.photo} alt='' className='mt-3 h-32 w-full rounded-md object-cover' /> : null}
            </article>
          ))}
          {items.length === 0 ? <p className='rounded-md bg-white/10 p-3'>No found items are listed yet.</p> : null}
        </section>
      )}
      {message ? <p className='rounded-md bg-white/10 p-3 text-sm'>{message}</p> : null}
    </PageTransition>
  );
}
