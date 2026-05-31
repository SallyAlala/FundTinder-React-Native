import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ChevronRight } from 'lucide-react-native';

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ThemedView style={styles.collapsibleWrapper}>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <View
          style={{
            transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
          }}
        >
          <ChevronRight size={18} color={Colors.light.icon} />
        </View>

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    paddingLeft: 40,
    paddingTop: 8,
    paddingBottom: 8,
  },
  collapsibleWrapper: {
    paddingBottom: 8,
  },
});
