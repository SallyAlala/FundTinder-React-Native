import { getAiAuthHeaders } from '@/services/ai-auth/aiAuth';
import { AI_FUNCTION_URLS } from '@/constants/api';

export const generateThemes = async (
  description: string,
): Promise<string[]> => {
  const response = await fetch(
    AI_FUNCTION_URLS.generateThemes,
    {
      method: 'POST',
      headers: await getAiAuthHeaders(),
      body: JSON.stringify({
        description,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to generate themes');
  }

  const data = await response.json();

  return data.result.themes ?? [];
};
