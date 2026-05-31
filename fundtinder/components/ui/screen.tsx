import { StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import React from 'react';

export function Screen({ children }: { children: React.ReactNode }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 16,
  },
});
