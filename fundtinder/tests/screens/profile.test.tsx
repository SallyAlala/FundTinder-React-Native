import { fireEvent, render, waitFor } from '@testing-library/react-native';
import ProfileTabScreen from '@/app/(tabs)/profile';
import {
  fetchProfileData,
  updateUserProfile,
  uploadProfilePicture,
} from '@/services/user-service/userService';
import { logout } from '@/services/auth-service/authService';

jest.mock('@/services/user-service/userService', () => ({
  fetchProfileData: jest.fn(),
  updateUserProfile: jest.fn(),
  uploadProfilePicture: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/services/auth-service/authService', () => ({
  logout: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: { uid: 'user-123' } },
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: () => false,
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/parallax-scroll-view/parallax-scroll-view', () => ({
  __esModule: true,
  default: ({
    children,
    headerImage,
  }: {
    children: React.ReactNode;
    headerImage: React.ReactNode;
  }) => (
    <>
      {headerImage}
      {children}
    </>
  ),
}));

jest.mock('lucide-react-native', () => ({
  User: () => null,
  ChevronRight: () => null,
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedFetchProfileData = fetchProfileData as jest.MockedFunction<
  typeof fetchProfileData
>;
const mockedUpdateUserProfile = updateUserProfile as jest.MockedFunction<
  typeof updateUserProfile
>;
const mockedUploadProfilePicture = uploadProfilePicture as jest.MockedFunction<
  typeof uploadProfilePicture
>;
const mockedLogout = logout as jest.MockedFunction<typeof logout>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;
const imagePicker = jest.requireMock('expo-image-picker');

const profile = {
  name: 'Ada Lovelace',
  city: 'London',
  budget: '5000',
  investor: true,
  description: 'Builds useful products.',
  profilePictureUrl: '',
};

describe('Profile screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchProfileData.mockResolvedValue(profile);
  });

  describe('by default', () => {
    it('should show a loading state while the profile is fetched', () => {
      mockedFetchProfileData.mockReturnValue(new Promise(() => {}));

      const { queryByText } = render(<ProfileTabScreen />);

      expect(queryByText('Profile')).toBeNull();
    });

    it('should render the fetched profile', async () => {
      const { getByText } = render(<ProfileTabScreen />);

      await waitFor(() => {
        expect(getByText('Profile')).toBeTruthy();
        expect(getByText('Ada Lovelace')).toBeTruthy();
        expect(getByText('London')).toBeTruthy();
        expect(getByText('Investor')).toBeTruthy();
      });
      expect(mockedFetchProfileData).toHaveBeenCalledWith('user-123');
    });

    it('should show an error toast when the profile cannot be loaded', async () => {
      mockedFetchProfileData.mockRejectedValue(new Error('Load failed'));

      const { getByText } = render(<ProfileTabScreen />);

      await waitFor(() => {
        expect(getByText('Profile')).toBeTruthy();
        expect(toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Error',
          text2: 'An unknown error occurred, please try again later.',
        });
      });
    });
  });

  it('should update image loading state for an existing profile picture', async () => {
    mockedFetchProfileData.mockResolvedValue({
      ...profile,
      profilePictureUrl: 'https://example.com/profile.jpg',
    });
    const { getByText, UNSAFE_getAllByType } = render(<ProfileTabScreen />);

    await waitFor(() => expect(getByText('Ada Lovelace')).toBeTruthy());
    const image = UNSAFE_getAllByType(require('react-native').Image)[0];
    fireEvent(image, 'loadStart');
    fireEvent(image, 'loadEnd');
  });

  describe('when the user edits and cancels', () => {
    it('should return to the profile details without saving', async () => {
      const { getByText, getByDisplayValue } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      expect(getByDisplayValue('Ada Lovelace')).toBeTruthy();
      fireEvent.changeText(getByDisplayValue('Ada Lovelace'), 'Changed name');
      fireEvent.press(getByText('Cancel'));

      expect(getByText('Ada Lovelace')).toBeTruthy();
      expect(mockedUpdateUserProfile).not.toHaveBeenCalled();
    });

    it('should enter edit mode and keep the selected role', async () => {
      const { getByText } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.press(getByText('Mastermind'));

      expect(getByText('Save profile')).toBeTruthy();
      fireEvent.press(getByText('Cancel'));
      expect(getByText('Investor')).toBeTruthy();
    });
  });

  describe('when the user selects a profile image', () => {
    it('should leave the form unchanged when image selection is canceled', async () => {
      imagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
      const { getByText, UNSAFE_getAllByProps } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.press(UNSAFE_getAllByProps({ accessible: true })[0]);

      await waitFor(() =>
        expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          }),
        ),
      );
      expect(mockedUploadProfilePicture).not.toHaveBeenCalled();
    });

    it('should upload a local image before saving the profile', async () => {
      imagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://profile.jpg' }],
      });
      mockedUploadProfilePicture.mockResolvedValue(
        'https://example.com/profile.jpg',
      );
      mockedUpdateUserProfile.mockResolvedValue(undefined);
      const { getByText, UNSAFE_getAllByProps } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.press(UNSAFE_getAllByProps({ accessible: true })[0]);
      await waitFor(() =>
        expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled(),
      );
      fireEvent.press(getByText('Save profile'));

      await waitFor(() => {
        expect(mockedUploadProfilePicture).toHaveBeenCalledWith(
          'user-123',
          'file://profile.jpg',
        );
        expect(mockedUpdateUserProfile).toHaveBeenCalledWith(
          'user-123',
          expect.objectContaining({
            profilePictureUrl: 'https://example.com/profile.jpg',
          }),
        );
      });
    });
  });

  describe('when the user edits fields and saves successfully', () => {
    it('should update the profile and show a success toast', async () => {
      mockedUpdateUserProfile.mockResolvedValue(undefined);
      const { getByText, getByDisplayValue } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.changeText(getByDisplayValue('Ada Lovelace'), 'Grace Hopper');
      fireEvent.changeText(getByDisplayValue('London'), 'New York');
      fireEvent.changeText(getByDisplayValue('5000'), '7500');
      fireEvent.changeText(
        getByDisplayValue('Builds useful products.'),
        'Builds better products.',
      );
      fireEvent.press(getByText('Investor'));
      fireEvent.press(getByText('Save profile'));

      await waitFor(() => {
        expect(mockedUpdateUserProfile).toHaveBeenCalledWith('user-123', {
          ...profile,
          name: 'Grace Hopper',
          city: 'New York',
          budget: '7500',
          description: 'Builds better products.',
          investor: true,
        });
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            text2: 'Profile updated successfully.',
          }),
        );
        expect(getByText('Grace Hopper')).toBeTruthy();
      });
    });
  });

  describe('when saving the profile fails', () => {
    it('should show an error toast', async () => {
      mockedUpdateUserProfile.mockRejectedValue(new Error('Save failed'));
      const { getByText } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.press(getByText('Save profile'));

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text2: 'Failed to update profile.',
          }),
        );
      });
    });

    it('should show an error toast when uploading the profile image fails', async () => {
      imagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'blob:profile-image' }],
      });
      mockedUploadProfilePicture.mockRejectedValue(new Error('Upload failed'));
      const { getByText, UNSAFE_getAllByProps } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Edit profile')).toBeTruthy());

      fireEvent.press(getByText('Edit profile'));
      fireEvent.press(UNSAFE_getAllByProps({ accessible: true })[0]);
      await waitFor(() =>
        expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled(),
      );
      fireEvent.press(getByText('Save profile'));

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text2: 'Failed to update profile.',
          }),
        );
      });
    });
  });

  describe('when the user logs out successfully', () => {
    it('should sign out and navigate to login', async () => {
      mockedLogout.mockResolvedValue(undefined);
      const { getByText } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Logout')).toBeTruthy());

      fireEvent.press(getByText('Logout'));

      await waitFor(() => {
        expect(mockedLogout).toHaveBeenCalled();
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('when the user logs out', () => {
    it('should show an error toast when logout fails', async () => {
      mockedLogout.mockRejectedValue(new Error('Logout failed'));
      const { getByText } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Logout')).toBeTruthy());

      fireEvent.press(getByText('Logout'));

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to sign out.',
        });
      });
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('should ignore a second logout while logout is loading', async () => {
      mockedLogout.mockReturnValue(new Promise(() => {}));
      const { getByText } = render(<ProfileTabScreen />);
      await waitFor(() => expect(getByText('Logout')).toBeTruthy());

      fireEvent.press(getByText('Logout'));
      fireEvent.press(getByText('Logout'));

      expect(mockedLogout).toHaveBeenCalledTimes(1);
      expect(getByText('Logout')).toBeTruthy();
    });
  });
});
