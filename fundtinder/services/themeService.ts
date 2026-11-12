export const generateThemes = async (
  description: string,
): Promise<string[]> => {
  const response = await fetch(
    'https://us-central1-fundtinder.cloudfunctions.net/generateThemes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
