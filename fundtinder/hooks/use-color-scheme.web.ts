import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { resolveTheme, usePreferences } from '@/providers/preferences-provider';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();
  const { theme } = usePreferences();

  if (hasHydrated) {
    return resolveTheme(theme, colorScheme);
  }

  return resolveTheme(theme, 'light');
}
