import {
  addDoc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getOrCreateChat,
  getProfilePictureUrl,
  markChatAsRead,
  sendMessage,
  subscribeToMessages,
  subscribeUnreadStatus,
} from '@/services/chat-service/chatService';

jest.mock('@/config/firebase', () => ({ db: {} }));

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn((...args) => args),
  doc: jest.fn((...args) => args),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

describe('chat service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(12345);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('when resolving a profile image', () => {
    it('should use the supplied profile image or a safe initials fallback', () => {
      expect(
        getProfilePictureUrl(' https://image.test/avatar.png ', 'Person'),
      ).toBe(' https://image.test/avatar.png ');
      expect(getProfilePictureUrl('', 'John Doe')).toContain('seed=John%20Doe');
      expect(getProfilePictureUrl()).toContain('seed=User');
    });
  });

  describe('when sending a message', () => {
    it('should save the message and update chat metadata', async () => {
      await sendMessage('chat-1', 'person', 'Hello');

      expect(addDoc).toHaveBeenCalledWith([{}, 'chat', 'chat-1', 'messages'], {
        senderId: 'person',
        text: 'Hello',
        timestamp: 12345,
      });
      expect(updateDoc).toHaveBeenCalledWith(
        [{}, 'chat', 'chat-1'],
        expect.objectContaining({ lastMessageAt: 12345 }),
      );
    });
  });

  describe('when creating a chat', () => {
    it('should create missing chats and not overwrite existing chats', async () => {
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      await getOrCreateChat('chat-1', ['one', 'two']);
      expect(setDoc).toHaveBeenCalledTimes(1);

      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true });
      await getOrCreateChat('chat-1', ['one', 'two']);
      expect(setDoc).toHaveBeenCalledTimes(1);

      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('offline'));
      await getOrCreateChat('chat-2', ['one', 'two']);
      expect(setDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('when reading chat state', () => {
    it('should mark chats as read and map message snapshots', async () => {
      await markChatAsRead('chat-1', 'person');
      expect(updateDoc).toHaveBeenCalledWith([{}, 'chat', 'chat-1'], {
        'lastRead.person': 12345,
      });

      const callback = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation((_query, handler) =>
        handler({
          docs: [{ id: 'message-1', data: () => ({ text: 'Hi' }) }],
        }),
      );
      subscribeToMessages('chat-1', callback);
      expect(callback).toHaveBeenCalledWith([{ id: 'message-1', text: 'Hi' }]);
    });
  });

  describe('when calculating unread state', () => {
    it('should report whether another user has unread messages', () => {
      const callback = jest.fn();
      (onSnapshot as jest.Mock).mockImplementation((_ref, handler) => {
        handler({
          exists: () => true,
          data: () => ({
            lastMessageSenderId: 'other',
            lastMessageAt: 20,
            lastRead: { person: 10 },
          }),
        });
      });

      subscribeUnreadStatus('chat-1', 'person', callback);
      expect(callback).toHaveBeenCalledWith(true);

      const unreadWithoutReadTimestamp = jest.fn();
      (onSnapshot as jest.Mock).mockImplementationOnce((_ref, handler) =>
        handler({
          exists: () => true,
          data: () => ({ lastMessageSenderId: 'other', lastMessageAt: 1 }),
        }),
      );
      subscribeUnreadStatus('chat-2', 'person', unreadWithoutReadTimestamp);
      expect(unreadWithoutReadTimestamp).toHaveBeenCalledWith(true);

      const missingChatCallback = jest.fn();
      (onSnapshot as jest.Mock).mockImplementationOnce((_ref, handler) =>
        handler({ exists: () => false }),
      );
      subscribeUnreadStatus('missing', 'person', missingChatCallback);
      expect(missingChatCallback).toHaveBeenCalledWith(false);
    });
  });
});
