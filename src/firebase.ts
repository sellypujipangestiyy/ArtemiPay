import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Test connection wrapper as requested in the Firebase Integration skill
export async function testConnection() {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, '_connection_test_collection_', '_test_doc_'));
    console.log('Firebase connection test passed.');
    return true;
  } catch (error) {
    console.warn('Firebase server check:', error);
    return false;
  }
}
