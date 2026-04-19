import { useEffect } from 'react';

export default function HeatmapLayer({ map, zones }) {
  useEffect(() => {
    if (!map || !google?.maps?.visualization) return;
    const data = zones
      .filter((z) => z?.coordinates?.lat && z?.coordinates?.lng)
      .map((z) => ({ location: new google.maps.LatLng(z.coordinates.lat, z.coordinates.lng), weight: z.currentCount || 1 }));
    const heat = new google.maps.visualization.HeatmapLayer({
      data,
      map,
      radius: 40,
      opacity: 0.7,
      gradient: [
        'rgba(52,168,83,0)',
        'rgba(52,168,83,0.8)',
        'rgba(249,171,0,0.9)',
        'rgba(234,67,53,1)',
        'rgba(126,87,194,1)'
      ]
    });
    return () => heat.setMap(null);
  }, [map, zones]);

  return null;
}
