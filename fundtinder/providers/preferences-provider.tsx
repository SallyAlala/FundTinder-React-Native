import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

import i18n from '@/constants/i18n';

export type ThemePreference = 'system' | 'light' | 'dark';
export type Language = 'hu' | 'en' | 'de';

type PreferencesContextValue = {
  theme: ThemePreference;
  language: Language;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  ready: boolean;
};

const STORAGE_KEY = '@fundtinder/preferences';
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [language, setLanguageState] = useState<Language>(
    i18n.language === 'hu' ? 'hu' : 'en',
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<{
            theme: ThemePreference;
            language: Language;
          }>;
          if (
            parsed.theme === 'system' ||
            parsed.theme === 'light' ||
            parsed.theme === 'dark'
          ) {
            setThemeState(parsed.theme);
          }
          if (
            parsed.language === 'hu' ||
            parsed.language === 'en' ||
            parsed.language === 'de'
          ) {
            setLanguageState(parsed.language);
            await i18n.changeLanguage(parsed.language);
          }
        }
      } finally {
        setReady(true);
      }
    };

    loadPreferences();
  }, []);

  const persist = async (
    nextTheme: ThemePreference,
    nextLanguage: Language,
  ) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: nextTheme, language: nextLanguage }),
    );
  };

  const value = useMemo(
    () => ({
      theme,
      language,
      ready,
      setTheme: async (nextTheme: ThemePreference) => {
        setThemeState(nextTheme);
        await persist(nextTheme, language);
      },
      setLanguage: async (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        await i18n.changeLanguage(nextLanguage);
        await persist(theme, nextLanguage);
      },
    }),
    [language, ready, theme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used inside PreferencesProvider');
  }
  return context;
}

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ColorSchemeName = Appearance.getColorScheme(),
) {
  return preference === 'system' ? (systemTheme ?? 'light') : preference;
}
