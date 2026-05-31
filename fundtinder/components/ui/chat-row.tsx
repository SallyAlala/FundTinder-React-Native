import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { getProfilePictureUrl } from '@/services/chatService';

type Props = {
  name: string;
  imageUrl?: string;
  hasUnread?: boolean;
  onPress?: () => void;
};

export function ChatRow({ name, imageUrl, hasUnread = false, onPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.tabBarBackgroundColor,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri: getProfilePictureUrl(imageUrl, name),
          }}
          style={styles.image}
        />

        {hasUnread && <View style={styles.badge} />}
      </View>

      <View style={styles.content}>
        <ThemedText type="defaultSemiBold">{name}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },

  imageWrapper: {
    position: 'relative',
    overflow: 'visible',
  },

  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    zIndex: 999,
    elevation: 10,
  },

  content: {
    marginLeft: 12,
    flex: 1,
  },
});
