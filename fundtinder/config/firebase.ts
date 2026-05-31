// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDY0vb4kIgMfM2sP6jnfOjZ1k8mzzS3gcA',
  authDomain: 'fundtinder.firebaseapp.com',
  projectId: 'fundtinder',
  storageBucket: 'fundtinder.firebasestorage.app',
  messagingSenderId: '156933434766',
  appId: '1:156933434766:web:263ec08d8a6364c4d9c8df',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
