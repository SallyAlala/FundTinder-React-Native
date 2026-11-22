import type { PropsWithChildren, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view/themed-view';
import { PARALLAX_HEADER_HEIGHT } from '@/constants/layout';
import { useColorScheme } from '@/hooks/use-color-scheme/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color/use-theme-color';

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  contentStyle,
}: Props) {
  const backgroundColor = useThemeColor({}, 'background');
  const headerBackgroundColor =
    useColorScheme() === 'light' ? '#A1CEDC' : '#1D3D47';

  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const scrollOffset = useScrollOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-PARALLAX_HEADER_HEIGHT, 0, PARALLAX_HEADER_HEIGHT],
            [
              -PARALLAX_HEADER_HEIGHT / 2,
              0,
              PARALLAX_HEADER_HEIGHT * 0.75,
            ],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-PARALLAX_HEADER_HEIGHT, 0, PARALLAX_HEADER_HEIGHT],
            [2, 1, 1],
          ),
        },
      ],
    };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{
        backgroundColor,
        flex: 1,
      }}
      scrollEventThrottle={16}
    >
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: headerBackgroundColor,
          },
          headerAnimatedStyle,
        ]}
      >
        {headerImage}
      </Animated.View>

      <ThemedView style={styles.content}>
        <View style={contentStyle}>{children}</View>
      </ThemedView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: PARALLAX_HEADER_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'visible',
  },
});
