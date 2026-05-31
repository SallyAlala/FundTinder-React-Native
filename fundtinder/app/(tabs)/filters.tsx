import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { TextField } from '@/components/ui/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { Colors } from '@/constants/theme';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsDesktop } from '@/hooks/use-is-desktop';

import {
  fetchAvailableCities,
  fetchMyFilters,
  saveMyFilters,
} from '@/services/filterService';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { fetchAvailableThemes } from '@/services/userService';

export default function FilterTabScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const isDesktop = useIsDesktop();

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
          text1: 'Error',
          text2: 'Failed to load filters.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
        text1: 'Success',
        text2: 'Filters saved successfully.',
      });

      router.push('/');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save filters.',
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
        <ThemedText type="title">Filters</ThemedText>
      </ThemedView>

      {!loading && (
        <>
          <View style={styles.section}>
            <ThemedText type="subtitle">Themes</ThemedText>

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
                      {theme}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.section}>
            <ThemedText type="subtitle">Cities</ThemedText>

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
                      {city}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle">Budget</ThemedText>

            <TextField
              type="numeric"
              label="Minimum Budget"
              keyboardType="numeric"
              value={minBudget}
              onChangeText={setMinBudget}
            />

            <TextField
              type="numeric"
              label="Maximum Budget"
              keyboardType="numeric"
              value={maxBudget}
              onChangeText={setMaxBudget}
            />
          </View>
          <View style={isDesktop && styles.desktopButtonContainer}>
            <Button
              onPress={onSave}
              disabled={savingLoading}
              loading={savingLoading}
              style={isDesktop && styles.saveButtonDesktop}
              title={'Save Filters'}
            ></Button>
            <Button
              type={'secondary'}
              title={'Cancel'}
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
