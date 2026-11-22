import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { HeartOff, Sparkles } from 'lucide-react-native';
import { useState } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme/use-color-scheme';
import { getProfilePictureUrl } from '@/services/chat-service/chatService';
import { ThemedText } from '@/components/themed-text/themed-text';

type Props = {
  name: string;
  city: string;
  investor: boolean;
  profilePictureUrl?: string;
  score: number;
  sharedThemes: string[];
  explanation: string;
  onPress: () => void;
  onUnmatch: () => void;
  isDesktop: boolean;
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
  onUnmatch,
  isDesktop,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [showExplanation, setShowExplanation] = useState(false);
  const [isUnmatchHovered, setIsUnmatchHovered] = useState(false);

  return (
    <View
      style={[
        styles.card,
        showExplanation && styles.cardWithTooltip,
        {
          backgroundColor: colors.tabBarBackgroundColor,
          borderColor: colors.base,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.profileButton,
          { paddingRight: isDesktop ? 92 : 62 },
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
      </Pressable>

      <View style={styles.rightActions}>
        <Pressable
          accessibilityLabel="Unmatch"
          onPress={onUnmatch}
          onHoverIn={() => setIsUnmatchHovered(true)}
          onHoverOut={() => setIsUnmatchHovered(false)}
          style={[
            styles.unmatchButton,
            isDesktop && styles.desktopActionWidth,
            { borderColor: colors.error },
          ]}
        >
          {isDesktop ? (
            <ThemedText
              style={[
                styles.unmatchText,
                { color: colors.error },
                isUnmatchHovered && styles.unmatchTextHovered,
              ]}
            >
              Unmatch
            </ThemedText>
          ) : (
            <HeartOff size={22} color={colors.error} />
          )}
        </Pressable>

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
            style={[
              styles.scoreBadge,
              isDesktop && styles.desktopActionWidth,
              { backgroundColor: colors.base },
            ]}
          >
            <ThemedText style={{ color: colors.background }}>
              {score}%
            </ThemedText>
          </Pressable>
          {showExplanation && Platform.OS === 'web' && (
            <View
              style={[styles.tooltip, { backgroundColor: colors.background }]}
            >
              <ThemedText>{explanation}</ThemedText>
            </View>
          )}
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
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
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreWrapper: {
    position: 'relative',
    zIndex: 101,
    elevation: 21,
  },
  rightActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
    gap: 6,
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
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
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
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 12px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
    }),
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
  unmatchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 42,
    minHeight: 32,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 8,
  },
  unmatchText: {
    fontWeight: '700',
  },
  unmatchTextHovered: {
    textDecorationLine: 'underline',
  },
  desktopActionWidth: {
    width: 78,
  },
});