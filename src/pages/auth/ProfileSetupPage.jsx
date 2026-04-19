import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/common/PageTransition';
import { auth } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { upsertProfile, uploadProfilePhoto } from '../../services/auth.service';

const languages = [
  ['en', 'English'],
  ['hi', 'Hindi'],
  ['te', 'Telugu']
];

export default function ProfileSetupPage() {
  const { profile, refresh } = useAuth();
  const [name, setName] = useState(profile?.name || auth.currentUser?.displayName || '');
  const [language, setLanguage] = useState(profile?.language || 'en');
  const [seatZone, setSeatZone] = useState(profile?.seatZone || 'A');
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const save = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setBusy(true);
    setError('');
    try {
      await upsertProfile(uid, {
        name,
        email: auth.currentUser?.email || profile?.email || '',
        phone: auth.currentUser?.phoneNumber || profile?.phone || '',
        language,
        seatZone
      });
      if (photo) await uploadProfilePhoto(uid, photo);
      await refresh();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to save profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition className='mx-auto min-h-screen max-w-md p-5' role='main' aria-label='Profile setup page'>
      <div className='space-y-4 rounded-lg border border-white/10 bg-white/[0.06] p-5'>
        <div>
          <h1 className='font-heading text-2xl font-bold'>Complete Profile</h1>
          <p className='text-sm text-white/70'>Your preferences power language, ticket routing, and targeted alerts.</p>
        </div>
        <label className='block text-sm font-bold'>
          Full name
          <input
            aria-label='Full name'
            className='mt-2 w-full rounded-md border border-white/10 bg-white/10 p-3'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Full name'
          />
        </label>
        <label className='block text-sm font-bold'>
          Language
          <select
            aria-label='Language preference'
            className='mt-2 w-full rounded-md border border-white/10 bg-white/10 p-3'
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className='block text-sm font-bold'>
          Seat zone
          <select
            aria-label='Seat zone'
            className='mt-2 w-full rounded-md border border-white/10 bg-white/10 p-3'
            value={seatZone}
            onChange={(e) => setSeatZone(e.target.value)}
          >
            {['A', 'B', 'C', 'D'].map((zone) => (
              <option key={zone} value={zone}>
                Zone {zone}
              </option>
            ))}
          </select>
        </label>
        <label className='block text-sm font-bold'>
          Profile photo
          <input
            aria-label='Profile photo'
            className='mt-2 w-full rounded-md border border-dashed border-white/25 bg-white/5 p-3'
            type='file'
            accept='image/*'
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />
        </label>
        {error ? <p className='rounded-md bg-danger/15 p-3 text-sm text-red-100'>{error}</p> : null}
        <button disabled={busy || !name.trim()} className='w-full rounded-md bg-primary p-3 font-bold disabled:opacity-50' onClick={save}>
          Save Profile
        </button>
      </div>
    </PageTransition>
  );
}
