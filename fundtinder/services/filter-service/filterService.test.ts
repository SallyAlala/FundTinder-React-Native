import { getDoc, getDocs } from 'firebase/firestore';
import { setDoc } from '@firebase/firestore';
import { getMyAppId } from '@/services/user-service/userService';
import {
  fetchAvailableCities,
  fetchFiltersByAppId,
  fetchMyFilters,
  saveMyFilters,
} from '@/services/filter-service/filterService';

jest.mock('@/config/firebase', () => ({ db: {} }));
jest.mock('@/services/user-service/userService', () => ({
  getMyAppId: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((...args) => args),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@firebase/firestore', () => ({ setDoc: jest.fn() }));

describe('filter service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('when no saved filters exist', () => {
    it('should return the default filters', async () => {
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      await expect(fetchFiltersByAppId('person')).resolves.toEqual({
        themes: [],
        cities: [],
        minBudget: 0,
        maxBudget: 100000000000000,
      });
    });
  });

  describe('when saved filters exist', () => {
    it('should merge them with the default filters', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ cities: ['Budapest'], minBudget: 500 }),
      });

      await expect(fetchFiltersByAppId('person')).resolves.toEqual({
        themes: [],
        cities: ['Budapest'],
        minBudget: 500,
        maxBudget: 100000000000000,
      });
    });
  });

  describe('when reading or saving my filters', () => {
    it('should resolve the current app id for both operations', async () => {
      (getMyAppId as jest.Mock).mockResolvedValue('person');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      const filters = {
        themes: ['tech'],
        cities: [],
        minBudget: 0,
        maxBudget: 1000,
      };

      await fetchMyFilters();
      await saveMyFilters(filters);

      expect(getMyAppId).toHaveBeenCalledTimes(2);
      expect(setDoc).toHaveBeenCalledWith([{}, 'filters', 'person'], filters);
    });
  });

  describe('when available cities are loaded', () => {
    it('should return unique, trimmed, sorted cities', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ city: ' Pecs ' }) },
          { data: () => ({ city: 'Budapest' }) },
          { data: () => ({ city: 'Budapest' }) },
          { data: () => ({ city: '  ' }) },
        ],
      });

      await expect(fetchAvailableCities()).resolves.toEqual([
        'Budapest',
        'Pecs',
      ]);
    });
  });
});
