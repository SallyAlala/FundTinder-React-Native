import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import LoginScreen from '@/app/login';
import { login } from '@/services/auth-service/authService';

jest.mock('@/services/auth-service/authService', () => ({
  login: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    navigate: jest.fn(),
  },
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: jest.fn(() => false),
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('lucide-react-native', () => ({
  Lock: 'Lock',
  Mail: 'Mail',
}));
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedLogin = login as jest.MockedFunction<typeof login>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;
const mockedUseIsDesktop = jest.requireMock(
  '@/hooks/use-is-desktop/use-is-desktop',
).useIsDesktop as jest.Mock;

describe('Login screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('by default', () => {
    it('should render the email, password and login controls', () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });
  });

  describe('when the user enters invalid credentials', () => {
    it('should show validation messages for the email and password fields', () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);
      const email = getByPlaceholderText('Enter your email');
      const password = getByPlaceholderText('Enter your password');

      fireEvent.changeText(email, 'not-an-email');
      fireEvent(email, 'blur');
      fireEvent.changeText(password, 'short');
      fireEvent(password, 'blur');

      expect(getByText('Invalid email address!')).toBeTruthy();
      expect(getByText('Min 6 characters are required!')).toBeTruthy();
    });
  });

  describe('when the user clicks the login button with valid credentials', () => {
    it('should call login and navigate to the tabs screen', async () => {
      mockedLogin.mockResolvedValue({} as Awaited<ReturnType<typeof login>>);
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(
        getByPlaceholderText('Enter your email'),
        'person@example.com',
      );
      fireEvent.changeText(
        getByPlaceholderText('Enter your password'),
        'secret',
      );
      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockedLogin).toHaveBeenCalledWith(
          'person@example.com',
          'secret',
        );
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });
  });

  describe('when login is still loading', () => {
    it('should ignore repeated clicks until the service resolves', async () => {
      let resolveLogin!: (
        value: Awaited<ReturnType<typeof login>>,
      ) => void;
      mockedLogin.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          }) as ReturnType<typeof login>,
      );
      const { getByText, UNSAFE_getByType, UNSAFE_queryByType } = render(
        <LoginScreen />,
      );

      fireEvent.press(getByText('Login'));
      fireEvent.press(getByText('Login'));

      expect(mockedLogin).toHaveBeenCalledTimes(1);
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

      await act(async () => {
        resolveLogin({} as Awaited<ReturnType<typeof login>>);
      });
      await waitFor(() => {
        expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
      });
    });
  });

  describe('when login fails with invalid credentials', () => {
    it('should show an error toast', async () => {
      mockedLogin.mockRejectedValue({ code: 'auth/invalid-credential' });
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            text2: 'Incorrect email or password!',
          }),
        );
      });
    });
  });

  describe('when login fails for an unexpected reason', () => {
      it('should show the generic error toast', async () => {
        mockedLogin.mockRejectedValue(new Error('Network unavailable'));
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText('Login'));

        await waitFor(() => {
          expect(toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
              text2: 'An unknown error occurred, please try again later!',
            }),
          );
        });
      });
    });

  describe('when the user opens the sign-up screen', () => {
      it('should navigate to sign up', () => {
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText('Sign Up'));

        expect(router.navigate).toHaveBeenCalledWith('/sign-up');
      });
    });

  describe('when the screen is rendered on desktop', () => {
      it('should show the desktop introduction and login card', () => {
        mockedUseIsDesktop.mockReturnValue(true);

        const { getByText } = render(<LoginScreen />);

        expect(getByText('Connect founders with investors.')).toBeTruthy();
        expect(
          getByText('🚀 Discover startup opportunities'),
        ).toBeTruthy();

        fireEvent.press(getByText('Sign Up'));
        expect(router.navigate).toHaveBeenCalledWith('/sign-up');

        mockedUseIsDesktop.mockReturnValue(false);
    });
  });
});
