import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { setDoc } from '@firebase/firestore';
import { generateThemes } from '@/services/theme-service/themeService';
import { login, logout, signUp } from '@/services/auth-service/authService';

jest.mock('@/config/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args) => args),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock('@firebase/firestore', () => ({
  setDoc: jest.fn(),
}));

jest.mock('@/services/theme-service/themeService', () => ({
  generateThemes: jest.fn(),
}));

const auth = jest.requireMock('@/config/firebase').auth;

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when logging in', () => {
    it('should delegate credentials to Firebase Auth', async () => {
      const credential = { user: { uid: 'firebase-uid' } };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(credential);

      await expect(login('person@example.com', 'password')).resolves.toBe(
        credential,
      );
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'person@example.com',
        'password',
      );
    });
  });

  describe('when signing up with a new email', () => {
    it('should create the user mapping and profile', async () => {
      const user = { uid: 'firebase-uid' };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user });
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      (generateThemes as jest.Mock).mockResolvedValue(['technology']);

      await expect(
        signUp({
          email: 'Person@Example.com',
          password: 'password',
          name: 'Person',
          location: 'Budapest',
          budget: '1000',
          description: 'Tech investor',
          isInvestor: true,
        }),
      ).resolves.toBe(user);

      expect(generateThemes).toHaveBeenCalledWith('Tech investor');
      expect(setDoc).toHaveBeenCalledTimes(2);
      expect(setDoc).toHaveBeenLastCalledWith(
        [{}, 'users', 'person'],
        expect.objectContaining({
          uid: 'person',
          username: 'Person@Example.com',
          themes: ['technology'],
          profilePictureUrl: null,
        }),
      );
    });
  });

  describe('when signing up with an existing email', () => {
    it('should reject duplicate app users', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: { uid: 'firebase-uid' },
      });
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
      (generateThemes as jest.Mock).mockResolvedValue([]);

      await expect(
        signUp({
          email: 'person@example.com',
          password: 'password',
          name: 'Person',
          location: 'Budapest',
          budget: '1000',
          description: 'Description',
          isInvestor: false,
        }),
      ).rejects.toThrow('User already exists');
      expect(setDoc).not.toHaveBeenCalled();
    });
  });

  describe('when logging out', () => {
    it('should rethrow Firebase errors after logging them', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);
      await expect(logout()).resolves.toBeUndefined();

      const error = new Error('network');
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      (signOut as jest.Mock).mockRejectedValue(error);

      await expect(logout()).rejects.toBe(error);
      expect(consoleError).toHaveBeenCalledWith('Logout failed:', error);
      consoleError.mockRestore();
    });
  });
});
