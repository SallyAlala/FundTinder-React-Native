import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'numeric';
};

const formatNumber = (value: string | number) => {
  const digits = value.toString().replace(/\D/g, '');

  if (!digits) {
    return value;
  }

  return Number(digits).toLocaleString('hu-HU') + ' $';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'numeric' ? styles.numeric : undefined,
        style,
      ]}
      {...rest}
    >
      {type === 'numeric'
        ? formatNumber(rest.children?.toString() ?? '')
        : rest.children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },

  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },

  title: {
    fontSize: 38,
    lineHeight: 40,
  },

  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },

  numeric: {
    fontSize: 16,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
});
