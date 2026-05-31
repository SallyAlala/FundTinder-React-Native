import { StyleSheet, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { auth } from '@/config/firebase';
import { fetchUsersIChattedWith, getMyAppId } from '@/services/userService';
import Toast from 'react-native-toast-message';
import { User } from '@/types/user';
import { ChatRow } from '@/components/ui/chat-row';
import { Loading } from '@/components/ui/loading';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { router, useLocalSearchParams } from 'expo-router';
import { buildChatId } from '@/utils/chat-id-builder';
import {
  getProfilePictureUrl,
  subscribeUnreadStatus,
} from '@/services/chatService';
import { ChatView } from '@/components/ui/chat-view';

export default function ChatsTabScreen() {
  const isDesktop = useIsDesktop();

  const [selectedChatId, setSelectedChatId] = useState('');
  const [selectedOtherAppId, setSelectedOtherAppId] = useState('');

  const [myAppId, setMyAppId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [unreadChats, setUnreadChats] = useState<Record<string, boolean>>({});

  const params = useLocalSearchParams();

  useEffect(() => {
    if (
      typeof params.selectedChatId === 'string' &&
      typeof params.selectedOtherAppId === 'string'
    ) {
      setSelectedChatId(params.selectedChatId);
      setSelectedOtherAppId(params.selectedOtherAppId);
    }
  }, [params.selectedChatId, params.selectedOtherAppId]);

  useEffect(() => {
    if (!myAppId || users.length === 0) {
      return;
    }

    const unsubscribers: (() => void)[] = [];

    users.forEach((user) => {
      const chatId = buildChatId(myAppId, user.uid);

      const unsubscribe = subscribeUnreadStatus(
        chatId,
        myAppId,
        (hasUnread) => {
          setUnreadChats((prev) => ({
            ...prev,
            [chatId]: hasUnread,
          }));
        },
      );
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [users, myAppId]);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const uid = auth.currentUser?.uid;

        if (!uid) return;

        const data = await fetchUsersIChattedWith(uid);
        setUsers(data);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unknown error occurred, please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  useEffect(() => {
    const loadMyAppId = async () => {
      const appId = await getMyAppId();
      setMyAppId(appId);
    };

    loadMyAppId();
  }, []);

  return (
    <ParallaxScrollView
      headerImage={
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('@/assets/lottie/chat.json')}
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
        <ThemedText type="title">Chats</ThemedText>
      </ThemedView>

      {loading || !myAppId ? (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      ) : users.length === 0 ? (
        <ThemedText>{'You dont have any conversations yet.'}</ThemedText>
      ) : isDesktop ? (
        <View style={styles.desktopLayout}>
          <View style={styles.chatListPane}>
            {users.map((user) => {
              const chatId = buildChatId(myAppId, user.uid);

              return (
                <ChatRow
                  key={user.id}
                  name={user.name}
                  imageUrl={
                    user.profilePictureUrl?.trim()
                      ? user.profilePictureUrl
                      : getProfilePictureUrl(undefined, user.name)
                  }
                  hasUnread={unreadChats[chatId] ?? false}
                  onPress={() => {
                    setSelectedChatId(chatId);
                    setSelectedOtherAppId(user.uid);
                  }}
                />
              );
            })}
          </View>

          <View style={styles.chatPane}>
            {selectedChatId ? (
              <ChatView
                chatId={selectedChatId}
                otherAppId={selectedOtherAppId}
              />
            ) : (
              <View style={styles.emptyChatState}>
                <ThemedText type="subtitle">Select a conversation</ThemedText>
                <ThemedText>
                  Choose a chat from the list to start messaging.
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      ) : (
        users.map((user) => {
          const chatId = buildChatId(myAppId, user.uid);

          return (
            <ChatRow
              key={user.id}
              name={user.name}
              imageUrl={
                user.profilePictureUrl?.trim()
                  ? user.profilePictureUrl
                  : getProfilePictureUrl(undefined, user.name)
              }
              hasUnread={unreadChats[chatId] ?? false}
              onPress={() => {
                router.push({
                  pathname: '/chat/single-chat',
                  params: {
                    chatId,
                    otherAppId: user.uid,
                  },
                });
              }}
            />
          );
        })
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
    width: 280,
    height: 240,
  },

  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },

  desktopTitleContainer: {
    justifyContent: 'center',
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },

  desktopLayout: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 700,
  },

  chatListPane: {
    width: 320,
    justifyContent: 'center',
    height: '60vh' as any,
  },

  chatPane: {
    flex: 1,
    height: '60vh' as any,
    overflow: 'hidden',
  },

  emptyChatState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
