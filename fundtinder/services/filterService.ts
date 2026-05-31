import { FeedFilters } from '@/types/feed-filters';
import { getMyAppId } from '@/services/userService';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { setDoc } from '@firebase/firestore';

const defaultFilters: FeedFilters = {
  themes: [],
  cities: [],
  minBudget: 0,
  maxBudget: 100000000000000,
};

export const fetchMyFilters = async (): Promise<FeedFilters> => {
  const appId = await getMyAppId();

  const snapshot = await getDoc(doc(db, 'filters', appId));

  if (!snapshot.exists()) {
    return defaultFilters;
  }

  return snapshot.data() as FeedFilters;
};

export const saveMyFilters = async (filters: FeedFilters): Promise<void> => {
  const appId = await getMyAppId();

  await setDoc(doc(db, 'filters', appId), filters);
};

export const fetchAvailableCities = async (): Promise<string[]> => {
  const snapshot = await getDocs(collection(db, 'users'));

  const cities = new Set<string>();

  snapshot.docs.forEach((doc) => {
    const city = doc.data().city?.trim();

    if (city) {
      cities.add(city);
    }
  });

  return [...cities].sort();
};

export const generateThemes = async (
  description: string,
): Promise<string[]> => {
  const response = await fetch(
    'https://us-central1-fundtinder.cloudfunctions.net/generateThemes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to generate themes');
  }

  const data = await response.json();

  return data.result.themes ?? [];
};
