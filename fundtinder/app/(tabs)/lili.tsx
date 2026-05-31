import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import LottieView from 'lottie-react-native';
import { useRef, useState } from 'react';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { askLili } from '@/services/liliAIService';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';

export default function LiliAITabScreen() {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm Lili AI. I can help you navigate FundTinder and answer startup-related questions.",
    },
  ]);

  const [input, setInput] = useState('');
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const suggestions = [
    'What is FundTinder?',
    'How can I filter users?',
    'How do themes work?',
    'How can I improve my profile?',
  ];

  const handleSend = async (message: string) => {
    const userMessage = {
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    const answer = await askLili(message);

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: answer,
      },
    ]);
  };

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
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Lili AI
        </ThemedText>
      </ThemedView>

      <View style={styles.chipsContainer}>
        {suggestions.map((suggestion) => (
          <Pressable
            key={suggestion}
            style={[
              styles.chip,
              {
                borderColor: colors.base,
                borderWidth: hoveredChip === suggestion ? 3 : 1,
              },
            ]}
            onPress={() => handleSend(suggestion)}
            onHoverIn={() => setHoveredChip(suggestion)}
            onHoverOut={() => setHoveredChip(null)}
          >
            <ThemedText style={styles.chipText}>{suggestion}</ThemedText>
          </Pressable>
        ))}
      </View>
      <ScrollView
        ref={scrollViewRef}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({
            animated: true,
          })
        }
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user'
                ? [styles.userBubble, { backgroundColor: colors.base }]
                : [
                    styles.assistantBubble,
                    {
                      backgroundColor: colors.tabBarBackgroundColor,
                    },
                  ],
            ]}
          >
            <ThemedText>{message.content}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextField
          placeholder="Ask Lili AI..."
          value={input}
          onChangeText={setInput}
        />

        <Button
          title="Send"
          onPress={() => {
            if (!input.trim()) {
              return;
            }

            handleSend(input);
            setInput('');
          }}
        />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    alignSelf: 'center',
    width: 240,
    height: 240,
  },

  desktopContentWrapper: {
    maxWidth: 950,
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

  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    cursor: 'pointer',
  },

  chipText: {
    fontSize: 14,
  },
  messagesContainer: {
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },

  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
  },

  userBubble: {
    alignSelf: 'flex-end',
  },

  assistantBubble: {
    alignSelf: 'flex-start',
  },

  messagesScroll: {
    maxHeight: 500,
    marginBottom: 24,
    width: '100%',
  },

  inputContainer: {
    gap: 12,
    marginTop: 16,
  },
});
