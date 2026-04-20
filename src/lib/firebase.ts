import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { collection, addDoc } from 'firebase/firestore';
import { Memory } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const saveToMemory = async (userId: string, type: Memory['type'], title: string, content: string) => {
  const memory: Omit<Memory, 'id'> = {
    userId,
    type,
    title,
    content,
    createdAt: new Date().toISOString()
  };
  return addDoc(collection(db, 'memories'), memory);
};

export default app;
