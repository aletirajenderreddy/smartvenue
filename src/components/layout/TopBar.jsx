import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ title, action }) {
  const navigate = useNavigate();
  return (
    <header className='sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-navy/95 p-3 backdrop-blur'>
      <div className='flex items-center gap-2'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          aria-label='Go back'
          className='grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white'
        >
          <ArrowLeft aria-hidden='true' size={18} />
        </button>
        <h1 className='font-heading text-lg font-semibold'>{title}</h1>
      </div>
      {action}
    </header>
  );
}
