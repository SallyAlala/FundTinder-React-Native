import React from 'react';
import { render } from '@testing-library/react-native';
import SingleChatScreen from '@/app/chat/single-chat';
import { ChatView } from '@/components/ui/chat-view/chat-view';

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

jest.mock('@/components/ui/chat-view/chat-view', () => ({
  ChatView: jest.fn(() =>
    require('react').createElement(require('react-native').Text, null, 'Chat view'),
  ),
}));

const mockedUseLocalSearchParams = jest.requireMock(
  'expo-router',
).useLocalSearchParams as jest.Mock;
const mockedChatView = ChatView as jest.MockedFunction<typeof ChatView>;

describe('Single chat screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('by default', () => {
    it('should pass the route parameters to ChatView', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        chatId: 'chat-123',
        otherAppId: 'other-app',
      });

      render(<SingleChatScreen />);

      expect(mockedChatView).toHaveBeenCalledWith(
        { chatId: 'chat-123', otherAppId: 'other-app' },
        undefined,
      );
    });
  });
});
