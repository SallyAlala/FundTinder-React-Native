import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import { Colors } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  type?: 'emailAddress' | 'password' | 'numeric';
  required?: boolean;
};

export function TextField({
  label,
  error,
  icon,
  type,
  required = false,
  style,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [isFocused, setIsFocused] = useState(false);
  const [internalError, setInternalError] = useState('');
  const displayError = error || internalError;
  const iconColor = displayError ? colors.error : colors.base;

  const formatNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) return '';

    return Number(digits).toLocaleString('hu-HU');
  };

  const validate = (value: string) => {
    if (required && !value.trim()) {
      return 'This field is required!';
    }

    if (!value.trim()) return '';

    if (type === 'emailAddress') {
      return /\S+@\S+\.\S+/.test(value) ? '' : 'Invalid email address!';
    }

    if (type === 'password') {
      return value.length >= 6 ? '' : 'Min 6 characters are required!';
    }

    return '';
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          { borderColor: colors.inputWrapper },
          isFocused && styles.inputFocused,
          displayError && styles.inputError,
        ]}
      >
        {icon && (
          <View style={styles.icon}>
            {React.cloneElement(icon as React.ReactElement<any>, {
              color: iconColor,
            })}
          </View>
        )}

        <TextInput
          {...props}
          value={
            type === 'numeric'
              ? formatNumber(props.value?.toString() ?? '')
              : props.value?.toString()
          }
          textContentType={type !== 'numeric' ? type : undefined}
          secureTextEntry={type === 'password'}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style, { color: colors.text }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setInternalError(validate(props.value?.toString() ?? ''));
          }}
          onChangeText={(text) => {
            const rawValue =
              type === 'numeric' ? text.replace(/\D/g, '') : text;

            props.onChangeText?.(rawValue);

            if (type) {
              setInternalError(validate(rawValue));
            }
          }}
        />
      </View>
      {displayError && <Text style={styles.error}>{displayError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },

  label: {
    marginBottom: 6,
    fontSize: 16,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  inputFocused: {
    borderWidth: 2,
  },

  inputError: {
    borderWidth: 2,
    borderColor: Colors.light.error,
  },

  icon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 16,
  },

  error: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.error,
  },
});
