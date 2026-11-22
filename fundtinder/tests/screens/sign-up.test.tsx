import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import SignUpScreen from '@/app/sign-up';
import { signUp } from '@/services/auth-service/authService';

jest.mock('@/services/auth-service/authService', () => ({
  signUp: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: jest.fn(() => false),
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('lucide-react-native', () => ({
  ImageIcon: 'ImageIcon',
  LocateIcon: 'LocateIcon',
  Lock: 'Lock',
  Mail: 'Mail',
  NotebookIcon: 'NotebookIcon',
  PersonStandingIcon: 'PersonStandingIcon',
  WalletIcon: 'WalletIcon',
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedSignUp = signUp as jest.MockedFunction<typeof signUp>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;
const imagePicker = jest.requireMock('expo-image-picker');
const mockedUseIsDesktop = jest.requireMock(
  '@/hooks/use-is-desktop/use-is-desktop',
).useIsDesktop as jest.Mock;
const mockedUseColorScheme = jest.requireMock(
  '@/hooks/use-color-scheme/use-color-scheme',
).useColorScheme as jest.Mock;

describe('SignUp screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseIsDesktop.mockReturnValue(false);
    mockedUseColorScheme.mockReturnValue('light');
  });

  it('should render the desktop dark-mode layout', () => {
    mockedUseIsDesktop.mockReturnValue(true);
    mockedUseColorScheme.mockReturnValue('dark');

    const { getByText } = render(<SignUpScreen />);

    expect(getByText('Sign up')).toBeTruthy();
    expect(getByText('Add profile picture')).toBeTruthy();
  });

  describe('by default', () => {
    it('should render all required fields and actions', () => {
      const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

      expect(getByPlaceholderText('Enter your name')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByPlaceholderText('City of residence')).toBeTruthy();
      expect(getByPlaceholderText('Enter the budget needed/invested')).toBeTruthy();
      expect(
        getByPlaceholderText('Enter description of your requirements'),
      ).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });
  });

  describe('when the user clicks Sign Up with empty fields', () => {
    it('should show a missing information toast and not call the service', () => {
      const { getByText } = render(<SignUpScreen />);

      fireEvent.press(getByText('Sign Up'));

      expect(mockedSignUp).not.toHaveBeenCalled();
      expect(toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text1: 'Missing information',
        }),
      );
    });
  });

  describe('when the user submits fields containing only whitespace', () => {
    it('should show validation feedback and not call the service', () => {
      const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your name'), '  ');
      fireEvent.press(getByText('Sign Up'));

      expect(mockedSignUp).not.toHaveBeenCalled();
      expect(toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          text2: 'Please fill out all required fields.',
        }),
      );
    });
  });

  describe('when the user submits a complete form', () => {
    it('should sign up and navigate to the tabs screen', async () => {
      mockedSignUp.mockResolvedValue({} as Awaited<ReturnType<typeof signUp>>);
      const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Person');
      fireEvent.changeText(
        getByPlaceholderText('Enter your email'),
        'person@example.com',
      );
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'secret');
      fireEvent.changeText(getByPlaceholderText('City of residence'), 'Pecs');
      fireEvent.changeText(
        getByPlaceholderText('Enter the budget needed/invested'),
        '1000',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter description of your requirements'),
        'Looking for funding',
      );
      fireEvent.press(getByText('Sign Up'));

      await waitFor(() => {
        expect(mockedSignUp).toHaveBeenCalledWith({
          email: 'person@example.com',
          password: 'secret',
          name: 'Person',
          location: 'Pecs',
          budget: '1000',
          description: 'Looking for funding',
          isInvestor: false,
          profilePictureUrl: '',
        });
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('when sign up is still loading', () => {
    it('should ignore repeated clicks until the service resolves', async () => {
      let resolveSignUp!: (
        value: Awaited<ReturnType<typeof signUp>>,
      ) => void;
      mockedSignUp.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSignUp = resolve;
          }) as ReturnType<typeof signUp>,
      );
      const {
        getByPlaceholderText,
        getByText,
        UNSAFE_getByType,
        UNSAFE_queryByType,
      } =
        render(<SignUpScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Person');
      fireEvent.changeText(
        getByPlaceholderText('Enter your email'),
        'person@example.com',
      );
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'secret');
      fireEvent.changeText(getByPlaceholderText('City of residence'), 'Pecs');
      fireEvent.changeText(
        getByPlaceholderText('Enter the budget needed/invested'),
        '1000',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter description of your requirements'),
        'Looking for funding',
      );

      fireEvent.press(getByText('Sign Up'));
      fireEvent.press(getByText('Sign Up'));

      expect(mockedSignUp).toHaveBeenCalledTimes(1);
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      await act(async () => {
        resolveSignUp({} as Awaited<ReturnType<typeof signUp>>);
      });
      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
      });
    });
  });

  describe('when sign up fails', () => {
    it('should show the generic error toast', async () => {
      mockedSignUp.mockRejectedValue(new Error('Network unavailable'));
      const { getByPlaceholderText, getByText } = render(<SignUpScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your name'), 'Person');
      fireEvent.changeText(
        getByPlaceholderText('Enter your email'),
        'person@example.com',
      );
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'secret');
      fireEvent.changeText(getByPlaceholderText('City of residence'), 'Pecs');
      fireEvent.changeText(
        getByPlaceholderText('Enter the budget needed/invested'),
        '1000',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter description of your requirements'),
        'Looking for funding',
      );
      fireEvent.press(getByText('Sign Up'));

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text2: 'An unknown error occurred, please try again later!',
          }),
        );
      });
    });
  });

  describe('when the user selects a profile picture', () => {
    it('should use the selected image uri', async () => {
      imagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///profile-picture.png' }],
      });
      const { getByText, queryByText } = render(<SignUpScreen />);

      fireEvent.press(getByText('Add profile picture'));

      await waitFor(() => {
        expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(queryByText('Add profile picture')).toBeNull();
      });
    });
  });

  describe('when the user cancels profile picture selection', () => {
    it('should keep the profile picture placeholder', async () => {
      imagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
        assets: [],
      });
      const { getByText } = render(<SignUpScreen />);

      fireEvent.press(getByText('Add profile picture'));

      await waitFor(() => {
        expect(imagePicker.launchImageLibraryAsync).toHaveBeenCalled();
        expect(getByText('Add profile picture')).toBeTruthy();
      });
    });
  });

  describe('when the user clicks Cancel', () => {
    it('should navigate back to the login screen', () => {
      const { getByText } = render(<SignUpScreen />);

      fireEvent.press(getByText('Cancel'));

      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });
});
