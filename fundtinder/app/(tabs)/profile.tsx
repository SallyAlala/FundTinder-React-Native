import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  fetchProfileData,
  Profile,
  updateUserProfile,
  uploadProfilePicture,
} from '@/services/userService';
import { auth } from '@/config/firebase';
import Toast from 'react-native-toast-message';
import { Loading } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImagePicker from 'expo-image-picker';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { logout } from '@/services/authService';
import { router } from 'expo-router';

export default function ProfileTabScreen() {
  const isDesktop = useIsDesktop();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [profile, setProfile] = useState<Profile>({
    name: '',
    city: '',
    budget: '',
    investor: false,
    description: '',
    profilePictureUrl: '',
  });

  const [formData, setFormData] = useState<Profile>({
    name: '',
    city: '',
    budget: '',
    investor: false,
    description: '',
    profilePictureUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [savingLoading, setSavingLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;

        if (!uid) return;

        const data = await fetchProfileData(uid);

        setProfile(data);
        setFormData(data);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'An unknown error occurred, please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData((prev) => ({
        ...prev,
        profilePictureUrl: result.assets[0].uri,
      }));
    }
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSavePress = async () => {
    if (loading) return;
    setSavingLoading(true);
    try {
      const uid = auth.currentUser?.uid;

      if (!uid) return;

      let profilePictureUrl = formData.profilePictureUrl;

      const isLocalImage =
        profilePictureUrl.startsWith('file://') ||
        profilePictureUrl.startsWith('blob:');

      if (isLocalImage) {
        profilePictureUrl = await uploadProfilePicture(uid, profilePictureUrl);
      }

      const updatedProfile = {
        ...formData,
        profilePictureUrl,
      };

      await updateUserProfile(uid, updatedProfile);

      setProfile(updatedProfile);
      setFormData(updatedProfile);

      setIsEditing(false);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update profile.',
      });
    } finally {
      setSavingLoading(false);
    }
  };

  const handleLogoutPress = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to sign out.',
      });
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ParallaxScrollView
      headerImage={
        <View style={styles.headerContainer}>
          <Pressable onPress={isEditing ? pickImage : undefined}>
            {(
              isEditing ? formData.profilePictureUrl : profile.profilePictureUrl
            ) ? (
              <View style={styles.imageContainer}>
                {imageLoading && (
                  <ActivityIndicator
                    size="large"
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <Image
                  source={{
                    uri: isEditing
                      ? formData.profilePictureUrl
                      : profile.profilePictureUrl,
                  }}
                  style={styles.headerImage}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            ) : (
              <User size={200} />
            )}
          </Pressable>
        </View>
      }
      contentStyle={isDesktop ? styles.desktopContentWrapper : undefined}
    >
      <ThemedView
        style={[
          styles.titleContainer,
          isDesktop && styles.desktopTitleContainer,
        ]}
      >
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>

      {isEditing ? (
        <View style={styles.formContainer}>
          <TextField
            label="Name"
            value={formData.name}
            onChangeText={(text: string) =>
              setFormData((prev) => ({
                ...prev,
                name: text,
              }))
            }
          />

          <TextField
            label="Location"
            value={formData.city}
            onChangeText={(text: string) =>
              setFormData((prev) => ({
                ...prev,
                city: text,
              }))
            }
          />

          <TextField
            type="numeric"
            label="Budget"
            keyboardType="numeric"
            value={formData.budget}
            onChangeText={(text: string) =>
              setFormData((prev) => ({
                ...prev,
                budget: text,
              }))
            }
          />

          <View style={styles.roleContainer}>
            <View
              style={[
                styles.roleButtonWrapper,
                formData.investor && { borderColor: colors.base },
              ]}
            >
              <Button
                title="Investor"
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    investor: true,
                  }))
                }
              />
            </View>

            <View
              style={[
                styles.roleButtonWrapper,
                !formData.investor && { borderColor: colors.base },
              ]}
            >
              <Button
                title="Mastermind"
                onPress={() =>
                  setFormData((prev) => ({
                    ...prev,
                    investor: false,
                  }))
                }
              />
            </View>
          </View>

          <TextField
            label="Description"
            multiline
            value={formData.description}
            onChangeText={(text: string) =>
              setFormData((prev) => ({
                ...prev,
                description: text,
              }))
            }
            style={styles.descriptionInput}
          />

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
              onPress={() => setIsEditing(false)}
            />
            <Button
              title="Save profile"
              style={isDesktop ? styles.desktopButton : undefined}
              loading={savingLoading}
              disabled={savingLoading}
              onPress={handleSavePress}
            />
          </View>
        </View>
      ) : (
        <View>
          <Collapsible title="👤 Name">
            <ThemedText>{profile.name}</ThemedText>
          </Collapsible>

          <Collapsible title="📍 Location">
            <ThemedText>{profile.city}</ThemedText>
          </Collapsible>

          <Collapsible title="💰 Budget">
            <ThemedText type="numeric">{profile.budget}</ThemedText>
          </Collapsible>

          <Collapsible title="💡 Role">
            <ThemedText>
              {profile.investor ? 'Investor' : 'Mastermind'}
            </ThemedText>
          </Collapsible>

          <Collapsible title="📝 Description">
            <ThemedText>{profile.description}</ThemedText>
          </Collapsible>

          <View
            style={[
              styles.buttonContainer,
              isDesktop && styles.desktopButtonContainer,
            ]}
          >
            <Button
              title="Edit profile"
              style={isDesktop ? styles.desktopButton : undefined}
              onPress={handleEditPress}
            />
            <Button
              title="Logout"
              type="logout"
              disabled={logoutLoading}
              loading={logoutLoading}
              style={isDesktop ? styles.desktopButton : undefined}
              onPress={handleLogoutPress}
            />
          </View>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },

  desktopContentWrapper: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 64,
  },

  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerImage: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
  },

  imageContainer: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },

  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
  },

  desktopTitleContainer: {
    justifyContent: 'center',
    paddingBottom: 24,
  },

  formContainer: {
    marginTop: 12,
  },

  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  roleButtonWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  descriptionInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  buttonContainer: {
    marginTop: 16,
  },

  desktopButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },

  desktopButton: {
    width: 220,
    alignSelf: 'flex-end',
  },
});
