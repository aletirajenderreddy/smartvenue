import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';

const fn = getFunctions(app, 'us-central1');

async function call(name, payload) {
  const result = (await httpsCallable(fn, name)(payload)).data;
  if (!result?.ok && result?.valid !== true) {
    throw new Error(result?.error || `${name} failed`);
  }
  return result;
}

export const generateQR = (payload) => call('generateQR', payload);
export const validateEntry = (payload) => call('validateEntry', payload);
export const bookArrivalSlot = (payload) => call('bookArrivalSlot', payload);
export const scanExit = (payload) => call('scanExit', payload);
