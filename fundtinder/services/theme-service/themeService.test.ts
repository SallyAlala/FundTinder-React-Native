import { generateThemes } from '@/services/theme-service/themeService';

jest.mock('@/services/ai-auth/aiAuth', () => ({
  getAiAuthHeaders: jest.fn().mockResolvedValue({
    'Content-Type': 'application/json',
    Authorization: '******',
  }),
}));

describe('generateThemes', () => {
  describe('when the API request succeeds', () => {
    it('should send the description and return themes', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: { themes: ['tech'] } }),
      }) as jest.Mock;

      await expect(generateThemes('AI tools')).resolves.toEqual(['tech']);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/generateThemes'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ description: 'AI tools' }),
        }),
      );
    });
  });

  describe('when the API request fails', () => {
    it('should reject with a theme generation error', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as jest.Mock;

      await expect(generateThemes('AI tools')).rejects.toThrow(
        'Failed to generate themes',
      );
    });
  });

  it('should return an empty list when the API omits themes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: {} }),
    }) as jest.Mock;

    await expect(generateThemes('AI tools')).resolves.toEqual([]);
  });
});
