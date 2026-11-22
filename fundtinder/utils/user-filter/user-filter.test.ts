import { filterUsers } from '@/utils/user-filter/user-filter';
import { FeedFilters } from '@/types/feed-filters';
import { User } from '@/types/user';

const filters = (overrides: Partial<FeedFilters> = {}): FeedFilters => ({
  themes: [],
  cities: [],
  minBudget: 0,
  maxBudget: 1000,
  ...overrides,
});

const user = (overrides: Partial<User> = {}): User => ({
  uid: 'user-2',
  id: 'user-2',
  name: 'Test User',
  city: 'Budapest',
  budget: 500,
  investor: false,
  description: 'Description',
  profilePictureUrl: '',
  themes: ['technology'],
  ...overrides,
});

describe('filterUsers', () => {
  describe('when filters are provided', () => {
    it('should exclude the current user and apply all filters', () => {
      const users = [
        user({ uid: 'me' }),
        user({ uid: 'city', city: 'Pecs' }),
        user({ uid: 'budget', budget: 2000 }),
        user({ uid: 'theme', themes: ['finance'] }),
        user({ uid: 'match' }),
      ];

      expect(
        filterUsers(
          users,
          filters({ cities: ['Budapest'], themes: ['technology'] }),
          'me',
        ),
      ).toEqual([users[4]]);
    });
  });

  describe('when the maximum budget is zero', () => {
    it('should treat the maximum budget as unrestricted', () => {
      expect(
        filterUsers([user({ budget: 0 })], filters({ maxBudget: 0 }), 'me'),
      ).toHaveLength(1);
    });
  });

  it('should exclude users below the minimum budget', () => {
    expect(
      filterUsers(
        [user({ budget: 99 }), user({ uid: 'within-range', budget: 100 })],
        filters({ minBudget: 100 }),
        'me',
      ),
    ).toEqual([expect.objectContaining({ uid: 'within-range' })]);
  });
});
