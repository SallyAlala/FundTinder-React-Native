import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '@/app/(tabs)';
import { fetchAllUsers, getMyAppId } from '@/services/user-service/userService';
import { fetchMyFilters } from '@/services/filter-service/filterService';
import {
  fetchMutualMatchAppIds,
  fetchSwipedAppIds,
  saveSwipe,
} from '@/services/match-service/matchService';
import { filterUsers } from '@/utils/user-filter/user-filter';

jest.mock('@/services/user-service/userService', () => ({
  fetchAllUsers: jest.fn(),
  getMyAppId: jest.fn(),
}));

jest.mock('@/services/filter-service/filterService', () => ({
  fetchMyFilters: jest.fn(),
}));

jest.mock('@/services/match-service/matchService', () => ({
  fetchMutualMatchAppIds: jest.fn(),
  fetchSwipedAppIds: jest.fn(),
  saveSwipe: jest.fn(),
}));

jest.mock('@/utils/user-filter/user-filter', () => ({
  filterUsers: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (callback: () => void) => {
    require('react').useEffect(callback, []);
  },
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: () => false,
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/parallax-scroll-view/parallax-scroll-view', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}));

jest.mock('@/components/ui/loading/loading', () => ({
  Loading: () =>
    require('react').createElement(
      require('react-native').Text,
      null,
      'Loading',
    ),
}));

jest.mock('@/components/ui/card/card', () => ({
  ProfileCard: ({
    name,
    onSwipeLeft,
    onSwipeRight,
  }: {
    name: string;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
  }) => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(Text, null, name),
      React.createElement(Pressable, {
        accessibilityLabel: 'Swipe left',
        onPress: onSwipeLeft,
      }),
      React.createElement(Pressable, {
        accessibilityLabel: 'Swipe right',
        onPress: onSwipeRight,
      }),
    );
  },
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ListFilterPlus: 'ListFilterPlus',
  MessageCircle: 'MessageCircle',
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedGetMyAppId = getMyAppId as jest.MockedFunction<typeof getMyAppId>;
const mockedFetchAllUsers = fetchAllUsers as jest.MockedFunction<
  typeof fetchAllUsers
>;
const mockedFetchMyFilters = fetchMyFilters as jest.MockedFunction<
  typeof fetchMyFilters
>;
const mockedFetchMutualMatchAppIds =
  fetchMutualMatchAppIds as jest.MockedFunction<typeof fetchMutualMatchAppIds>;
const mockedFetchSwipedAppIds = fetchSwipedAppIds as jest.MockedFunction<
  typeof fetchSwipedAppIds
>;
const mockedSaveSwipe = saveSwipe as jest.MockedFunction<typeof saveSwipe>;
const mockedFilterUsers = filterUsers as jest.MockedFunction<
  typeof filterUsers
>;
const router = jest.requireMock('expo-router').router;

const user = {
  uid: 'user-1',
  id: 'user-1',
  name: 'Ada Founder',
  city: 'Budapest',
  budget: 5000,
  investor: false,
  description: 'Building useful things.',
  profilePictureUrl: 'ada.jpg',
  themes: ['Technology'],
};

describe('Home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetMyAppId.mockResolvedValue('my-app');
    mockedFetchAllUsers.mockResolvedValue([user]);
    mockedFetchMyFilters.mockResolvedValue({
      themes: [],
      cities: [],
      minBudget: 0,
      maxBudget: 100000,
    });
    mockedFetchMutualMatchAppIds.mockResolvedValue([]);
    mockedFetchSwipedAppIds.mockResolvedValue(new Set());
    mockedFilterUsers.mockReturnValue([user]);
    mockedSaveSwipe.mockResolvedValue(false);
  });

  describe('by default', () => {
    it('should show a loading indicator while profiles are loading', () => {
      mockedGetMyAppId.mockReturnValue(new Promise(() => undefined));

      const { getByText } = render(<HomeScreen />);

      expect(getByText('Loading')).toBeTruthy();
    });

    it('should render the available profile card after loading', async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText('Ada Founder')).toBeTruthy();
      });
    });
  });

  describe('when the user swipes right on a profile', () => {
    it('should save a positive swipe and advance the feed', async () => {
      const { getByLabelText, getByText, queryByText } = render(<HomeScreen />);

      await waitFor(() => expect(getByText('Ada Founder')).toBeTruthy());
      fireEvent.press(getByLabelText('Swipe right'));

      await waitFor(() => {
        expect(mockedSaveSwipe).toHaveBeenCalledWith('my-app', 'user-1', true);
        expect(queryByText('Ada Founder')).toBeNull();
      });
    });
  });

  describe('when there are no profiles to browse', () => {
    it('should show the empty feed message', async () => {
      mockedFilterUsers.mockReturnValue([]);
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText(/You're all caught up! Stay tuned/)).toBeTruthy();
      });
    });
  });
});
