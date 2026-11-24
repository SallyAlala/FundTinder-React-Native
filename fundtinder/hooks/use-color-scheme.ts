import { useColorScheme as useNativeColorScheme } from 'react-native';

import { resolveTheme, usePreferences } from '@/providers/preferences-provider';

export function useColorScheme() {
  const systemTheme = useNativeColorScheme();
  const { theme } = usePreferences();
  return resolveTheme(theme, systemTheme);
}
