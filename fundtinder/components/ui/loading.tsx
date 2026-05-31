import { ActivityIndicator, StyleSheet, View } from 'react-native';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

type Props = {
  size?: 'small' | 'large';
};

export function Loading({ size = 'large' }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.base} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
