import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore - Metro resolves this correctly at runtime using the react-native export condition in @firebase/auth
import { getReactNativePersistence } from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

if (!FIREBASE_API_KEY || !FIREBASE_PROJECT_ID) {
  console.warn('Warning: Firebase environment variables are missing.');
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// initializeAuth must only be called once per app instance.
// If auth is already initialized (e.g. hot reload), fall back to getAuth().
function getOrInitAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (_) {
    // Auth already initialized — return existing instance
    return getAuth(app);
  }
}

export const auth = getOrInitAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

export async function uploadFileAsync(uri: string, path: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob);
  const url = await getDownloadURL(ref);
  return url;
}