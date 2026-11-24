import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';

import ParallaxScrollView from '@/components/parallax-scroll-view/parallax-scroll-view';
import { TextField } from '@/components/ui/text-field/text-field';
import { ThemedText } from '@/components/themed-text/themed-text';
import { ThemedView } from '@/components/themed-view/themed-view';

import { Colors } from '@/constants/theme';

import { useColorScheme } from '@/hooks/use-color-scheme/use-color-scheme';
import { useIsDesktop } from '@/hooks/use-is-desktop/use-is-desktop';

import {
  fetchAvailableCities,
  fetchMyFilters,
  saveMyFilters,
} from '@/services/filter-service/filterService';
import { Button } from '@/components/ui/button/button';
import { router } from 'expo-router';
import { fetchAvailableThemes } from '@/services/user-service/userService';
import { useTranslation } from 'react-i18next';

const filterLabelKeys: Record<string, string> = {
  'Business Growth': 'businessGrowth',
  'Digital Products': 'digitalProducts',
  EdTech: 'edTech',
  'Gen Z': 'genZ',
  'Mental Health': 'mentalHealth',
  Philanthropy: 'philanthropy',
  'Product Development': 'productDevelopment',
  Software: 'software',
  'Strategic Investment': 'strategicInvestment',
  Technology: 'technology',
  'Technology Innovation': 'technologyInnovation',
  'Wellness App': 'wellnessApp',
  Amsterdam: 'amsterdam',
  Budapest: 'budapest',
  Demo: 'demo',
  London: 'london',
  'Washington D.C.': 'washingtonDc',
};

export default function FilterTabScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();
  const getFilterLabel = (group: 'themeLabels' | 'cityLabels', value: string) =>
    t(`filters.${group}.${filterLabelKeys[value] ?? value}`, {
      defaultValue: value,
    });

  const [cities, setCities] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(9999999999);

  const [loading, setLoading] = useState(true);
  const [savingLoading, setSavingLoading] = useState(false);

  const [themes, setThemes] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const availableThemes = await fetchAvailableThemes();
        const availableCities = await fetchAvailableCities();
        const filters = await fetchMyFilters();

        setCities(availableCities);
        setThemes(availableThemes);

        setSelectedThemes(filters.themes ?? []);
        setSelectedCities(filters.cities);
        setMinBudget(filters.minBudget);
        setMaxBudget(filters.maxBudget);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: t('filters.loadFailed'),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [t]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme],
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
  };

  const onSave = async () => {
    if (savingLoading) return;

    setSavingLoading(true);

    try {
      await saveMyFilters({
        themes: selectedThemes,
        cities: selectedCities,
        minBudget,
        maxBudget,
      });

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('filters.saved'),
      });

      router.push('/');
    } catch {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('filters.saveFailed'),
      });
    } finally {
      setSavingLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerImage={
        <View style={styles.lottieWrapper}>
          <LottieView
            source={require('@/assets/lottie/filter.json')}
            autoPlay
            loop
            style={styles.headerImage}
          />
        </View>
      }
      contentStyle={isDesktop ? styles.desktopContentWrapper : undefined}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t('tabs.filters')}</ThemedText>
      </ThemedView>

      {!loading && (
        <>
          <View style={styles.section}>
            <ThemedText type="subtitle">{t('filters.themes')}</ThemedText>

            <View style={styles.cityContainer}>
              {themes.map((theme) => {
                const selected = selectedThemes.includes(theme);

                return (
                  <Pressable
                    key={theme}
                    onPress={() => toggleTheme(theme)}
                    style={[
                      styles.cityChip,
                      selected && styles.selectedCityChip,
                      { borderColor: colors.base },
                    ]}
                  >
                    <ThemedText>
                      {selected ? '✓ ' : ''}
                      {getFilterLabel('themeLabels', theme)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.section}>
            <ThemedText type="subtitle">{t('filters.cities')}</ThemedText>

            <View style={styles.cityContainer}>
              {cities.map((city) => {
                const selected = selectedCities.includes(city);

                return (
                  <Pressable
                    key={city}
                    onPress={() => toggleCity(city)}
                    style={[
                      styles.cityChip,
                      selected && styles.selectedCityChip,
                      { borderColor: colors.base },
                    ]}
                  >
                    <ThemedText>
                      {selected ? '✓ ' : ''}
                      {getFilterLabel('cityLabels', city)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('filters.budget')}</ThemedText>

            <TextField
              type="numeric"
              label={t('filters.minimumBudget')}
              keyboardType="numeric"
              value={minBudget.toString()}
              onChangeText={(text) => setMinBudget(Number(text) || 0)}
            />

            <TextField
              type="numeric"
              label={t('filters.maximumBudget')}
              keyboardType="numeric"
              value={maxBudget.toString()}
              onChangeText={(text) => setMaxBudget(Number(text) || 0)}
            />
          </View>
          <View style={isDesktop && styles.desktopButtonContainer}>
            <Button
              onPress={onSave}
              disabled={savingLoading}
              loading={savingLoading}
              style={isDesktop && styles.saveButtonDesktop}
              title={t('filters.save')}
            ></Button>
            <Button
              type={'secondary'}
              title={t('common.cancel')}
              style={isDesktop && styles.saveButtonDesktop}
              onPress={() => router.push('/')}
            ></Button>
          </View>
        </>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  desktopContentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 64,
  },

  lottieWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerImage: {
    alignSelf: 'center',
    width: 240,
    height: 240,
  },

  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },

  section: {
    marginTop: 8,
    gap: 8,
  },

  cityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  selectedCityChip: {
    borderWidth: 3,
  },

  saveButtonDesktop: {
    width: 180,
  },

  desktopButtonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },

  saveButtonText: {
    fontWeight: '600',
  },
});