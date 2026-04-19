#!/usr/bin/env node
/**
 * Deployment readiness checks (no network).
 * Run: node scripts/deploy-check.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const requiredFiles = [
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
  'database.rules.json',
  '.firebaserc',
  'vite.config.js',
  'package.json',
  'functions/package.json',
  'functions/src/index.js',
  '.env.example',
  '.github/workflows/deploy.yml'
];

const envExampleKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_VAPID_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_GEMINI_API_KEY',
  'VITE_RAZORPAY_KEY_ID'
];

let failed = false;

function need(p) {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) {
    console.error(`Missing: ${p}`);
    failed = true;
  }
}

for (const f of requiredFiles) need(f);

const envExample = path.join(root, '.env.example');
if (fs.existsSync(envExample)) {
  const text = fs.readFileSync(envExample, 'utf8');
  for (const key of envExampleKeys) {
    if (!text.includes(key)) {
      console.error(`.env.example should mention ${key}`);
      failed = true;
    }
  }
}

const firebaseJson = JSON.parse(fs.readFileSync(path.join(root, 'firebase.json'), 'utf8'));
if (!firebaseJson.emulators?.firestore || !firebaseJson.emulators?.functions) {
  console.error('firebase.json should define emulators.firestore and emulators.functions');
  failed = true;
}

if (failed) {
  console.error('\ndeploy-check: FAILED');
  process.exit(1);
}
console.log('deploy-check: OK');
