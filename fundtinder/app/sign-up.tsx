import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { TextField } from '@/components/ui/text-field';
import React, { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts } from '@/constants/theme';
import {
  ImageIcon,
  LocateIcon,
  Lock,
  Mail,
  NotebookIcon,
  PersonStandingIcon,
  WalletIcon,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { signUp } from '@/services/authService';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import ScrollView = Animated.ScrollView;

export default function SignUpScreen() {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const onSignUpButtonClick = async () => {
    if (loading) return;

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !budget.trim() ||
      !location.trim() ||
      !description.trim()
    ) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please fill out all required fields.',
      });

      return;
    }

    setLoading(true);

    try {
      await signUp({
        email,
        password,
        name,
        location,
        budget,
        description,
        isInvestor,
        profilePictureUrl: profilePicture,
      });

      router.replace('/(tabs)');
    } catch (error: any) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unknown error occurred, please try again later!',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
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
              Sign up
            </ThemedText>

            <View style={styles.profilePictureContainer}>
              <Pressable onPress={pickImage}>
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <View style={styles.profilePicturePlaceholder}>
                    <ImageIcon size={32} color={colors.text} />
                    <ThemedText
                      style={{
                        textAlign: 'center',
                        width: 80,
                      }}
                    >
                      Add profile picture
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>

            <TextField
              required
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              icon={<PersonStandingIcon size={18} />}
            />
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
            <TextField
              required
              placeholder="City of residence"
              value={location}
              onChangeText={setLocation}
              icon={<LocateIcon size={18} />}
            />
            <TextField
              required
              placeholder="Enter the budget needed/invested"
              value={budget}
              onChangeText={setBudget}
              icon={<WalletIcon size={18} />}
            />
            <TextField
              required
              placeholder="Enter description of your requirements"
              value={description}
              onChangeText={setDescription}
              icon={<NotebookIcon size={18} />}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Switch value={isInvestor} onValueChange={setIsInvestor} />
              <ThemedText style={styles.toggleTextStyle}>
                I am signing up as an investor
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.buttonContainer,
              isDesktop && styles.desktopButtonContainer,
            ]}
          >
            <Button
              title="Cancel"
              type="secondary"
              style={isDesktop ? styles.desktopButton : undefined}
              onPress={() => {
                router.replace('/login');
              }}
            />
            <Button
              title={'Sign Up'}
              loading={loading}
              disabled={loading}
              style={isDesktop ? styles.desktopButton : undefined}
              onPress={() => onSignUpButtonClick()}
            />
          </View>
        </View>
      </Screen>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#999',

    gap: 8,
  },

  buttonContainer: {
    marginTop: 16,
  },

  desktopButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },

  desktopButton: {
    width: 180,
  },

  toggleTextStyle: {
    paddingLeft: 8,
  },
});
