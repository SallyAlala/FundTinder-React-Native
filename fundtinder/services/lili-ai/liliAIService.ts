import { getAiAuthHeaders } from '@/services/ai-auth/aiAuth';
import { LiliMessage } from '@/types/lili-message';
import { AI_FUNCTION_URLS } from '@/constants/api';

export const askLili = async (
  messages: LiliMessage[],
): Promise<string> => {
  const response = await fetch(
    AI_FUNCTION_URLS.askLili,
    {
      method: 'POST',
      headers: await getAiAuthHeaders(),
      body: JSON.stringify({
        messages,
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get Lili response');
  }

  const data = await response.json();

  return data.answer ?? '';
};
