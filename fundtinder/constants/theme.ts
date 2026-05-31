/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    base: '#2FA4E7',
    placeholder: '#999',
    tint: tintColorLight,
    icon: '#687076',
    tabBarBackgroundColor: 'rgba(238,245,253,0.93)',
    tabIconSelected: tintColorLight,
    inputWrapper: '#2FA4E7',
    error: '#ff4d4f',
  },
  dark: {
    text: '#ECEDEE',
    background: '#22262B',
    base: '#4FC3F7',
    placeholder: '#888',
    tint: tintColorDark,
    tabBarBackgroundColor: '#3c3e40',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    inputWrapper: '#4FC3F7',
    error: '#ff4d4f',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    pacifico: 'Pacifico_400Regular',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
