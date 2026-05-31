import { auth, db, storage } from '@/config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from '@/types/user';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { generateThemes } from '@/services/filterService';

export type Profile = {
  name: string;
  city: string;
  budget: string;
  investor: boolean;
  description: string;
  profilePictureUrl: string;
};

export const getMyAppId = async () => {
  const firebaseUid = auth.currentUser?.uid;

  if (!firebaseUid) {
    throw new Error('User not authenticated');
  }

  const snapshot = await getDoc(doc(db, 'userMap', firebaseUid));

  return snapshot.data()?.appId;
};

export const fetchUserByAppId = async (appId: string): Promise<User | null> => {
  const snapshot = await getDoc(doc(db, 'users', appId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as User;
};

const getUserDocRef = async (uid: string) => {
  const mapSnap = await getDoc(doc(db, 'userMap', uid));

  if (!mapSnap.exists()) {
    throw new Error('User mapping not found');
  }

  const appId = mapSnap.data().appId;

  return doc(db, 'users', appId);
};

export const fetchProfileData = async (uid: string) => {
  const docRef = await getUserDocRef(uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('User profile not found');
  }

  return docSnap.data() as Profile;
};

export const fetchAllUsers = async (): Promise<User[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<User, 'id'>),
  }));
};

export const fetchUsersIChattedWith = async (uid: string): Promise<User[]> => {
  if (!uid) throw new Error('No UID provided');

  const mapSnap = await getDoc(doc(db, 'userMap', uid));

  if (!mapSnap.exists()) {
    throw new Error('User mapping not found');
  }

  const currentUserAppId = mapSnap.data().appId;

  const q = query(
    collection(db, 'chat'),
    where('participants', 'array-contains', currentUserAppId),
  );

  const snapshot = await getDocs(q);

  const users: User[] = [];

  for (const chatDoc of snapshot.docs) {
    const data = chatDoc.data();

    const otherUserAppId = data.participants.find(
      (p: string) => p !== currentUserAppId,
    );

    if (!otherUserAppId) continue;

    const userSnap = await getDoc(doc(db, 'users', otherUserAppId));
    if (userSnap.exists()) {
      users.push({
        id: userSnap.id,
        ...(userSnap.data() as Omit<User, 'id'>),
      });
    }
  }

  return users;
};

export const uploadProfilePicture = async (uid: string, imageUri: string) => {
  const docRef = await getUserDocRef(uid);
  const docSnap = await getDoc(docRef);
  const appId = docSnap.id;

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `profile-pictures/${appId}`);

  await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef);
};

export const updateUserProfile = async (uid: string, data: Profile) => {
  const docRef = await getUserDocRef(uid);

  const currentUserSnap = await getDoc(docRef);
  const currentUser = currentUserSnap.data();
  let themes = currentUser?.themes ?? [];
  if (currentUser?.description !== data.description) {
    console.log('Description changed, regenerating themes...');
    themes = await generateThemes(data.description);
  }

  await updateDoc(docRef, {
    name: data.name,
    city: data.city,
    budget: data.budget,
    investor: data.investor,
    description: data.description,
    profilePictureUrl: data.profilePictureUrl,
    themes,
  });
};

export const fetchAvailableThemes = async (): Promise<string[]> => {
  const snapshot = await getDocs(collection(db, 'users'));

  const themes = new Set<string>();

  snapshot.docs.forEach((doc) => {
    const userThemes = doc.data().themes ?? [];

    userThemes.forEach((theme: string) => {
      if (theme?.trim()) {
        themes.add(theme);
      }
    });
  });

  return [...themes].sort();
};
