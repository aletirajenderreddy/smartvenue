import { useMemo, useState } from 'react';
import PageTransition from '../../components/common/PageTransition';
import VenueMap from '../../components/maps/VenueMap';
import useCrowd from '../../hooks/useCrowd';
import useGeolocation from '../../hooks/useGeolocation';
import useQueue from '../../hooks/useQueue';
import { useCrowdStore } from '../../store/useCrowdStore';

const destinations = [
  ['seat', 'My seat'],
  ['food', 'Nearest food stall'],
  ['exit', 'Least crowded exit'],
  ['aid', 'First aid']
];

export default function NavigatePage() {
  useCrowd();
  const location = useGeolocation();
  const stalls = useQueue();
  const zones = useCrowdStore((s) => s.zones);
  const [destination, setDestination] = useState('seat');

  const quietZones = useMemo(
    () => [...zones].sort((a, b) => (a.currentCount || 0) / (a.capacity || 1) - (b.currentCount || 0) / (b.capacity || 1)),
    [zones]
  );
  const fastestStall = [...stalls].sort((a, b) => Number(a.waitMinutes || 0) - Number(b.waitMinutes || 0))[0];
  const quiet = quietZones[0];
  const eta = destination === 'food' ? 6 + Number(fastestStall?.waitMinutes || 0) : destination === 'exit' ? 5 : 8;

  const steps = [
    `Start from current GPS (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}).`,
    `Use ${quiet?.name || 'the lowest-density corridor'} to avoid crowd pressure.`,
    destination === 'food'
      ? `Proceed to ${fastestStall?.name || 'the nearest open stall'} with current wait of ${fastestStall?.waitMinutes || 0} minutes.`
      : destination === 'exit'
        ? `Follow signage to ${quiet?.recommendedExit || quiet?.name || 'Gate 2'} for the smoothest exit.`
        : destination === 'aid'
          ? 'Move to the nearest AED or first-aid desk shown on the venue overlay.'
          : 'Continue to your assigned seat zone and keep right on the concourse.',
    `Walking ETA: ${eta} minutes.`
  ];

  return (
    <PageTransition className='space-y-4 p-4' role='main' aria-label='Navigation page'>
      <div>
        <h1 className='font-heading text-2xl font-bold'>Smart Navigation</h1>
        <p className='text-sm text-white/70'>Routes prefer lower-density zones and open corridors.</p>
      </div>
      <div className='grid grid-cols-2 gap-2' role='tablist' aria-label='Destination'>
        {destinations.map(([value, label]) => (
          <button
            key={value}
            role='tab'
            aria-selected={destination === value}
            className={`rounded-md p-3 text-sm font-bold ${destination === value ? 'bg-primary' : 'bg-white/10'}`}
            onClick={() => setDestination(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <VenueMap markers={fastestStall ? [fastestStall] : []} zones={zones} className='h-80 rounded-lg' />
      {location.error ? <p className='rounded-md bg-warning/15 p-3 text-sm text-warning'>{location.error}</p> : null}
      <ol className='space-y-2'>
        {steps.map((step, index) => (
          <li key={step} className='flex gap-3 rounded-lg bg-white/[0.06] p-3 text-sm'>
            <span className='grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary font-bold'>{index + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </PageTransition>
  );
}
