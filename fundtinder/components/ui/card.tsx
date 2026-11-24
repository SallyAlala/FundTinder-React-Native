import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  Image,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Collapsible } from '@/components/ui/collapsible';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { getProfilePictureUrl } from '@/services/chatService';
import { useTranslation } from 'react-i18next';

type Props = {
  name: string;
  city: string;
  budget: number;
  investor: boolean;
  description: string;
  profilePictureUrl: string;

  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  cardStyle?: StyleProp<ViewStyle>;
};

export function ProfileCard({
  name,
  city,
  budget,
  investor,
  description,
  profilePictureUrl,
  onSwipeLeft,
  onSwipeRight,
  cardStyle,
}: Props) {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { t } = useTranslation();

  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);

  const roleText = investor ? t('card.investor') : t('card.founder');

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      rotate.value = event.translationX / 20;
    })
    .onEnd(() => {
      if (translateX.value > 120) {
        translateX.value = withTiming(
          500,
          { duration: 350, easing: Easing.out(Easing.cubic) },
          () => {
            runOnJS(onSwipeRight)();

            translateX.value = 0;
            rotate.value = 0;
          },
        );
      } else if (translateX.value < -120) {
        translateX.value = withTiming(
          -500,
          { duration: 350, easing: Easing.out(Easing.cubic) },
          () => {
            runOnJS(onSwipeLeft)();

            translateX.value = 0;
            rotate.value = 0;
          },
        );
      } else {
        translateX.value = withSpring(0);
        rotate.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {
            backgroundColor: colors.background,
            borderColor: colors.base,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: colors.base,
            },
          ]}
        >
          <ThemedText
            type="defaultSemiBold"
            style={{ color: colors.background }}
          >
            {roleText}
          </ThemedText>
        </View>

        <View
          style={[
            styles.imageContainer,
            isDesktop && styles.imageDesktopContainer,
          ]}
        >
          <Image
            source={{
              uri: getProfilePictureUrl(profilePictureUrl, name),
            }}
            style={styles.blurBackground}
            resizeMode="cover"
            blurRadius={20}
          />

          <Image
            source={{
              uri: getProfilePictureUrl(profilePictureUrl, name),
            }}
            style={styles.mainImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Collapsible title={t('card.name')}>
            <ThemedText type="subtitle">{name}</ThemedText>
          </Collapsible>

          <Collapsible title={t('card.location')}>
            <ThemedText>{city}</ThemedText>
          </Collapsible>

          <Collapsible title={t('card.budget')}>
            <ThemedText type="numeric">{budget}</ThemedText>
          </Collapsible>

          <Collapsible title={t('card.description')}>
            <ThemedText style={styles.description}>{description}</ThemedText>
          </Collapsible>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
    }),
    elevation: 5,
  },

  desktopCard: {
    minHeight: 750,
  },

  roleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 2,
  },

  imageDesktopContainer: {
    height: 400,
  },

  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },

  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },

  mainImage: {
    width: '100%',
    height: '100%',
  },

  content: {
    flex: 1,
    padding: 16,
    gap: 8,
  },

  description: {
    marginTop: 8,
  },
});
