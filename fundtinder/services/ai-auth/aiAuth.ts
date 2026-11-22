import { auth } from '@/config/firebase';

export const getAiAuthHeaders = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You must be signed in to use Lili AI');
  }

  const token = await user.getIdToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};
