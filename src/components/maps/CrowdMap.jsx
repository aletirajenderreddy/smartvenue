/**
 * CrowdMap.jsx
 * Google Maps integration with radial zone overlays showing crowd density.
 * Zones are approximated as circles offset radially from the event center.
 * Green = low density, Amber = medium, Red = high.
 */
import { useEffect, useRef, useState } from 'react';
import { mapsLoader } from '../../config/maps';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Approximate zone lat/lng by distributing evenly in a ring around the event center.
 * Radius in meters ≈ 80m per zone ring.
 */
function approximateZonePositions(zones, centerLat, centerLng) {
  if (!zones.length) return [];
  const RADIUS_M = 0.0007; // ~78m in degrees (rough approximation)
  return zones.map((zone, i) => {
    const angle = (2 * Math.PI * i) / zones.length;
    const lat = centerLat + RADIUS_M * Math.cos(angle);
    const lng = centerLng + RADIUS_M * 1.4 * Math.sin(angle); // 1.4x for lng aspect ratio
    return { ...zone, approxLat: lat, approxLng: lng };
  });
}

function densityColor(density, alpha = 0.45) {
  if (density >= 70) return `rgba(239,68,68,${alpha})`;   // red
  if (density >= 40) return `rgba(251,191,36,${alpha})`;  // amber
  return `rgba(52,211,153,${alpha})`;                      // green
}

function densityStroke(density) {
  if (density >= 70) return '#ef4444';
  if (density >= 40) return '#fbbf24';
  return '#34d399';
}

function densityLabel(density) {
  if (density >= 70) return { text: 'High', cls: 'text-red-400 bg-red-500/20 border-red-500/30' };
  if (density >= 40) return { text: 'Medium', cls: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
  return { text: 'Low', cls: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
}

/* Fallback card-based crowd view when maps unavailable */
function CrowdGrid({ zones }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {zones.map((zone) => {
        const lbl = densityLabel(zone.crowd_density);
        return (
          <div
            key={zone.id}
            className={`rounded-xl border p-3 ${lbl.cls}`}
          >
            <p className="font-semibold text-sm">{zone.name}</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${zone.crowd_density || 0}%`, background: densityStroke(zone.crowd_density) }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs opacity-70">{zone.crowd_density || 0}%</span>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${lbl.cls}`}>
                {lbl.text}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CrowdMap({ zones = [], event, readOnly = false, onZoneClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const circlesRef = useRef([]);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const centerLat = event?.latitude ?? 17.385;
  const centerLng = event?.longitude ?? 78.4867;
  const hasCoords = event?.latitude != null && event?.longitude != null;

  useEffect(() => {
    if (!hasCoords || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setMapError(true);
      return;
    }

    let cancelled = false;

    mapsLoader.load().then((google) => {
      if (cancelled || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 17,
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1d2536' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8a9bb4' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2536' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d3a50' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d2536' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1520' }] },
          { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#263044' }] },
          { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        ],
      });

      mapInstance.current = map;
      setMapLoaded(true);

      // Center pin for venue
      new google.maps.Marker({
        position: { lat: centerLat, lng: centerLng },
        map,
        title: event?.name || 'Venue',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#a78bfa',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      // Info window for venue
      const venueInfo = new google.maps.InfoWindow({
        content: `<div style="color:#1e293b;font-weight:bold;padding:4px 8px;">${event?.name || 'Venue'}</div>`,
      });
      map.addListener('click', () => venueInfo.close());
    }).catch(() => {
      if (!cancelled) setMapError(true);
    });

    return () => { cancelled = true; };
  }, [centerLat, centerLng, hasCoords]);

  // Update zone circles whenever zones change
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;

    // Clear previous
    circlesRef.current.forEach((c) => c.setMap(null));
    markersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current = [];
    markersRef.current = [];

    if (!zones.length) return;

    mapsLoader.load().then((google) => {
      if (!mapInstance.current) return;
      const positioned = approximateZonePositions(zones, centerLat, centerLng);

      positioned.forEach((zone) => {
        const pos = { lat: zone.approxLat, lng: zone.approxLng };
        const radius = 40 + (zone.crowd_density / 100) * 25; // 40–65m radius scales with density

        const circle = new google.maps.Circle({
          strokeColor: densityStroke(zone.crowd_density),
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillColor: densityColor(zone.crowd_density),
          fillOpacity: 0.5,
          map: mapInstance.current,
          center: pos,
          radius,
          clickable: !readOnly,
        });

        if (!readOnly && onZoneClick) {
          circle.addListener('click', () => onZoneClick(zone));
        }

        // Label marker
        const marker = new google.maps.Marker({
          position: pos,
          map: mapInstance.current,
          title: `${zone.name} — ${zone.crowd_density}%`,
          icon: {
            url:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect/></svg>`
              ),
            anchor: new google.maps.Point(0, 0),
          },
          label: {
            text: `${zone.name}\n${zone.crowd_density}%`,
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
          },
        });

        circlesRef.current.push(circle);
        markersRef.current.push(marker);
      });
    }).catch(() => {});
  }, [zones, mapLoaded, centerLat, centerLng, readOnly, onZoneClick]);

  if (mapError || !hasCoords) {
    return (
      <div className="space-y-4">
        {!hasCoords && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200">
              No venue coordinates set. Showing grid view. Add latitude/longitude to the event for map view.
            </p>
          </div>
        )}
        <CrowdGrid zones={zones} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map container */}
      <div className="relative rounded-xl overflow-hidden border border-white/10">
        <div ref={mapRef} className="w-full h-72 md:h-96" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1d2536]">
            <div className="h-8 w-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          </div>
        )}
        {/* Legend */}
        <div className="absolute bottom-3 left-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">Crowd Density</p>
          <div className="space-y-1.5">
            {[
              { color: '#34d399', label: 'Low (0–40%)' },
              { color: '#fbbf24', label: 'Medium (40–70%)' },
              { color: '#ef4444', label: 'High (70%+)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <p className="text-[10px] text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {zones.map((zone) => {
          const lbl = densityLabel(zone.crowd_density);
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => !readOnly && onZoneClick && onZoneClick(zone)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-all ${!readOnly ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-default'} ${lbl.cls}`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <p className="text-xs font-semibold truncate">{zone.name}</p>
                <Users size={12} className="flex-shrink-0 opacity-70" />
              </div>
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${zone.crowd_density || 0}%`, background: densityStroke(zone.crowd_density) }}
                />
              </div>
              <p className="mt-1 text-[10px] opacity-70">{zone.crowd_density || 0}% · {lbl.text}</p>
            </button>
          );
        })}
      </div>

      {!zones.length && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center justify-center">
          <CheckCircle size={16} className="text-white/30" />
          <p className="text-sm text-white/40">No zones configured for this event yet.</p>
        </div>
      )}
    </div>
  );
}
