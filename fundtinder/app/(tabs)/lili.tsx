import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { askLili } from '@/services/liliAIService';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import i18n from '@/constants/i18n';

type LiliMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function LiliAITabScreen() {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<LiliMessage[]>([
    {
      role: 'assistant',
      content: t('lili.welcome'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);
  const suggestions = [
    t('lili.whatIs'),
    t('lili.filter'),
    t('lili.themes'),
    t('lili.profile'),
  ];

  const handleSend = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isTyping) {
      return;
    }

    const userMessage: LiliMessage = {
      role: 'user',
      content: trimmedMessage,
    };
    const conversation = [...messages, userMessage];

    setMessages(conversation);
    setIsTyping(true);

    try {
      const answer = await askLili(conversation);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
        {isTyping && (
          <View
            style={[
              styles.messageBubble,
              styles.assistantBubble,
              { backgroundColor: colors.tabBarBackgroundColor },
            ]}
            accessibilityLabel={t('lili.typing')}
          >
            <TypingIndicator color={colors.base} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextField
          placeholder={t('lili.placeholder')}
          value={input}
          onChangeText={setInput}
        />

        <Button
          title={t('lili.send')}
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

function TypingIndicator({ color }: { color: string }) {
  const firstDot = useRef(new Animated.Value(0)).current;
  const secondDot = useRef(new Animated.Value(0)).current;
  const thirdDot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dots = [firstDot, secondDot, thirdDot];
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dot, {
            toValue: 1,
            duration: 360,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 360,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - index) * 140),
        ]),
      ),
    );

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [firstDot, secondDot, thirdDot]);

  return (
    <View style={styles.typingIndicator}>
      <ThemedText style={styles.typingLabel}>
        {i18n.t('lili.typing')}
      </ThemedText>
      {[firstDot, secondDot, thirdDot].map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            {
              backgroundColor: color,
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 1],
              }),
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
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

  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 20,
  },

  typingLabel: {
    marginRight: 2,
    opacity: 0.7,
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
