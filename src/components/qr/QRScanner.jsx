import { useEffect, useMemo, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan, onStateChange }) {
  const id = useMemo(() => `qr-reader-${Math.random().toString(36).slice(2, 8)}`, []);
  const lastRef = useRef({ token: '', at: 0 });
  const busyRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(id, { fps: 10, qrbox: 250 });
    scanner.render(
      async (text) => {
        const now = Date.now();
        if (busyRef.current) return;
        if (lastRef.current.token === text && now - lastRef.current.at < 5000) {
          onStateChange?.('duplicate');
          return;
        }
        busyRef.current = true;
        onStateChange?.('processing');
        try {
          await onScan(text);
          lastRef.current = { token: text, at: now };
          onStateChange?.('success');
        } catch (_error) {
          onStateChange?.('error');
        } finally {
          busyRef.current = false;
        }
      },
      () => {}
    );
    return () => scanner.clear();
  }, [id, onScan, onStateChange]);

  return <div id={id} />;
}
