import { Pressable, StyleSheet, View } from 'react-native';
import { Moon, Sun, Smartphone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import ParallaxScrollView from '@/components/parallax-scroll-view/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text/themed-text';
import { ThemedView } from '@/components/themed-view/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme/use-color-scheme';
import {
  Language,
  ThemePreference,
  usePreferences,
} from '@/providers/preferences-provider';

const languageOptions: Language[] = ['hu', 'en', 'de'];
const themeOptions: ThemePreference[] = ['system', 'light', 'dark'];

export default function SettingsTabScreen() {
  const { t } = useTranslation();
  const { theme, language, setTheme, setLanguage } = usePreferences();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const themeLabels = {
    system: t('settings.system'),
    light: t('settings.light'),
    dark: t('settings.dark'),
  };
  const languageLabels = {
    hu: t('settings.hungarian'),
    en: t('settings.english'),
    de: t('settings.german'),
  };

  return (
    <ParallaxScrollView
      contentStyle={styles.content}
      headerImage={<View style={styles.header} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t('tabs.settings')}</ThemedText>
      </ThemedView>
      <ThemedText type="subtitle">{t('settings.language')}</ThemedText>
      <View style={styles.options}>
        {languageOptions.map((option) => (
          <Option
            key={option}
            label={languageLabels[option]}
            selected={language === option}
            color={colors.base}
            onPress={() => setLanguage(option)}
          />
        ))}
      </View>
      <ThemedText type="subtitle">{t('settings.theme')}</ThemedText>
      <View style={styles.options}>
        {themeOptions.map((option) => (
          <Option
            key={option}
            label={themeLabels[option]}
            selected={theme === option}
            color={colors.base}
            onPress={() => setTheme(option)}
            icon={
              option === 'system' ? (
                <Smartphone size={18} color={colors.text} />
              ) : option === 'light' ? (
                <Sun size={18} color={colors.text} />
              ) : (
                <Moon size={18} color={colors.text} />
              )
            }
          />
        ))}
      </View>
    </ParallaxScrollView>
  );
}

function Option({
  label,
  selected,
  color,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: color },
        selected && { backgroundColor: color },
      ]}
    >
      {icon}
      <ThemedText style={selected ? { color: '#fff' } : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  header: {
    height: 80,
  },
  titleContainer: {
    paddingBottom: 32,
  },
  options: {
    gap: 12,
    marginTop: 12,
    marginBottom: 32,
  },
  option: {
    minHeight: 52,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
