import { useEffect, useMemo, useRef, useState } from 'react';
import { mapsLoader } from '../../config/maps';
import { densityColor } from '../../utils/crowdUtils';

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

function markerPosition(marker) {
  const lat = Number(marker.latitude ?? marker.currentLat ?? marker.lat);
  const lng = Number(marker.longitude ?? marker.currentLng ?? marker.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function floorOverlayUrl() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620">
    <rect width="900" height="620" rx="44" fill="#0D1B2A" opacity="0.84"/>
    <ellipse cx="450" cy="310" rx="330" ry="220" fill="none" stroke="#1A73E8" stroke-width="22" opacity="0.7"/>
    <ellipse cx="450" cy="310" rx="210" ry="120" fill="none" stroke="#34A853" stroke-width="12" opacity="0.75"/>
    <path d="M120 120H780M120 500H780M120 120V500M780 120V500" stroke="#fff" stroke-opacity="0.35" stroke-width="6"/>
    <text x="110" y="95" fill="#fff" font-family="Arial" font-size="42">Gate 1</text>
    <text x="660" y="95" fill="#fff" font-family="Arial" font-size="42">Gate 2</text>
    <text x="110" y="565" fill="#fff" font-family="Arial" font-size="42">Gate 3</text>
    <text x="660" y="565" fill="#fff" font-family="Arial" font-size="42">Gate 4</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function VenueMap({ markers = [], zones = [], showHeatmap = true, className = 'h-80 rounded-lg' }) {
  const mapRef = useRef(null);
  const [error, setError] = useState('');
  const center = useMemo(() => markerPosition(markers[0]) || zones[0]?.coordinates || defaultCenter, [markers, zones]);

  useEffect(() => {
    let map;
    let heatmap;
    let overlay;
    let pulseTimer;
    const mapObjects = [];

    mapsLoader
      .load()
      .then(() => {
        const google = window.google;
        map = new google.maps.Map(mapRef.current, {
          center,
          zoom: 17,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeId: 'roadmap',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#17263d' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#d7e3ff' }] },
            { featureType: 'poi', stylers: [{ visibility: 'off' }] },
            { featureType: 'road', stylers: [{ color: '#223654' }] }
          ]
        });

        const bounds = {
          north: center.lat + 0.0034,
          south: center.lat - 0.0034,
          east: center.lng + 0.0046,
          west: center.lng - 0.0046
        };
        overlay = new google.maps.GroundOverlay(floorOverlayUrl(), bounds, { opacity: 0.28 });
        overlay.setMap(map);

        markers.forEach((marker) => {
          const position = markerPosition(marker);
          if (!position) return;
          mapObjects.push(
            new google.maps.Marker({
              map,
              position,
              title: marker.name || marker.route || marker.id,
              label: marker.waitMinutes != null ? `${marker.waitMinutes}m` : undefined
            })
          );
        });

        const zoneCircles = zones
          .filter((zone) => zone?.coordinates?.lat && zone?.coordinates?.lng)
          .map((zone) => {
            const ratio = Number(zone.currentCount || 0) / Number(zone.capacity || 1);
            const circle = new google.maps.Circle({
              map,
              center: { lat: zone.coordinates.lat, lng: zone.coordinates.lng },
              radius: 42 + ratio * 90,
              fillColor: densityColor(ratio),
              fillOpacity: 0.28,
              strokeColor: densityColor(ratio),
              strokeOpacity: 0.9,
              strokeWeight: 2
            });
            mapObjects.push(circle);
            return circle;
          });

        if (showHeatmap && google.maps.visualization && zones.length) {
          const heatData = zones
            .filter((zone) => zone?.coordinates?.lat && zone?.coordinates?.lng)
            .map((zone) => ({
              location: new google.maps.LatLng(zone.coordinates.lat, zone.coordinates.lng),
              weight: Math.max(1, Number(zone.currentCount || 1))
            }));
          heatmap = new google.maps.visualization.HeatmapLayer({
            data: heatData,
            radius: 55,
            opacity: 0.58,
            gradient: [
              'rgba(52,168,83,0)',
              'rgba(52,168,83,0.8)',
              'rgba(249,171,0,0.9)',
              'rgba(234,67,53,1)',
              'rgba(126,87,194,1)'
            ]
          });
          heatmap.setMap(map);
        }

        let grow = true;
        pulseTimer = window.setInterval(() => {
          zoneCircles.forEach((circle) => {
            const next = Math.max(35, circle.getRadius() + (grow ? 5 : -5));
            circle.setRadius(next);
          });
          grow = !grow;
        }, 1200);
      })
      .catch((err) => setError(err.message || 'Map unavailable'));

    return () => {
      mapObjects.forEach((object) => object.setMap(null));
      if (heatmap) heatmap.setMap(null);
      if (overlay) overlay.setMap(null);
      if (pulseTimer) window.clearInterval(pulseTimer);
    };
  }, [center, markers, showHeatmap, zones]);

  if (error) {
    return (
      <div className={`${className} grid place-items-center border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70`}>
        Map unavailable. Live lists and routing recommendations still work offline.
      </div>
    );
  }

  return <div aria-label='Venue map' ref={mapRef} className={`${className} overflow-hidden border border-white/10 bg-white/5`} />;
}
