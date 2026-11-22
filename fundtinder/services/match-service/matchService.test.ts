import {
  fetchMutualMatchAppIds,
  fetchSwipedAppIds,
  rankMatchesWithLili,
  saveSwipe,
  unmatch,
} from '@/services/match-service/matchService';

jest.mock('@/config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/services/ai-auth/aiAuth', () => ({
  getAiAuthHeaders: jest.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: 'Bearer token-123',
  }),
}));

const currentUser = {
  uid: 'u1',
  id: 'u1',
  name: 'Me',
  city: 'Budapest',
  budget: 100,
  investor: true,
  description: 'desc',
  profilePictureUrl: '',
  themes: ['tech'],
};

const preferences = {
  themes: [],
  cities: [],
  minBudget: 0,
  maxBudget: 1000,
};

describe('rankMatchesWithLili', () => {
  it('should return validated ranking results', async () => {
    const candidate = {
      user: {
        ...currentUser,
        uid: 'u2',
        name: 'Candidate',
        city: 'Pecs',
        budget: 200,
        investor: false,
        description: 'candidate description',
        themes: ['finance'],
      },
      preferences,
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: [{ candidateId: 'u2', score: 0.9 }] }),
    }) as jest.Mock;

    await expect(
      rankMatchesWithLili(currentUser, preferences, [candidate]),
    ).resolves.toEqual([{ candidateId: 'u2', score: 0.9 }]);
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"id":"u2"'),
      }),
    );
  });

  describe('swipe and mutual match operations', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should save dislikes and detect reverse likes', async () => {
      const firestore = jest.requireMock('firebase/firestore');

      await expect(saveSwipe('me', 'other', false)).resolves.toBe(false);
      expect(firestore.getDoc).not.toHaveBeenCalled();
      await expect(unmatch('me', 'other')).resolves.toBeUndefined();

      firestore.getDoc.mockResolvedValue({
        data: () => ({ wantToMatch: true }),
      });
      await expect(saveSwipe('me', 'other', true)).resolves.toBe(true);
    });

    it('should return swiped ids and only mutual liked ids', async () => {
      const firestore = jest.requireMock('firebase/firestore');
      firestore.getDocs
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ fromAppId: 'me', toAppId: 'one' }) },
            { data: () => ({ fromAppId: 'me', toAppId: '' }) },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ fromAppId: 'me', toAppId: 'one', liked: true }) },
            { data: () => ({ fromAppId: 'me', toAppId: 'two', liked: false }) },
          ],
        })
        .mockResolvedValueOnce({
          docs: [
            { data: () => ({ fromAppId: 'one', toAppId: 'me', liked: true }) },
            { data: () => ({ fromAppId: 'two', toAppId: 'me', liked: true }) },
          ],
        });

      await expect(fetchSwipedAppIds('me')).resolves.toEqual(new Set(['one']));
      await expect(fetchMutualMatchAppIds('me')).resolves.toEqual(['one']);
    });
  });

  it('should reject invalid and failed responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ matches: null }),
    }) as jest.Mock;
    await expect(
      rankMatchesWithLili(currentUser, preferences, []),
    ).rejects.toThrow('Invalid match ranking response');

    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;
    await expect(
      rankMatchesWithLili(currentUser, preferences, []),
    ).rejects.toThrow('Failed to rank matches with Lili');
  });
});
