import { getAiAuthHeaders } from '@/services/aiAuth';

type LiliMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export const askLili = async (
  messages: LiliMessage[],
): Promise<string> => {
  const response = await fetch(
    'https://us-central1-fundtinder.cloudfunctions.net/askLili',
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
