import { useEffect, useState } from 'react';

export default function useGeolocation() {
  const [loc, setLoc] = useState({ lat: 12.9716, lng: 77.5946, error: '' });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoc((current) => ({ ...current, error: 'GPS is not available on this device' }));
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (position) =>
        setLoc({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: ''
        }),
      (error) => setLoc((current) => ({ ...current, error: error.message })),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return loc;
}
