import { StyleSheet, View } from 'react-native';
import { TextField } from '@/components/ui/text-field';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import { Lock, Mail } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import LottieView from 'lottie-react-native';
import { Screen } from '@/components/ui/screen';
import { login } from '@/services/authService';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const isDesktop = useIsDesktop();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onLoginButtonClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Incorrect email or password!',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unknown error occurred, please try again later!',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (isDesktop) {
    return (
      <Screen>
        <View style={styles.desktopContainer}>
          <View style={styles.desktopLeft}>
            <ThemedText
              type="title"
              lightColor={Colors.light.base}
              darkColor={Colors.dark.base}
              style={styles.desktopLogo}
            >
              FundTinder
            </ThemedText>

            <ThemedText
              type="subtitle"
              style={{
                fontFamily: Fonts.rounded,
                marginBottom: 24,
              }}
            >
              Connect founders with investors.
            </ThemedText>

            <ThemedText style={styles.desktopDescription}>
              FundTinder helps entrepreneurs find the right investors and
              investors discover promising startup ideas.
            </ThemedText>

            <ThemedText style={styles.desktopBullet}>
              🚀 Discover startup opportunities
            </ThemedText>

            <ThemedText style={styles.desktopBullet}>
              💰 Find investors and funding
            </ThemedText>

            <ThemedText style={styles.desktopBullet}>
              🤝 Build valuable business connections
            </ThemedText>
          </View>

          <View
            style={[
              styles.loginCard,
              { backgroundColor: colors.tabBarBackgroundColor },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={{
                fontFamily: Fonts.rounded,
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              Login or Sign up
            </ThemedText>

            <TextField
              required
              type="emailAddress"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={18} />}
            />

            <TextField
              required
              type="password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={18} />}
            />

            <View style={styles.desktopButtonContainer}>
              <Button
                title="Login"
                loading={loading}
                disabled={loading}
                onPress={onLoginButtonClick}
                style={styles.desktopButton}
              />

              <Button
                title="Sign Up"
                type="secondary"
                onPress={() => router.navigate('/sign-up')}
                style={styles.desktopButton}
              />
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.pageStyle, isDesktop && styles.desktopPageStyle]}>
        <View>
          <ThemedText
            type="title"
            lightColor={Colors.light.base}
            darkColor={Colors.dark.base}
            style={{
              fontFamily: Fonts.pacifico,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            FundTinder
          </ThemedText>

          <ThemedText
            type="subtitle"
            lightColor={Colors.light.text}
            darkColor={Colors.dark.text}
            style={{
              fontFamily: Fonts.rounded,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            Login or Sign up
          </ThemedText>

          <TextField
            required
            type="emailAddress"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            icon={<Mail size={18} />}
          />
          <TextField
            required
            type="password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            icon={<Lock size={18} />}
          />
        </View>

        <View>
          {!isDesktop && (
            <LottieView
              source={require('@/assets/lottie/hi.json')}
              autoPlay
              loop
              style={styles.hiLottie}
            />
          )}
          <View
            style={[
              styles.buttonContainer,
              isDesktop && styles.desktopButtonContainer,
            ]}
          >
            <Button
              title="Login"
              loading={loading}
              disabled={loading}
              onPress={onLoginButtonClick}
              style={isDesktop ? styles.desktopButton : undefined}
            />

            <Button
              title="Sign Up"
              type="secondary"
              onPress={() => router.navigate('/sign-up')}
              style={isDesktop ? styles.desktopButton : undefined}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 80,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  desktopLeft: {
    flex: 1,
  },

  desktopLogo: {
    fontFamily: Fonts.pacifico,
    marginBottom: 24,
  },

  desktopDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },

  desktopBullet: {
    marginBottom: 12,
    fontSize: 16,
  },

  loginCard: {
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  pageStyle: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },

  desktopPageStyle: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'flex-start',
  },

  desktopButtonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: 12,
  },

  desktopButton: {
    width: 180,
  },

  hiLottie: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    marginBottom: -40,
  },

  buttonContainer: {
    marginTop: 16,
  },
});
