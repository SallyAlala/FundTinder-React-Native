import { Pressable, StyleSheet, View } from 'react-native';
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
import { ListFilterPlus, MessageCircle } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myAppId, setMyAppId] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);

      const appId = await getMyAppId();
      setMyAppId(appId);

      const [allUsers, filters] = await Promise.all([
        fetchAllUsers(),
        fetchMyFilters(),
      ]);
      const filteredUsers = filterUsers(allUsers, filters, myAppId);

      setUsers(filteredUsers);
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

  const handleSwipe = () => {
    setCurrentIndex((prev) => prev + 1);
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
        <ThemedText type="title">Browse</ThemedText>
      </ThemedView>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : users.length === 0 ? (
        <ThemedText>No users match your current filters.</ThemedText>
      ) : (
        currentUser && (
          <>
            <View style={styles.contentWrapper}>
              <View style={styles.cardWrapper}>
                <ProfileCard
                  {...currentUser}
                  onSwipeLeft={handleSwipe}
                  onSwipeRight={handleSwipe}
                />
              </View>
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
                  title="Chat right away"
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
    paddingBottom: 24,
  },

  desktopActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
