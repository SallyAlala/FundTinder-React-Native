import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

type Props = {
  title: string;
  type?: 'primary' | 'secondary' | 'logout';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  type = 'primary',
  onPress,
  disabled,
  loading,
  icon,
  style,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = isDark ? Colors.dark : Colors.light;
  const isPrimary = type === 'primary';
  const isLogout = type === 'logout';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        style,
        {
          backgroundColor: isPrimary
            ? colors.base
            : isLogout
              ? colors.error
              : 'transparent',
          borderColor: isPrimary || isLogout ? 'transparent' : colors.base,
          borderWidth: isPrimary ? 0 : 2,
          opacity: pressed ? 0.8 : 1,
        },
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <View style={styles.inlineLoader}>
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
            {title}
          </ThemedText>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}

          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  icon: {
    marginRight: 4,
  },

  disabled: {
    opacity: 0.5,
  },

  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
