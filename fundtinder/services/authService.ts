import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { setDoc } from '@firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { generateThemes } from '@/services/filterService';

export const login = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

type SignUpParams = {
  email: string;
  password: string;
  name: string;
  location: string;
  budget: string;
  description: string;
  isInvestor: boolean;
  profilePictureUrl?: string | null;
};

export const signUp = async ({
  email,
  password,
  name,
  location,
  budget,
  description,
  isInvestor,
  profilePictureUrl = null,
}: SignUpParams) => {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );

  const firebaseUid = credential.user.uid;

  const appId = email.split('@')[0].toLowerCase();

  const userDocRef = doc(db, 'users', appId);

  const existingUser = await getDoc(userDocRef);

  const themes = await generateThemes(description);

  if (existingUser.exists()) {
    throw new Error('User already exists');
  }

  await setDoc(doc(db, 'userMap', firebaseUid), {
    appId,
  });

  await setDoc(userDocRef, {
    uid: appId,
    username: email,
    name,
    city: location,
    budget,
    description,
    investor: isInvestor,
    profilePictureUrl,
    fcmTokens: [],
    themes,
  });

  return credential.user;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};
