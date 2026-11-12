import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/config/firebase';
import { FeedFilters } from '@/types/feed-filters';
import { User } from '@/types/user';

type Swipe = {
  fromAppId: string;
  toAppId: string;
  wantToMatch?: boolean;
  liked?: boolean;
};

export type AiMatchRanking = {
  candidateId: string;
  score: number;
  sharedThemes: string[];
  explanation: string;
};

const getSwipeId = (fromAppId: string, toAppId: string) =>
  `${fromAppId}_${toAppId}`;

export const saveSwipe = async (
  fromAppId: string,
  toAppId: string,
  wantToMatch: boolean,
): Promise<boolean> => {
  await setDoc(doc(db, 'swipes', getSwipeId(fromAppId, toAppId)), {
    fromAppId,
    toAppId,
    liked: wantToMatch,
    updatedAt: Date.now(),
  });

  if (!wantToMatch) {
    return false;
  }

  const reverseSwipe = await getDoc(
    doc(db, 'swipes', getSwipeId(toAppId, fromAppId)),
  );

  const reverseSwipeData = reverseSwipe.data() as Swipe | undefined;

  return Boolean(
    reverseSwipeData?.wantToMatch ?? reverseSwipeData?.liked,
  );
};

export const unmatch = async (appId: string, otherAppId: string) => {
  await saveSwipe(appId, otherAppId, false);
};

export const fetchSwipedAppIds = async (fromAppId: string) => {
  const snapshot = await getDocs(
    query(collection(db, 'swipes'), where('fromAppId', '==', fromAppId)),
  );

  return new Set(
    snapshot.docs
      .map((swipe) => (swipe.data() as Swipe).toAppId)
      .filter(Boolean),
  );
};

export const fetchMutualMatchAppIds = async (appId: string) => {
  const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
    getDocs(
      query(collection(db, 'swipes'), where('fromAppId', '==', appId)),
    ),
    getDocs(
      query(collection(db, 'swipes'), where('toAppId', '==', appId)),
    ),
  ]);

  const likedByMe = new Set(
    outgoingSnapshot.docs
      .map((swipe) => swipe.data() as Swipe)
      .filter((swipe) => swipe.wantToMatch ?? swipe.liked)
      .map((swipe) => swipe.toAppId)
      .filter(Boolean),
  );

  return incomingSnapshot.docs
    .map((swipe) => swipe.data() as Swipe)
    .filter((swipe) => swipe.wantToMatch ?? swipe.liked)
    .map((swipe) => swipe.fromAppId)
    .filter((candidateAppId) => likedByMe.has(candidateAppId));
};

export const rankMatchesWithLili = async (
  currentUser: User,
  currentPreferences: FeedFilters,
  candidates: {
    user: User;
    preferences: FeedFilters;
  }[],
): Promise<AiMatchRanking[]> => {
  const response = await fetch(
    'https://us-central1-fundtinder.cloudfunctions.net/rankMatches',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentUser,
        currentPreferences,
        candidates: candidates.map(({ user, preferences }) => ({
          id: user.uid,
          name: user.name,
          city: user.city,
          budget: user.budget,
          investor: user.investor,
          description: user.description,
          themes: user.themes,
          preferences,
        })),
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to rank matches with Lili');
  }

  const data = await response.json();

  if (!Array.isArray(data.matches)) {
    throw new Error('Invalid match ranking response');
  }

  return data.matches as AiMatchRanking[];
};
