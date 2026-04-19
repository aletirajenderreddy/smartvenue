export default function QRDisplay({ src, label = 'Secure QR code' }) {
  return (
    <div className='mx-auto w-full max-w-sm rounded-lg bg-white p-4 shadow-2xl'>
      <img src={src} alt={label} className='aspect-square w-full rounded-md' />
    </div>
  );
}
