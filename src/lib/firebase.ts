import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const viteEnv =
  typeof import.meta !== 'undefined' && (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ? (import.meta as ImportMeta & { env: Record<string, string> }).env
    : ({} as Record<string, string>);

const firebaseConfig = {
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '',
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || '',
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '',
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || '',
  messagingSenderId:
    viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '',
  appId: viteEnv.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '',
};

const databaseId =
  viteEnv.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || undefined;

// Initialize Firebase singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
export default app;
