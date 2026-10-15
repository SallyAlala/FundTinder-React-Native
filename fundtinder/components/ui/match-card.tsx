import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useState } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getProfilePictureUrl } from '@/services/chatService';
import { ThemedText } from '@/components/themed-text';

type Props = {
  name: string;
  city: string;
  investor: boolean;
  profilePictureUrl?: string;
  score: number;
  sharedThemes: string[];
  explanation: string;
  onPress: () => void;
};

export function MatchCard({
  name,
  city,
  investor,
  profilePictureUrl,
  score,
  sharedThemes,
  explanation,
  onPress,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        showExplanation && styles.cardWithTooltip,
        {
          backgroundColor: colors.tabBarBackgroundColor,
          borderColor: colors.base,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Image
        source={{ uri: getProfilePictureUrl(profilePictureUrl, name) }}
        style={styles.image}
      />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <ThemedText type="defaultSemiBold" numberOfLines={1}>
            {name}
          </ThemedText>
          <View style={styles.scoreWrapper}>
            <Pressable
              onPress={() => setShowExplanation((visible) => !visible)}
              onHoverIn={() => {
                if (Platform.OS === 'web') {
                  setShowExplanation(true);
                }
              }}
              onHoverOut={() => {
                if (Platform.OS === 'web') {
                  setShowExplanation(false);
                }
              }}
              style={[styles.scoreBadge, { backgroundColor: colors.base }]}
            >
              <ThemedText style={{ color: colors.background }}>
                {score}%
              </ThemedText>
            </Pressable>
            {showExplanation && Platform.OS === 'web' && (
              <View
                style={[
                  styles.tooltip,
                  { backgroundColor: colors.background },
                ]}
              >
                <ThemedText>{explanation}</ThemedText>
              </View>
            )}
          </View>
        </View>
        <ThemedText>
          {investor ? 'Investor' : 'Founder'} · {city}
        </ThemedText>
        <View style={styles.matchLabel}>
          <Sparkles size={15} color={colors.base} />
          <ThemedText style={{ color: colors.base }}>
            Lili AI match
          </ThemedText>
        </View>
        {sharedThemes.length > 0 && (
          <ThemedText numberOfLines={1} style={styles.themes}>
            Shared: {sharedThemes.join(', ')}
          </ThemedText>
        )}
      </View>

      {Platform.OS !== 'web' && (
        <Modal
          transparent
          animationType="fade"
          visible={showExplanation}
          onRequestClose={() => setShowExplanation(false)}
        >
          <View style={styles.dialogOverlay}>
            <View
              style={[
                styles.dialog,
                { backgroundColor: colors.background },
              ]}
            >
              <ThemedText type="subtitle">Lili AI match</ThemedText>
              <ThemedText>{explanation}</ThemedText>
              <Pressable
                onPress={() => setShowExplanation(false)}
                style={[
                  styles.dialogButton,
                  { backgroundColor: colors.base },
                ]}
              >
                <ThemedText style={{ color: colors.background }}>
                  OK
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    overflow: 'visible',
  },
  cardWithTooltip: {
    zIndex: 100,
    elevation: 20,
    minHeight: 120,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scoreWrapper: {
    position: 'relative',
    zIndex: 101,
    elevation: 21,
  },
  tooltip: {
    position: 'absolute',
    right: 0,
    top: 34,
    width: 360,
    minHeight: 64,
    zIndex: 102,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 18,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogButton: {
    alignSelf: 'flex-end',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  matchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  themes: {
    opacity: 0.75,
    fontSize: 12,
  },
});
