import { Modal, Pressable, StyleSheet, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LottieView from 'lottie-react-native';
import React, { useCallback, useState } from 'react';
import { fetchAllUsers, getMyAppId } from '@/services/userService';
import { ProfileCard } from '@/components/ui/card';
import { User } from '@/types/user';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { Loading } from '@/components/ui/loading';
import { filterUsers } from '@/utils/user-filter';
import { fetchMyFilters } from '@/services/filterService';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/button';
import { buildChatId } from '@/utils/chat-id-builder';
import {
  ArrowLeft,
  ArrowRight,
  ListFilterPlus,
  MessageCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import Toast from 'react-native-toast-message';
import {
  fetchMutualMatchAppIds,
  fetchSwipedAppIds,
  saveSwipe,
} from '@/services/matchService';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAppId, setMyAppId] = useState('');
  const [matchedUser, setMatchedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const appId = await getMyAppId();
      setMyAppId(appId);

      const [allUsers, filters, mutualMatchAppIds] = await Promise.all([
        fetchAllUsers(),
        fetchMyFilters(),
        fetchMutualMatchAppIds(appId),
      ]);
      let swipedAppIds = new Set<string>();

      try {
        swipedAppIds = await fetchSwipedAppIds(appId);
      } catch (error) {
        console.error('Failed to load swipe history:', error);
      }

      const mutualMatchIds = new Set(mutualMatchAppIds);
      const matchingUsers = filterUsers(allUsers, filters, appId).filter(
        (user) => !mutualMatchIds.has(user.uid),
      );
      const newUsers = matchingUsers.filter(
        (user) => !swipedAppIds.has(user.uid),
      );

      setUsers(newUsers);
      setCurrentIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  const handleSwipe = async (user: User, wantToMatch: boolean) => {
    setCurrentIndex((prev) => prev + 1);

    try {
      const isMatch = await saveSwipe(myAppId, user.uid, wantToMatch);
      if (isMatch) {
        setMatchedUser(user);
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('home.couldNotSaveSwipe'),
      });
      return;
    }
  };

  const currentUser = users[currentIndex];

  return (
    <ParallaxScrollView
      headerImage={
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('@/assets/lottie/browse.json')}
            autoPlay
            loop
            style={styles.headerImage}
          />
        </View>
      }
      contentStyle={isDesktop ? styles.desktopContentWrapper : undefined}
    >
      <ThemedView
        style={[
          styles.titleContainer,
          isDesktop && styles.desktopTitleContainer,
        ]}
      >
        <ThemedText type="title">{t('home.browse')}</ThemedText>
      </ThemedView>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : users.length === 0 || !currentUser ? (
        <View style={styles.emptyFeedContainer}>
          <ThemedText style={styles.emptyFeedMessage}>
            {t('home.caughtUp')}
          </ThemedText>
        </View>
      ) : (
        currentUser && (
          <>
            <View style={styles.contentWrapper}>
              <View style={styles.stackContainer}>
                {users[currentIndex + 1] && (
                  <>
                    <View
                      style={[
                        styles.deckCard,
                        styles.deckCardFirst,
                        { borderColor: colors.base, pointerEvents: 'none' },
                      ]}
                    />
                    {isDesktop && (
                      <View
                        style={[
                          styles.deckCard,
                          styles.deckCardSecond,
                          { borderColor: colors.base, pointerEvents: 'none' },
                        ]}
                      />
                    )}
                  </>
                )}
                {users[currentIndex + 1] && (
                  <View style={[styles.nextCard, { pointerEvents: 'none' }]}>
                    <ProfileCard
                      {...users[currentIndex + 1]}
                      onSwipeLeft={() => undefined}
                      onSwipeRight={() => undefined}
                      cardStyle={styles.stackedCard}
                    />
                  </View>
                )}
                <View style={styles.cardWrapper}>
                  <ProfileCard
                    {...currentUser}
                    onSwipeLeft={() => handleSwipe(currentUser, false)}
                    onSwipeRight={() => handleSwipe(currentUser, true)}
                  />
                </View>
              </View>
              {isDesktop && (
                <View style={styles.desktopSwipeActions}>
                  <Pressable
                    accessibilityLabel={t('home.swipeLeft')}
                    style={[
                      styles.desktopActionButton,
                      { borderColor: colors.base, borderWidth: 3 },
                    ]}
                    onPress={() => handleSwipe(currentUser, false)}
                  >
                    <ArrowLeft size={28} color={colors.base} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t('home.swipeRight')}
                    style={[
                      styles.desktopActionButton,
                      { borderColor: colors.base, borderWidth: 3 },
                    ]}
                    onPress={() => handleSwipe(currentUser, true)}
                  >
                    <ArrowRight size={28} color={colors.base} />
                  </Pressable>
                </View>
              )}
              {isDesktop ? (
                <View style={styles.desktopActions}>
                  <Pressable
                    style={[
                      styles.desktopActionButton,
                      { borderColor: colors.base, borderWidth: 3 },
                    ]}
                    onPress={() => {
                      const chatId = buildChatId(myAppId, currentUser.uid);

                      router.push({
                        pathname: '/(tabs)/chats',
                        params: {
                          selectedChatId: chatId,
                          selectedOtherAppId: currentUser.uid,
                        },
                      });
                    }}
                  >
                    <MessageCircle size={28} color={colors.base} />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.desktopActionButton,
                      { borderColor: colors.base, borderWidth: 3 },
                    ]}
                    onPress={() => {
                      router.push('/(tabs)/filters');
                    }}
                  >
                    <ListFilterPlus size={28} color={colors.base} />
                  </Pressable>
                </View>
              ) : (
                <Button
                  title={t('home.chatRightAway')}
                  onPress={() => {
                    const chatId = buildChatId(myAppId, currentUser.uid);
                    router.push({
                      pathname: '/chat/single-chat',
                      params: {
                        chatId,
                        otherAppId: currentUser.uid,
                      },
                    });
                  }}
                />
              )}
            </View>
          </>
        )
      )}
      <Modal
        visible={matchedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMatchedUser(null)}
      >
        <View style={styles.matchOverlay}>
          <View
            style={[styles.matchCard, { backgroundColor: colors.background }]}
          >
            <LottieView
              source={require('@/assets/lottie/money-rain.json')}
              autoPlay
              loop
              style={styles.matchAnimation}
            />
            <ThemedText type="title" style={styles.matchTitle}>
              {t('home.match')}
            </ThemedText>
            <ThemedText style={styles.matchMessage}>
              {t('home.matchMessage', { name: matchedUser?.name })}
            </ThemedText>
            <Button
              title={t('home.continueBrowsing')}
              onPress={() => setMatchedUser(null)}
              style={styles.matchButton}
            />
          </View>
        </View>
      </Modal>
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

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 8,
  },

  desktopTitleContainer: {
    justifyContent: 'center',
    paddingBottom: 24,
  },

  headerImage: {
    alignSelf: 'center',
    width: 240,
    height: 240,
  },

  lottieWrapper: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },

  emptyFeedContainer: {
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyFeedMessage: {
    textAlign: 'center',
    fontStyle: 'italic',
  },

  desktopActions: {
    position: 'absolute',
    right: -90,
    top: '50%',
    transform: [{ translateY: -64 }],
    gap: 16,
  },

  contentWrapper: {
    position: 'relative',
  },

  cardWrapper: {
    zIndex: 2,
  },

  stackContainer: {
    position: 'relative',
    marginBottom: 24,
  },

  deckCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderRadius: 20,
    zIndex: 0,
  },

  deckCardFirst: {
    top: 12,
    left: 12,
  },

  deckCardSecond: {
    top: 24,
    left: 24,
  },

  nextCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },

  stackedCard: {
    height: '100%',
  },

  nextCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
    borderRadius: 20,
  },

  desktopActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  desktopSwipeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 16,
  },

  matchOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  matchCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderRadius: 24,
    padding: 24,
    gap: 12,
  },

  matchAnimation: {
    width: 220,
    height: 180,
  },

  matchTitle: {
    textAlign: 'center',
  },

  matchMessage: {
    textAlign: 'center',
    marginBottom: 8,
  },

  matchButton: {
    width: '100%',
  },
});
