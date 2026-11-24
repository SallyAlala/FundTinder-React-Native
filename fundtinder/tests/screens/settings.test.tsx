import { fireEvent, render } from '@testing-library/react-native';
import SettingsTabScreen from '@/app/(tabs)/settings';
import { usePreferences } from '@/providers/preferences-provider';

jest.mock('@/providers/preferences-provider', () => ({
  usePreferences: jest.fn(),
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock(
  '@/components/parallax-scroll-view/parallax-scroll-view',
  () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => children,
  }),
);

jest.mock('lucide-react-native', () => ({
  Moon: () => null,
  Sun: () => null,
  Smartphone: () => null,
}));

const mockedUsePreferences = usePreferences as jest.MockedFunction<
  typeof usePreferences
>;

describe('Settings screen', () => {
  const setLanguage = jest.fn();
  const setTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsePreferences.mockReturnValue({
      theme: 'system',
      language: 'en',
      ready: true,
      setLanguage,
      setTheme,
    });
  });

  it('renders the language and theme options', () => {
    const { getByText } = render(<SettingsTabScreen />);

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Language')).toBeTruthy();
    expect(getByText('Hungarian')).toBeTruthy();
    expect(getByText('English')).toBeTruthy();
    expect(getByText('German')).toBeTruthy();
    expect(getByText('Theme')).toBeTruthy();
    expect(getByText('System')).toBeTruthy();
    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
  });

  it('changes the selected language', () => {
    const { getByText } = render(<SettingsTabScreen />);

    fireEvent.press(getByText('German'));

    expect(setLanguage).toHaveBeenCalledWith('de');
  });

  it('changes the selected theme', () => {
    const { getByText } = render(<SettingsTabScreen />);

    fireEvent.press(getByText('Dark'));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });
});
