import { askLili } from '@/services/lili-ai/liliAIService';

jest.mock('@/services/ai-auth/aiAuth', () => ({
  getAiAuthHeaders: jest.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: '******',
  }),
}));

describe('askLili', () => {
  describe('when the API returns an answer', () => {
    it('should return the answer', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ answer: 'Hello' }),
      }) as jest.Mock;

      await expect(askLili([{ role: 'user', content: 'Hi' }])).resolves.toBe(
        'Hello',
      );
    });
  });

  describe('when the API omits the answer', () => {
    it('should return an empty string', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }) as jest.Mock;

      await expect(askLili([])).resolves.toBe('');
    });
  });

  describe('when the request fails', () => {
    it('should reject with an API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;

      await expect(askLili([])).rejects.toThrow('Failed to get Lili response');
    });
  });
});
