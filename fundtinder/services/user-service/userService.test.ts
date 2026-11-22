import { getDownloadURL, uploadBytes } from 'firebase/storage';
import { getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { generateThemes } from '@/services/theme-service/themeService';
import {
  fetchAllUsers,
  fetchAvailableThemes,
  fetchProfileData,
  fetchUserByAppId,
  fetchUsersIChattedWith,
  getMyAppId,
  updateUserProfile,
  uploadProfilePicture,
} from '@/services/user-service/userService';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}));

jest.mock('@/services/theme-service/themeService', () => ({
  generateThemes: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn((...args) => args),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  updateDoc: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getDownloadURL: jest.fn(),
  ref: jest.fn((...args) => args),
  uploadBytes: jest.fn(),
}));

const firebase = jest.requireMock('@/config/firebase') as {
  auth: { currentUser: null | { uid: string } };
};

describe('user service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDoc as jest.Mock).mockReset();
    firebase.auth.currentUser = { uid: 'firebase-uid' };
  });

  describe('when resolving the current user app id', () => {
    it('should return the app id from the Firebase mapping', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        data: () => ({ appId: 'person' }),
      });

      await expect(getMyAppId()).resolves.toBe('person');
    });
  });

  describe('when authentication or mapping is missing', () => {
    it('should reject with an explicit error', async () => {
      firebase.auth.currentUser = null;
      await expect(getMyAppId()).rejects.toThrow('User not authenticated');

      firebase.auth.currentUser = { uid: 'firebase-uid' };
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });
      await expect(getMyAppId()).rejects.toThrow('User mapping not found');
    });
  });

  describe('when fetching users and profile data', () => {
    it('should return the mapped users and profile', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ uid: 'person', name: 'Person' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ appId: 'person' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'Person', city: 'Pecs' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ appId: 'person' }),
        })
        .mockResolvedValueOnce({ exists: () => false });

      await expect(fetchUserByAppId('other')).resolves.toBeNull();
      await expect(fetchUserByAppId('person')).resolves.toEqual({
        uid: 'person',
        name: 'Person',
      });
      await expect(fetchProfileData('firebase-uid')).resolves.toEqual({
        name: 'Person',
        city: 'Pecs',
      });
      await expect(fetchProfileData('firebase-uid')).rejects.toThrow(
        'User profile not found',
      );
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      await expect(fetchProfileData('firebase-uid')).rejects.toThrow(
        'User mapping not found',
      );

      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ id: 'one', data: () => ({ uid: 'one' }) }],
      });
      await expect(fetchAllUsers()).resolves.toEqual([
        { id: 'one', uid: 'one' },
      ]);
    });
  });

  describe('when loading chat participants', () => {
    it('should reject an empty uid and return the other users', async () => {
      await expect(fetchUsersIChattedWith('')).rejects.toThrow(
        'No UID provided',
      );
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      await expect(fetchUsersIChattedWith('firebase-uid')).rejects.toThrow(
        'User mapping not found',
      );

      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ appId: 'me' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ name: 'Other' }),
        });
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [{ data: () => ({ participants: ['me', 'other'] }) }],
      });

      await expect(fetchUsersIChattedWith('firebase-uid')).resolves.toEqual([
        { name: 'Other' },
      ]);
    });
  });

  describe('when uploading a profile picture', () => {
    it('should upload the image and return its download URL', async () => {
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ appId: 'person' }),
        })
        .mockResolvedValueOnce({
          id: 'person',
          exists: () => true,
          data: () => ({}),
        });
      (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
        blob: async () => 'blob',
      });
      (getDownloadURL as jest.Mock).mockResolvedValue('https://image.test');

      await expect(
        uploadProfilePicture('firebase-uid', 'file://image'),
      ).resolves.toBe('https://image.test');
      expect(uploadBytes).toHaveBeenCalled();
    });
  });

  describe('when updating a profile description', () => {
    it('should regenerate themes for the new description', async () => {
      const consoleLog = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ appId: 'person' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ description: 'old', themes: ['old-theme'] }),
        });
      (generateThemes as jest.Mock).mockResolvedValue(['new-theme']);

      await updateUserProfile('firebase-uid', {
        name: 'Person',
        city: 'Pecs',
        budget: '1000',
        investor: false,
        description: 'new',
        profilePictureUrl: '',
      });
      expect(generateThemes).toHaveBeenCalledWith('new');
      expect(updateDoc).toHaveBeenCalledWith(
        [{}, 'users', 'person'],
        expect.objectContaining({ themes: ['new-theme'] }),
      );
      consoleLog.mockRestore();
    });
  });

  describe('when available themes are loaded', () => {
    it('should return unique sorted themes', async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [
          { data: () => ({ themes: ['zeta', 'alpha'] }) },
          { data: () => ({ themes: ['alpha', ' '] }) },
        ],
      });

      await expect(fetchAvailableThemes()).resolves.toEqual(['alpha', 'zeta']);
    });
  });
});
