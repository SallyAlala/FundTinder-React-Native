import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import FilterTabScreen from '@/app/(tabs)/filters';
import {
  fetchAvailableCities,
  fetchMyFilters,
  saveMyFilters,
} from '@/services/filter-service/filterService';
import { fetchAvailableThemes } from '@/services/user-service/userService';

jest.mock('@/services/filter-service/filterService', () => ({
  fetchAvailableCities: jest.fn(),
  fetchMyFilters: jest.fn(),
  saveMyFilters: jest.fn(),
}));

jest.mock('@/services/user-service/userService', () => ({
  fetchAvailableThemes: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: () => false,
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));

const mockedFetchAvailableCities =
  fetchAvailableCities as jest.MockedFunction<typeof fetchAvailableCities>;
const mockedFetchAvailableThemes =
  fetchAvailableThemes as jest.MockedFunction<typeof fetchAvailableThemes>;
const mockedFetchMyFilters =
  fetchMyFilters as jest.MockedFunction<typeof fetchMyFilters>;
const mockedSaveMyFilters =
  saveMyFilters as jest.MockedFunction<typeof saveMyFilters>;
const router = jest.requireMock('expo-router').router;
const toast = jest.requireMock('react-native-toast-message').default;

describe('Filters screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetchAvailableThemes.mockResolvedValue(['Technology', 'Education']);
    mockedFetchAvailableCities.mockResolvedValue(['Budapest', 'Pecs']);
    mockedFetchMyFilters.mockResolvedValue({
      themes: [],
      cities: [],
      minBudget: 100,
      maxBudget: 10000,
    });
  });

  describe('by default', () => {
    it('should keep the filter controls hidden while data is loading', () => {
      mockedFetchAvailableThemes.mockImplementation(() => new Promise(() => {}));

      const { queryByText } = render(<FilterTabScreen />);

      expect(queryByText('Save Filters')).toBeNull();
    });

    it('should load and render the available themes, cities, and budgets', async () => {
      const { getByText, getAllByDisplayValue } = render(<FilterTabScreen />);

      await waitFor(() => {
        expect(getByText('Technology')).toBeTruthy();
        expect(getByText('Education')).toBeTruthy();
        expect(getByText('Budapest')).toBeTruthy();
        expect(getByText('Pecs')).toBeTruthy();
        expect(getAllByDisplayValue(/10/)).toHaveLength(2);
      });
    });
  });

  describe('when the user selects a theme and a city', () => {
    it('should mark both options as selected', async () => {
      const { getByText, queryByText } = render(<FilterTabScreen />);

      await waitFor(() => expect(getByText('Technology')).toBeTruthy());

      expect(queryByText('✓ Technology')).toBeNull();
      fireEvent.press(getByText('Technology'));
      fireEvent.press(getByText('Budapest'));

      expect(getByText('✓ Technology')).toBeTruthy();
      expect(getByText('✓ Budapest')).toBeTruthy();
    });
  });

  describe('when the user saves the filters', () => {
    it('should save the selected values and navigate to the feed', async () => {
      mockedSaveMyFilters.mockResolvedValue(undefined);
      const { getByText, getByDisplayValue, UNSAFE_getAllByType } =
        render(<FilterTabScreen />);

      await waitFor(() => expect(getByText('Technology')).toBeTruthy());
      fireEvent.press(getByText('Technology'));
      fireEvent.press(getByText('Budapest'));
      fireEvent.changeText(getByDisplayValue('100'), '250');
      fireEvent.changeText(UNSAFE_getAllByType(TextInput)[1], '0');
      fireEvent.press(getByText('Save Filters'));

      await waitFor(() => {
        expect(mockedSaveMyFilters).toHaveBeenCalledWith({
          themes: ['Technology'],
          cities: ['Budapest'],
          minBudget: 250,
          maxBudget: 0,
        });
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            text1: 'Success',
          }),
        );
        expect(router.push).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('when the user cancels', () => {
    it('should navigate back to the feed without saving', async () => {
      const { getByText } = render(<FilterTabScreen />);

      await waitFor(() => expect(getByText('Save Filters')).toBeTruthy());
      fireEvent.press(getByText('Cancel'));

      expect(mockedSaveMyFilters).not.toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith('/');
    });
  });

  describe('when loading the filter data fails', () => {
    it('should show an error toast', async () => {
      mockedFetchMyFilters.mockRejectedValue(new Error('Load failed'));

      render(<FilterTabScreen />);

      await waitFor(() => {
        expect(toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to load filters.',
          }),
        );
      });
    });

    describe('when saving the filters fails', () => {
      it('should show an error toast without navigating', async () => {
        mockedSaveMyFilters.mockRejectedValue(new Error('Save failed'));
        const { getByText } = render(<FilterTabScreen />);

        await waitFor(() => expect(getByText('Save Filters')).toBeTruthy());
        fireEvent.press(getByText('Save Filters'));

        await waitFor(() => {
          expect(toast.show).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to save filters.',
            }),
          );
        });
        expect(router.push).not.toHaveBeenCalled();
      });
    });
  });
});
