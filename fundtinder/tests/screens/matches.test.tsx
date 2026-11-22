import { fireEvent, render, waitFor } from '@testing-library/react-native';
import MatchesTabScreen from '@/app/(tabs)/matches';
import {
  fetchFiltersByAppId,
  fetchMyFilters,
} from '@/services/filter-service/filterService';
import {
  fetchAllUsers,
  fetchUserByAppId,
  getMyAppId,
} from '@/services/user-service/userService';
import {
  fetchMutualMatchAppIds,
  rankMatchesWithLili,
  unmatch,
} from '@/services/match-service/matchService';
import { getOrCreateChat } from '@/services/chat-service/chatService';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: { uid: 'firebase-user' } },
}));

jest.mock('@/services/filter-service/filterService', () => ({
  fetchFiltersByAppId: jest.fn(),
  fetchMyFilters: jest.fn(),
}));

jest.mock('@/services/user-service/userService', () => ({
  fetchAllUsers: jest.fn(),
  fetchUserByAppId: jest.fn(),
  getMyAppId: jest.fn(),
}));

jest.mock('@/services/match-service/matchService', () => ({
  fetchMutualMatchAppIds: jest.fn(),
  rankMatchesWithLili: jest.fn(),
  unmatch: jest.fn(),
}));

jest.mock('@/services/chat-service/chatService', () => ({
  getOrCreateChat: jest.fn(),
}));

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    router: { push: jest.fn() },
    useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]),
  };
});

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: () => false,
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('lucide-react-native', () => ({
  Sparkles: () => null,
  HeartOff: () => null,
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

jest.mock('@/components/parallax-scroll-view/parallax-scroll-view', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui/loading/loading', () => ({
  Loading: () => {
    const { Text } = require('react-native');
    return <Text testID="matches-loading">Loading</Text>;
  },
}));

jest.mock('@/components/ui/match-card/match-card', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    MatchCard: ({
      name,
      score,
      onPress,
      onUnmatch,
    }: {
      name: string;
      score: number;
      onPress: () => void;
      onUnmatch: () => void;
    }) => (
      <View testID="match-card">
        <Text testID="match-name">{name}</Text>
        <Text>{score}%</Text>
        <Pressable testID={`open-${name}`} onPress={onPress} />
        <Pressable testID={`unmatch-${name}`} onPress={onUnmatch} />
      </View>
    ),
  };
});

const mockedFetchFiltersByAppId =
  fetchFiltersByAppId as jest.MockedFunction<typeof fetchFiltersByAppId>;
const mockedFetchMyFilters =
  fetchMyFilters as jest.MockedFunction<typeof fetchMyFilters>;
const mockedFetchAllUsers =
  fetchAllUsers as jest.MockedFunction<typeof fetchAllUsers>;
const mockedFetchUserByAppId =
  fetchUserByAppId as jest.MockedFunction<typeof fetchUserByAppId>;
const mockedGetMyAppId = getMyAppId as jest.MockedFunction<typeof getMyAppId>;
const mockedFetchMutualMatchAppIds =
  fetchMutualMatchAppIds as jest.MockedFunction<typeof fetchMutualMatchAppIds>;
const mockedRankMatchesWithLili =
  rankMatchesWithLili as jest.MockedFunction<typeof rankMatchesWithLili>;
const mockedUnmatch = unmatch as jest.MockedFunction<typeof unmatch>;
const mockedGetOrCreateChat =
  getOrCreateChat as jest.MockedFunction<typeof getOrCreateChat>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;

const currentUser = {
  id: 'user-1',
  uid: 'app-1',
  name: 'Me',
  city: 'Budapest',
  budget: 1000,
  investor: true,
  description: 'Looking for founders',
  profilePictureUrl: '',
  themes: ['Technology'],
};
const alpha = { ...currentUser, id: 'user-2', uid: 'app-2', name: 'Alpha' };
const beta = { ...currentUser, id: 'user-3', uid: 'app-3', name: 'Beta' };
const filters = { themes: [], cities: [], minBudget: 0, maxBudget: 10000 };

describe('Matches screen', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.requireMock('@/config/firebase').auth.currentUser = {
      uid: 'firebase-user',
    };
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockedGetMyAppId.mockResolvedValue('app-1');
    mockedFetchUserByAppId.mockResolvedValue(currentUser);
    mockedFetchAllUsers.mockResolvedValue([currentUser, alpha, beta]);
    mockedFetchMyFilters.mockResolvedValue(filters);
    mockedFetchFiltersByAppId.mockResolvedValue(filters);
    mockedFetchMutualMatchAppIds.mockResolvedValue(['app-2', 'app-3']);
    mockedRankMatchesWithLili.mockResolvedValue([
      { candidateId: 'app-2', score: 60, sharedThemes: [], explanation: 'Good' },
      { candidateId: 'app-3', score: 90, sharedThemes: ['Technology'], explanation: 'Great' },
    ]);
    mockedUnmatch.mockResolvedValue(undefined);
    mockedGetOrCreateChat.mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('by default', () => {
    it('should render a loading state while matches are loading', () => {
      mockedGetMyAppId.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = render(<MatchesTabScreen />);

      expect(getByTestId('matches-loading')).toBeTruthy();
    });

    it('should render the empty state when there are no mutual matches', async () => {
      mockedFetchMutualMatchAppIds.mockResolvedValue([]);

      const { getByText } = render(<MatchesTabScreen />);

      await waitFor(() => expect(getByText('No mutual matches yet.')).toBeTruthy());
    });

    it('should render mutual matches in ranking order', async () => {
      const { getAllByTestId, getByText } = render(<MatchesTabScreen />);

      await waitFor(() => expect(getAllByTestId('match-card')).toHaveLength(2));
      expect(getAllByTestId('match-name')[0].props.children).toBe('1. Beta');
      expect(getAllByTestId('match-name')[1].props.children).toBe('2. Alpha');
      expect(getByText('90%')).toBeTruthy();
    });

    it('should show an error when the current user mapping is missing', async () => {
      mockedGetMyAppId.mockResolvedValue('');

      const { getByText } = render(<MatchesTabScreen />);

      await waitFor(() => expect(getByText('No mutual matches yet.')).toBeTruthy());
      expect(toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ text2: 'Failed to load matches.' }),
      );
    });

    it('should show an error when the current profile is missing', async () => {
      mockedFetchUserByAppId.mockResolvedValue(null);

      render(<MatchesTabScreen />);

      await waitFor(() =>
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ text2: 'Failed to load matches.' }),
        ),
      );
    });

    it('should show an error when a candidate has no ranking', async () => {
      mockedRankMatchesWithLili.mockResolvedValue([]);

      render(<MatchesTabScreen />);

      await waitFor(() =>
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({ text2: 'Failed to load matches.' }),
        ),
      );
    });
  });

  describe('when the user opens a match chat', () => {
    it('should create the chat and navigate to it', async () => {
      const { getByTestId } = render(<MatchesTabScreen />);

      await waitFor(() => expect(getByTestId('open-1. Beta')).toBeTruthy());
      fireEvent.press(getByTestId('open-1. Beta'));

      await waitFor(() => {
        expect(mockedGetOrCreateChat).toHaveBeenCalledWith('app-1_app-3', [
          'app-1',
          'app-3',
        ]);
        expect(router.push).toHaveBeenCalledWith({
          pathname: '/chat/single-chat',
          params: { chatId: 'app-1_app-3', otherAppId: 'app-3' },
        });
      });
    });
  });

  describe('when the user unmatches someone', () => {
    it('should remove that match from the list', async () => {
      const { getByTestId, getAllByTestId } = render(<MatchesTabScreen />);

      await waitFor(() => expect(getByTestId('unmatch-1. Beta')).toBeTruthy());
      fireEvent.press(getByTestId('unmatch-1. Beta'));

      await waitFor(() => {
        expect(mockedUnmatch).toHaveBeenCalledWith('app-1', 'app-3');
        expect(getAllByTestId('match-card')).toHaveLength(1);
      });
    });
  });

  describe('when loading matches fails', () => {
    it('should show an error toast', async () => {
      mockedGetMyAppId.mockRejectedValue(new Error('Load failed'));

      render(<MatchesTabScreen />);

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load matches.',
          }),
        );
      });
    });

    describe('when opening a match chat fails', () => {
      it('should show an error toast without navigating', async () => {
        mockedGetOrCreateChat.mockRejectedValue(new Error('Chat failed'));
        const { getByTestId } = render(<MatchesTabScreen />);

        await waitFor(() => expect(getByTestId('open-1. Beta')).toBeTruthy());
        fireEvent.press(getByTestId('open-1. Beta'));

        await waitFor(() => {
          expect(toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              text1: 'Error',
              text2: 'Could not open this chat.',
            }),
          );
        });
        expect(router.push).not.toHaveBeenCalled();
      });
    });

    describe('when unmatching fails', () => {
      it('should show an error toast and keep the match', async () => {
        mockedUnmatch.mockRejectedValue(new Error('Unmatch failed'));
        const { getByTestId, getAllByTestId } = render(<MatchesTabScreen />);

        await waitFor(() => expect(getByTestId('unmatch-1. Beta')).toBeTruthy());
        fireEvent.press(getByTestId('unmatch-1. Beta'));

        await waitFor(() => {
          expect(toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              text1: 'Error',
              text2: 'Could not unmatch this person.',
            }),
          );
        });
        expect(getAllByTestId('match-card')).toHaveLength(2);
      });
    });

    describe('when no Firebase user is available', () => {
      it('should render the empty state without loading match data', async () => {
        jest.requireMock('@/config/firebase').auth.currentUser = null;

        const { getByText } = render(<MatchesTabScreen />);

        await waitFor(() => expect(getByText('No mutual matches yet.')).toBeTruthy());
        expect(mockedGetMyAppId).not.toHaveBeenCalled();
      });
    });
  });
});
