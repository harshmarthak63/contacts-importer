import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDic6lpKWKWVrRUihEMiWwNtg8_Cj7VBwE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "contacts-importer-db841.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "contacts-importer-db841",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "contacts-importer-db841.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "678826761582",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:678826761582:web:24580cde268dd56645f57f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-XX6B9GQBZ6"
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  if (app) {
    db = getFirestore(app);
  }
}

export const getDb = (): Firestore => {
  if (!db) {
    throw new Error('Firestore not initialized. Make sure you are running this in a browser environment.');
  }
  return db;
};

export { db };
export default app;
