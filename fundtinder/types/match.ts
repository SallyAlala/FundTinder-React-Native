import { FeedFilters } from '@/types/feed-filters';
import { User } from '@/types/user';

export type Swipe = {
  fromAppId: string;
  toAppId: string;
  wantToMatch?: boolean;
  liked?: boolean;
};

export type AiMatchRanking = {
  candidateId: string;
  score: number;
  sharedThemes: string[];
  explanation: string;
};

export type RankedMatch = User & AiMatchRanking;

export type MatchCandidate = {
  user: User;
  preferences: FeedFilters;
};
