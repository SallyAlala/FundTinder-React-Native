import { getAiAuthHeaders } from '@/services/ai-auth/aiAuth';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: null },
}));

const getIdToken = jest.fn().mockResolvedValue('token-123');

describe('getAiAuthHeaders', () => {
  describe('when no user is authenticated', () => {
    it('should reject with an authentication error', async () => {
      await expect(getAiAuthHeaders()).rejects.toThrow(
        'You must be signed in to use Lili AI',
      );
    });
  });

  describe('when a user is authenticated', () => {
    it('should return JSON and bearer-token headers', async () => {
      const firebase = jest.requireMock('@/config/firebase') as {
        auth: { currentUser: null | { getIdToken: typeof getIdToken } };
      };
      firebase.auth.currentUser = { getIdToken };

      await expect(getAiAuthHeaders()).resolves.toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      });
    });
  });
});
