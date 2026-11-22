export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  location: string;
  budget: string;
  description: string;
  isInvestor: boolean;
  profilePictureUrl?: string | null;
};

export type AuthContextType = {
  user: import('firebase/auth').User | null;
  loading: boolean;
};
