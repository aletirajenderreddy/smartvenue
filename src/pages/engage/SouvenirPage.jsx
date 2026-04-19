import { useEffect, useRef, useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import { useAuth } from '../../hooks/useAuth';

export default function SouvenirPage() {
  const canvasRef = useRef(null);
  const { profile } = useAuth();
  const [url, setUrl] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 900, 500);
    gradient.addColorStop(0, '#1A73E8');
    gradient.addColorStop(1, '#34A853');
    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, 900, 500);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(48, 70, 804, 350);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('SmartVenueX Souvenir', 80, 150);
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(profile?.name || 'Fan', 80, 235);
    ctx.font = '28px sans-serif';
    ctx.fillText('Championship Final', 80, 300);
    ctx.fillText(`Loyalty points: ${profile?.loyaltyPoints || 0}`, 80, 350);
    ctx.fillStyle = '#34A853';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(profile?.souvenirUnlocked ? 'Badge unlocked' : 'Collect all stamps to unlock the badge', 80, 402);
    setUrl(canvas.toDataURL('image/png'));
  }, [profile]);

  const share = async () => {
    if (navigator.share && url) {
      await navigator.share({ title: 'SmartVenueX Souvenir', text: 'My event souvenir badge', url });
    }
  };

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Souvenir page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Souvenir Badge</h1>
        <p className='text-sm text-white/70'>A personalized event card generated with the canvas API.</p>
      </div>
      <canvas ref={canvasRef} width='900' height='500' className='w-full rounded-lg border border-white/10' />
      <div className='grid grid-cols-2 gap-3'>
        <a href={url} download='smartvenuex-souvenir.png' className='rounded-md bg-primary p-3 text-center font-bold'>
          Download
        </a>
        <button className='rounded-md bg-success p-3 font-bold text-navy' onClick={share}>
          Share
        </button>
      </div>
    </PageTransition>
  );
}
