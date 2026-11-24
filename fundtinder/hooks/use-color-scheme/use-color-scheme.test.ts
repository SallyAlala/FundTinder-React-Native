import { renderHook, waitFor } from '@testing-library/react-native';
import { useColorScheme } from '@/hooks/use-color-scheme/use-color-scheme';
import { useColorScheme as useWebColorScheme } from './use-color-scheme.web';

jest.mock('@/providers/preferences-provider', () => ({
  resolveTheme: (
    preference: 'system' | 'light' | 'dark',
    systemTheme: 'light' | 'dark' | null,
  ) => (preference === 'system' ? (systemTheme ?? 'light') : preference),
  usePreferences: jest.fn(() => ({ theme: 'system' })),
}));

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const mockedUseColorScheme = jest.fn();

  return new Proxy(actual, {
    get(target, property, receiver) {
      if (property === 'useColorScheme') {
        return mockedUseColorScheme;
      }

      return Reflect.get(target, property, receiver);
    },
  });
});

const mockedUseNativeColorScheme =
  jest.requireMock('react-native')
    .useColorScheme as jest.MockedFunction<
    typeof import('react-native').useColorScheme
  >;

describe('useColorScheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('on native platforms', () => {
    it('should return the native color scheme', () => {
      mockedUseNativeColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() => useColorScheme());

      expect(result.current).toBe('dark');
    });

    it('should preserve a null native scheme', () => {
      mockedUseNativeColorScheme.mockReturnValue(null);

      const { result } = renderHook(() => useColorScheme());

      expect(result.current).toBeNull();
    });
  });

  describe('on web', () => {
    it('should return light before hydration', () => {
      mockedUseNativeColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useWebColorScheme());

      expect(result.current).toBe('light');
    });

    it('should return the native color scheme after hydration', async () => {
      mockedUseNativeColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() => useWebColorScheme());

      await waitFor(() => {
        expect(result.current).toBe('dark');
      });
    });

    it('should fall back to light when the native scheme is null', async () => {
      mockedUseNativeColorScheme.mockReturnValue(null);

      const { result } = renderHook(() => useWebColorScheme());

      await waitFor(() => {
        expect(result.current).toBe('light');
      });
    });
  });
});
