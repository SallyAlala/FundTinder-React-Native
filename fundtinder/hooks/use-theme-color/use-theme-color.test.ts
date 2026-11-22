import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color/use-theme-color';

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

const mockedUseColorScheme =
  jest.requireMock('@/hooks/use-color-scheme/use-color-scheme')
    .useColorScheme as jest.Mock;

describe('useThemeColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when a color is provided for the active theme', () => {
    it('should return the provided color', () => {
      mockedUseColorScheme.mockReturnValue('dark');

      const { result } = renderHook(() =>
        useThemeColor({ dark: '#ffffff' }, 'text'),
      );

      expect(result.current).toBe('#ffffff');
    });
  });

  describe('when no color override is provided', () => {
    it('should return the configured light theme color', () => {
      mockedUseColorScheme.mockReturnValue('light');

      const { result } = renderHook(() => useThemeColor({}, 'text'));

      expect(result.current).toBe('#11181C');
    });

    it('should fall back to light when the scheme is null', () => {
      mockedUseColorScheme.mockReturnValue(null);

      const { result } = renderHook(() => useThemeColor({}, 'text'));

      expect(result.current).toBe('#11181C');
    });
  });
});
