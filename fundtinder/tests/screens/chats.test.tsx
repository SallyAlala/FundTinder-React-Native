import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import ChatsTabScreen from '@/app/(tabs)/chats';
import {
  fetchUsersIChattedWith,
  getMyAppId,
} from '@/services/user-service/userService';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: { uid: 'firebase-user' } },
}));

jest.mock('@/services/user-service/userService', () => ({
  fetchUsersIChattedWith: jest.fn(),
  getMyAppId: jest.fn(),
}));

jest.mock('@/services/chat-service/chatService', () => ({
  getProfilePictureUrl: jest.fn((url, name) => url || `https://example.test/${name}`),
  subscribeUnreadStatus: jest.fn(() => jest.fn()),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: jest.fn(() => false),
}));

jest.mock('lottie-react-native', () => 'LottieView');
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
    return <Text testID="chats-loading">Loading</Text>;
  },
}));

jest.mock('@/components/ui/chat-view/chat-view', () => ({
  ChatView: () => <></>,
}));

jest.mock('@/components/ui/chat-row/chat-row', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ChatRow: ({ name, onPress }: { name: string; onPress?: () => void }) => (
      <Pressable testID={`chat-row-${name}`} onPress={onPress}>
        <Text>{name}</Text>
      </Pressable>
    ),
  };
});

const mockedFetchUsersIChattedWith =
  fetchUsersIChattedWith as jest.MockedFunction<typeof fetchUsersIChattedWith>;
const mockedGetMyAppId = getMyAppId as jest.MockedFunction<typeof getMyAppId>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;
const mockedSubscribeUnreadStatus = jest.requireMock(
  '@/services/chat-service/chatService',
).subscribeUnreadStatus as jest.Mock;
const mockedUseLocalSearchParams = jest.requireMock(
  'expo-router',
).useLocalSearchParams as jest.Mock;
const mockedUseIsDesktop = jest.requireMock(
  '@/hooks/use-is-desktop/use-is-desktop',
).useIsDesktop as jest.Mock;

const user = {
  id: 'user-2',
  uid: 'app-2',
  name: 'Alex',
  city: 'Budapest',
  budget: 1000,
  investor: false,
  description: 'A founder',
  profilePictureUrl: '',
  themes: ['Technology'],
};

describe('Chats screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseIsDesktop.mockReturnValue(false);
    mockedUseLocalSearchParams.mockReturnValue({});
    jest.requireMock('@/config/firebase').auth.currentUser = {
      uid: 'firebase-user',
    };
    mockedGetMyAppId.mockResolvedValue('app-1');
    mockedFetchUsersIChattedWith.mockResolvedValue([user]);
  });

  describe('by default', () => {
    it('should render a loading state while chats are loading', () => {
      mockedGetMyAppId.mockImplementation(() => new Promise(() => {}));
      mockedFetchUsersIChattedWith.mockImplementation(() => new Promise(() => {}));

      const { getByTestId } = render(<ChatsTabScreen />);

      expect(getByTestId('chats-loading')).toBeTruthy();
    });

    it('should render the successful chat list', async () => {
      const { getByText } = render(<ChatsTabScreen />);

      await waitFor(() => expect(getByText('Alex')).toBeTruthy());
      expect(mockedFetchUsersIChattedWith).toHaveBeenCalledWith('firebase-user');
    });

    it('should render the empty state when the user has no conversations', async () => {
      mockedFetchUsersIChattedWith.mockResolvedValue([]);

      const { getByText } = render(<ChatsTabScreen />);

      await waitFor(() =>
        expect(getByText('You dont have any conversations yet.')).toBeTruthy(),
      );
    });

    it('should apply deep-link parameters and subscribe to unread updates', async () => {
      mockedUseLocalSearchParams.mockReturnValue({
        selectedChatId: 'app-1_app-2',
        selectedOtherAppId: 'app-2',
      });
      let unreadCallback!: (hasUnread: boolean) => void;
      mockedSubscribeUnreadStatus.mockImplementation((_id, _appId, callback) => {
        unreadCallback = callback;
        return jest.fn();
      });

      render(<ChatsTabScreen />);

      await waitFor(() =>
        expect(mockedSubscribeUnreadStatus).toHaveBeenCalledWith(
          'app-1_app-2',
          'app-1',
          expect.any(Function),
        ),
      );
      act(() => unreadCallback(true));
    });

    it('should show the selected chat in the desktop layout', async () => {
      mockedUseIsDesktop.mockReturnValue(true);
      const { getByText, getByTestId } = render(<ChatsTabScreen />);

      await waitFor(() => expect(getByTestId('chat-row-Alex')).toBeTruthy());
      expect(getByText('Select a conversation')).toBeTruthy();
      fireEvent.press(getByTestId('chat-row-Alex'));
    });
  });

  describe('when the user presses a chat row', () => {
    it('should navigate to the single chat screen', async () => {
      const { getByTestId } = render(<ChatsTabScreen />);

      await waitFor(() => expect(getByTestId('chat-row-Alex')).toBeTruthy());
      fireEvent.press(getByTestId('chat-row-Alex'));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/chat/single-chat',
        params: { chatId: 'app-1_app-2', otherAppId: 'app-2' },
      });
    });
  });

  describe('when loading chats fails', () => {
    it('should show an error toast', async () => {
      mockedFetchUsersIChattedWith.mockRejectedValue(new Error('Load failed'));

      render(<ChatsTabScreen />);

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Error',
            text2: 'An unknown error occurred, please try again later.',
          }),
        );
      });
    });

    describe('when no Firebase user is available', () => {
      it('should stop loading without fetching conversations', async () => {
        jest.requireMock('@/config/firebase').auth.currentUser = null;

        render(<ChatsTabScreen />);

        await waitFor(() =>
          expect(mockedFetchUsersIChattedWith).not.toHaveBeenCalled(),
        );
      });
    });
  });
});
