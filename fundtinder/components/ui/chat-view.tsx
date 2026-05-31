import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/message';
import { User } from '@/types/user';
import { fetchUserByAppId, getMyAppId } from '@/services/userService';
import {
  getProfilePictureUrl,
  markChatAsRead,
  sendMessage,
  subscribeToMessages,
} from '@/services/chatService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Loading } from '@/components/ui/loading';
import { ArrowLeft, SendHorizontal } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';

type Props = {
  chatId: string;
  otherAppId: string;
};

export function ChatView({ chatId, otherAppId }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isDesktop = useIsDesktop();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [myAppId, setMyAppId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatData, setChatData] = useState<any>(null);

  const otherReadTimestamp = chatData?.lastRead?.[otherAppId];

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [appId, user] = await Promise.all([
          getMyAppId(),
          fetchUserByAppId(otherAppId),
        ]);

        setMyAppId(appId);
        setOtherUser(user);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [otherAppId]);

  useEffect(() => {
    if (!chatId || !myAppId) return;

    return subscribeToMessages(chatId, async (messages) => {
      setMessages(messages);

      await markChatAsRead(chatId, myAppId);
    });
  }, [chatId, myAppId]);

  useEffect(() => {
    if (!chatId) return;

    return onSnapshot(doc(db, 'chat', chatId), (snapshot) => {
      if (snapshot.exists()) {
        setChatData(snapshot.data());
      }
    });
  }, [chatId]);

  const handleSend = async () => {
    const text = messageText.trim();

    if (!text || !myAppId) return;

    await sendMessage(chatId, myAppId, text);

    setMessageText('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.inputWrapper,
          },
          isDesktop && styles.desktopWrapper,
        ]}
      >
        {!isDesktop && (
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
        )}

        {otherUser?.profilePictureUrl ? (
          <Image
            source={{
              uri: otherUser.profilePictureUrl,
            }}
            style={styles.avatar}
          />
        ) : (
          <Image
            source={{
              uri: getProfilePictureUrl(
                otherUser?.profilePictureUrl,
                otherUser?.name,
              ),
            }}
            style={styles.avatar}
          />
        )}

        <ThemedText type="subtitle">{otherUser?.name}</ThemedText>
      </View>

      <View
        style={[styles.messagesWrapper, isDesktop && styles.desktopWrapper]}
      >
        <FlatList
          ref={flatListRef}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          inverted
          data={[...messages].reverse()}
          renderItem={({ item, index }) => {
            const isMine = item.senderId === myAppId;
            const isLastMessage = index === 0;

            return (
              <View
                style={[
                  styles.messageContainer,
                  isMine
                    ? styles.myMessageContainer
                    : styles.otherMessageContainer,
                ]}
              >
                <View style={styles.messageRow}>
                  {!isMine && (
                    <Image
                      source={{
                        uri: getProfilePictureUrl(
                          otherUser?.profilePictureUrl,
                          otherUser?.name,
                        ),
                      }}
                      style={styles.messageAvatar}
                    />
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.myMessage : styles.otherMessage,
                      {
                        backgroundColor: isMine
                          ? colors.base
                          : colors.tabBarBackgroundColor,
                      },
                    ]}
                  >
                    <ThemedText
                      style={isMine ? styles.myMessageText : undefined}
                    >
                      {item.text}
                    </ThemedText>
                  </View>
                </View>
                {isMine &&
                  isLastMessage &&
                  otherReadTimestamp &&
                  otherReadTimestamp >= item.timestamp && (
                    <ThemedText style={styles.seenText}>
                      Seen{' '}
                      {new Date(otherReadTimestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </ThemedText>
                  )}
              </View>
            );
          }}
        />
      </View>

      <View
        style={[
          styles.inputContainer,
          isDesktop && styles.desktopWrapper,
          {
            borderTopColor: colors.inputWrapper,
          },
        ]}
      >
        <TextInput
          multiline
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.inputWrapper,
              maxHeight: 180,
            },
          ]}
        />

        <Pressable onPress={handleSend} style={styles.sendButton}>
          <SendHorizontal size={24} color={colors.base} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  desktopWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },

  backButton: {
    padding: 4,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  messagesWrapper: {
    flex: 1,
  },

  messagesContent: {
    padding: 16,
    gap: 12,
  },

  messageContainer: {
    marginBottom: 8,
  },

  myMessageContainer: {
    alignItems: 'flex-end',
  },

  otherMessageContainer: {
    alignItems: 'flex-start',
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
  },

  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: 220,
  },

  myMessage: {
    alignSelf: 'flex-end',
  },

  otherMessage: {
    alignSelf: 'flex-start',
  },

  myMessageText: {
    color: 'white',
  },

  seenText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
    textAlign: 'right',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
  },

  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  sendButton: {
    padding: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
