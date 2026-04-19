import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function loadEnvFile(path = '.env.local') {
  if (!fs.existsSync(path)) return;
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) process.env[key] = rest.join('=').trim();
  }
}

function densityLevel(currentCount, capacity) {
  const ratio = currentCount / capacity;
  if (ratio > 0.9) return 'critical';
  if (ratio > 0.7) return 'high';
  if (ratio > 0.4) return 'medium';
  return 'low';
}

function valueToFirestore(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(valueToFirestore) } };
  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, valueToFirestore(nested)]))
      }
    };
  }
  return { stringValue: String(value) };
}

function fields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, valueToFirestore(value)]));
}

function accessToken() {
  if (process.env.FIRESTORE_EMULATOR_HOST) return '';
  if (process.env.GOOGLE_OAUTH_ACCESS_TOKEN) return process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  try {
    return execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
  } catch (_error) {
    throw new Error('Set GOOGLE_OAUTH_ACCESS_TOKEN or run gcloud auth application-default login before seeding production Firestore.');
  }
}

async function commit(projectId, docs) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const base = host
    ? `http://${host}/v1/projects/${projectId}/databases/(default)/documents:commit`
    : `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const token = accessToken();
  const writes = docs.map(({ path, data }) => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/${path}`,
      fields: fields(data)
    }
  }));
  const response = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ writes })
  });
  if (!response.ok) {
    throw new Error(`Firestore seed failed: ${response.status} ${await response.text()}`);
  }
}

loadEnvFile();

const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'smartvenuex-demo';
const eventId = 'demoEvent';
const now = new Date();

const zones = [
  ['zone-a', 'Zone A', 8000, 1800, { lat: 12.9716, lng: 77.5946 }, 'Gate 1'],
  ['zone-b', 'Zone B', 8000, 3200, { lat: 12.972, lng: 77.5951 }, 'Gate 2'],
  ['zone-c', 'Zone C', 8000, 6100, { lat: 12.9726, lng: 77.5957 }, 'Gate 3'],
  ['zone-d', 'Zone D', 8000, 7400, { lat: 12.973, lng: 77.5961 }, 'Gate 4']
];

const docs = [
  {
    path: `events/${eventId}`,
    data: {
      name: 'Championship Final',
      venue: 'National Arena',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'live',
      totalCapacity: 60000,
      gates: ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4'],
      zones: ['A', 'B', 'C', 'D'],
      weatherData: { summary: 'Clear', temperatureC: 28, windKph: 8 },
      emergencyActive: false,
      firstAid: [
        { id: 'aid-1', name: 'AED North Concourse', lat: 12.9719, lng: 77.5949, type: 'AED' },
        { id: 'aid-2', name: 'First Aid Room C', lat: 12.9728, lng: 77.5958, type: 'AID' }
      ],
      schedule: [
        { time: '18:00', label: 'Gates open' },
        { time: '19:30', label: 'Opening ceremony' },
        { time: '20:00', label: 'Kickoff' }
      ],
      updatedAt: now
    }
  },
  ...zones.map(([id, name, capacity, currentCount, coordinates, recommendedExit]) => ({
    path: `zones/${id}`,
    data: {
      name,
      capacity,
      currentCount,
      densityLevel: densityLevel(currentCount, capacity),
      coordinates,
      recommendedExit,
      isClosed: false,
      updatedAt: now
    }
  })),
  ...[
    ['slotA', 'Gate 1', 1000, 440, 'A'],
    ['slotB', 'Gate 2', 1000, 680, 'B'],
    ['slotC', 'Gate 3', 1000, 810, 'C'],
    ['slotD', 'Gate 4', 1000, 920, 'D']
  ].map(([id, gateAssigned, capacity, booked, seatZone]) => ({
    path: `slots/${id}`,
    data: {
      eventId,
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      capacity,
      booked,
      gateAssigned,
      seatZone,
      densityLevel: densityLevel(booked, capacity),
      updatedAt: now
    }
  })),
  {
    path: 'stalls/stall-1',
    data: {
      name: 'Goal Grill',
      zone: 'A',
      category: 'snacks',
      menu: [
        { id: 'combo', name: 'Combo Meal', price: 199 },
        { id: 'fries', name: 'Loaded Fries', price: 129 }
      ],
      waitMinutes: 6,
      isOpen: true,
      latitude: 12.9718,
      longitude: 77.5947,
      updatedAt: now
    }
  },
  {
    path: 'stalls/stall-2',
    data: {
      name: 'Halftime Bites',
      zone: 'B',
      category: 'veg',
      menu: [
        { id: 'wrap', name: 'Veg Wrap', price: 149 },
        { id: 'juice', name: 'Fresh Lime', price: 79 }
      ],
      waitMinutes: 10,
      isOpen: true,
      latitude: 12.9722,
      longitude: 77.5952,
      updatedAt: now
    }
  },
  {
    path: 'stalls/stall-3',
    data: {
      name: 'Sprint Sweets',
      zone: 'D',
      category: 'dessert',
      menu: [
        { id: 'kulfi', name: 'Kulfi Cup', price: 99 },
        { id: 'coffee', name: 'Cold Coffee', price: 119 }
      ],
      waitMinutes: 18,
      isOpen: true,
      latitude: 12.9731,
      longitude: 77.5962,
      updatedAt: now
    }
  },
  {
    path: 'buses/bus-1',
    data: {
      route: 'North Loop',
      currentLat: 12.95,
      currentLng: 77.58,
      eta: 4,
      capacity: 45,
      eventId,
      departureTime: '17:45',
      delayMinutes: 0,
      lastUpdated: now
    }
  },
  {
    path: 'buses/bus-2',
    data: {
      route: 'East Connector',
      currentLat: 12.99,
      currentLng: 77.62,
      eta: 12,
      capacity: 40,
      eventId,
      departureTime: '17:55',
      delayMinutes: 7,
      lastUpdated: now
    }
  },
  {
    path: 'lost_items/found-demo-1',
    data: {
      description: 'Blue backpack with a black zipper',
      location: 'Gate 2 help desk',
      photo: '',
      contactInfo: 'helpdesk@smartvenuex.test',
      status: 'found',
      reportedBy: 'seed',
      createdAt: now
    }
  }
];

commit(projectId, docs)
  .then(() => console.log(`Seed complete for ${projectId}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
