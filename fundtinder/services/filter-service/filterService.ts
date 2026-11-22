import { FeedFilters } from '@/types/feed-filters';
import { getMyAppId } from '@/services/user-service/userService';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { setDoc } from '@firebase/firestore';
import { DEFAULT_FILTERS } from '@/constants/filters';

export const fetchMyFilters = async (): Promise<FeedFilters> => {
  const appId = await getMyAppId();

  return fetchFiltersByAppId(appId);
};

export const fetchFiltersByAppId = async (
  appId: string,
): Promise<FeedFilters> => {
  const snapshot = await getDoc(doc(db, 'filters', appId));

  if (!snapshot.exists()) {
    return { ...DEFAULT_FILTERS };
  }

  return {
    ...DEFAULT_FILTERS,
    ...(snapshot.data() as Partial<FeedFilters>),
  };
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
