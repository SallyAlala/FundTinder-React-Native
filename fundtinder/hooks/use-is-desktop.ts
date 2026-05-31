import { useWindowDimensions } from 'react-native';

export function useIsDesktop() {
  const { width } = useWindowDimensions();

  return width >= 1024;
}
