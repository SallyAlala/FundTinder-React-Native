import { auth } from '@/config/firebase';

export const getAiAuthHeaders = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('You must be signed in to use Lili AI');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await user.getIdToken()}`,
  };
};
