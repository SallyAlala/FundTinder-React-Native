export const askLili = async (message: string): Promise<string> => {
  const response = await fetch(
    'https://us-central1-fundtinder.cloudfunctions.net/askLili',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get Lili response');
  }

  const data = await response.json();

  return data.answer ?? '';
};
