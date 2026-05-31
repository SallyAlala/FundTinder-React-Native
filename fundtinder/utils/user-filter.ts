import { FeedFilters } from '@/types/feed-filters';
import { User } from '@/types/user';

export const filterUsers = (
  users: User[],
  filters: FeedFilters,
  myAppId: string,
): User[] => {
  return users.filter((user) => {
    if (user.uid === myAppId) {
      return false;
    }

    const cityMatch =
      filters.cities.length === 0 || filters.cities.includes(user.city);

    const userBudget = Number(user.budget);

    const minBudgetMatch =
      !filters.minBudget || userBudget >= filters.minBudget;

    const maxBudgetMatch =
      !filters.maxBudget || userBudget <= filters.maxBudget;

    const budgetMatch = minBudgetMatch && maxBudgetMatch;

    const themeMatch =
      filters.themes.length === 0 ||
      filters.themes.some((theme) => user.themes?.includes(theme));

    return cityMatch && budgetMatch && themeMatch;
  });
};
