import { renderHook } from '@testing-library/react-native';
import { useIsDesktop } from '@/hooks/use-is-desktop/use-is-desktop';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const mockedUseWindowDimensions = jest.fn();

  return new Proxy(actual, {
    get(target, property, receiver) {
      if (property === 'useWindowDimensions') {
        return mockedUseWindowDimensions;
      }

      return Reflect.get(target, property, receiver);
    },
  });
});

const mockedUseWindowDimensions =
  jest.requireMock('react-native')
    .useWindowDimensions as jest.MockedFunction<
    typeof import('react-native').useWindowDimensions
  >;

describe('useIsDesktop', () => {
  describe('when the window is narrower than the desktop breakpoint', () => {
    it('should return false', () => {
      mockedUseWindowDimensions.mockReturnValue({
        width: 1023,
        height: 800,
        scale: 1,
        fontScale: 1,
      });

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });
  });

  describe('when the window reaches the desktop breakpoint', () => {
    it('should return true', () => {
      mockedUseWindowDimensions.mockReturnValue({
        width: 1024,
        height: 800,
        scale: 1,
        fontScale: 1,
      });

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
    });
  });
});
