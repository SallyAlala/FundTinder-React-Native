import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { MatchCard } from '@/components/ui/match-card';
import { Loading } from '@/components/ui/loading';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { auth } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import {
  fetchFiltersByAppId,
  fetchMyFilters,
} from '@/services/filterService';
import {
  fetchAllUsers,
  fetchUserByAppId,
  getMyAppId,
} from '@/services/userService';
import { FeedFilters } from '@/types/feed-filters';
import { User } from '@/types/user';
import { buildChatId } from '@/utils/chat-id-builder';
import { getOrCreateChat } from '@/services/chatService';
import {
  AiMatchRanking,
  fetchMutualMatchAppIds,
  rankMatchesWithLili,
} from '@/services/matchService';

type RankedMatch = User & AiMatchRanking;

export default function MatchesTabScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const isDesktop = useIsDesktop();
  const [matches, setMatches] = useState<RankedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [myAppId, setMyAppId] = useState('');

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      const firebaseUid = auth.currentUser?.uid;

      if (!firebaseUid) {
        setMatches([]);
        return;
      }

      const myAppId = await getMyAppId();
      if (!myAppId) {
        throw new Error('Current user mapping not found');
      }
      setMyAppId(myAppId);

      const [currentUser, allUsers, myFilters] = await Promise.all([
        fetchUserByAppId(myAppId),
        fetchAllUsers(),
        fetchMyFilters(),
      ]);
      const mutualMatchAppIds = new Set(
        await fetchMutualMatchAppIds(myAppId),
      );

      if (!currentUser) {
        throw new Error('Current user profile not found');
      }

      const candidates = allUsers.filter(
        (user) => user.uid !== myAppId && mutualMatchAppIds.has(user.uid),
      );
      const candidatesWithPreferences = await Promise.all(
        candidates.map(async (candidate) => {
          const candidateFilters: FeedFilters = await fetchFiltersByAppId(
            candidate.uid,
          );

          return {
            user: candidate,
            preferences: candidateFilters,
          };
        }),
      );

      const rankings = await rankMatchesWithLili(
        currentUser,
        myFilters,
        candidatesWithPreferences,
      );
      const rankingByCandidateId = new Map(
        rankings.map((ranking) => [ranking.candidateId, ranking]),
      );
      const rankedMatches = candidates
        .map((candidate) => {
          const ranking = rankingByCandidateId.get(candidate.uid);

          if (!ranking) {
            throw new Error('Missing Lili ranking for candidate');
          }

          return { ...candidate, ...ranking };
        })
        .sort(
          (a, b) => b.score - a.score || a.name.localeCompare(b.name),
        );

      setMatches(rankedMatches);
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load matches.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches]),
  );

  return (
    <ParallaxScrollView
      headerImage={
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('@/assets/lottie/ai.json')}
            autoPlay
            loop
            style={styles.headerImage}
          />
        </View>
      }
      contentStyle={isDesktop ? styles.desktopContentWrapper : undefined}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Matches</ThemedText>
      </ThemedView>

      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.tabBarBackgroundColor },
        ]}
      >
        <Sparkles size={22} color={colors.base} />
        <View style={styles.infoContent}>
          <ThemedText type="defaultSemiBold">Lili AI ranking</ThemedText>
          <ThemedText>
            Lili AI ranked your mutual matches from strongest to weakest based
            on your preferences.
          </ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : matches.length === 0 ? (
        <ThemedText>No mutual matches yet.</ThemedText>
      ) : (
        matches.map((match, index) => (
          <MatchCard
            key={match.id}
            name={`${index + 1}. ${match.name}`}
            city={match.city}
            investor={match.investor}
            profilePictureUrl={match.profilePictureUrl}
            score={match.score}
            sharedThemes={match.sharedThemes}
            explanation={match.explanation}
            onPress={async () => {
              if (!myAppId) return;

              const chatId = buildChatId(myAppId, match.uid);

              try {
                await getOrCreateChat(chatId, [myAppId, match.uid]);
                router.push({
                  pathname: '/chat/single-chat',
                  params: {
                    chatId,
                    otherAppId: match.uid,
                  },
                });
              } catch (error) {
                console.error(error);
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Could not open this chat.',
                });
              }
            }}
          />
        ))
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  desktopContentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 64,
  },
  lottieWrapper: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    alignSelf: 'center',
    width: 240,
    height: 240,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
});
