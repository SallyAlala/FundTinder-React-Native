import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LiliAITabScreen from '@/app/(tabs)/lili';
import { askLili } from '@/services/lili-ai/liliAIService';

jest.mock('@/services/lili-ai/liliAIService', () => ({
  askLili: jest.fn(),
}));

jest.mock('@/hooks/use-is-desktop/use-is-desktop', () => ({
  useIsDesktop: () => false,
}));

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@/components/parallax-scroll-view/parallax-scroll-view', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('lottie-react-native', () => 'LottieView');

const mockedAskLili = askLili as jest.MockedFunction<typeof askLili>;

describe('Lili AI screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAskLili.mockResolvedValue('Here is a helpful answer.');
  });

  describe('by default', () => {
    it('should render the title, suggestions, initial message, and input', () => {
      const { getByText, getByPlaceholderText } = render(<LiliAITabScreen />);

      expect(getByText('Lili AI')).toBeTruthy();
      expect(getByText('What is FundTinder?')).toBeTruthy();
      expect(
        getByText(/Hi! I'm Lili AI\. I can help you navigate FundTinder/),
      ).toBeTruthy();
      expect(getByPlaceholderText('Ask Lili AI...')).toBeTruthy();
    });
  });

  describe('when the user sends a suggestion', () => {
    it('should ask Lili and render the response', async () => {
      const { getByText } = render(<LiliAITabScreen />);

      fireEvent.press(getByText('What is FundTinder?'));

      await waitFor(() => {
        expect(mockedAskLili).toHaveBeenCalledWith([
          expect.objectContaining({ role: 'assistant' }),
          { role: 'user', content: 'What is FundTinder?' },
        ]);
        expect(getByText('Here is a helpful answer.')).toBeTruthy();
      });
    });
  });

  describe('when the input is empty', () => {
    it('should not send a message', () => {
      const { getByText } = render(<LiliAITabScreen />);

      fireEvent.press(getByText('Send'));

      expect(mockedAskLili).not.toHaveBeenCalled();
    });

    it('should ignore whitespace-only messages', () => {
      const { getByPlaceholderText, getByText } = render(<LiliAITabScreen />);

      fireEvent.changeText(getByPlaceholderText('Ask Lili AI...'), '   ');
      fireEvent.press(getByText('Send'));

      expect(mockedAskLili).not.toHaveBeenCalled();
    });
  });

  it('should update suggestion hover state and keep the message list scrolled', () => {
    const { getByText, UNSAFE_getByType } = render(<LiliAITabScreen />);
    const suggestion = getByText('What is FundTinder?');

    fireEvent(suggestion, 'hoverIn');
    fireEvent(suggestion, 'hoverOut');
    fireEvent(UNSAFE_getByType(require('react-native').ScrollView), 'contentSizeChange');
  });

  describe('when the user sends text', () => {
    it('should clear the input and show the successful answer', async () => {
      const { getByPlaceholderText, getByText, queryByDisplayValue } =
        render(<LiliAITabScreen />);
      const input = getByPlaceholderText('Ask Lili AI...');

      fireEvent.changeText(input, '  Explain themes  ');
      fireEvent.press(getByText('Send'));

      await waitFor(() => {
        expect(mockedAskLili).toHaveBeenCalled();
        expect(getByText('Explain themes')).toBeTruthy();
        expect(getByText('Here is a helpful answer.')).toBeTruthy();
        expect(queryByDisplayValue('Explain themes')).toBeNull();
      });
    });

    describe('when Lili is answering', () => {
      it('should show the typing state and ignore another send until the answer arrives', async () => {
        mockedAskLili.mockImplementation(() => new Promise(() => {}));
        const {
          getByPlaceholderText,
          getByText,
          getByLabelText,
        } =
          render(<LiliAITabScreen />);
        const input = getByPlaceholderText('Ask Lili AI...');

        fireEvent.changeText(input, 'First question');
        fireEvent.press(getByText('Send'));

        expect(getByLabelText('Typing')).toBeTruthy();
        fireEvent.press(getByText('Send'));
        expect(mockedAskLili).toHaveBeenCalledTimes(1);
      });
    });

    describe('when Lili finishes answering', () => {
      it('should clear the typing state after the request completes', async () => {
        mockedAskLili.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve('Delayed answer'), 20),
            ),
        );
        const { getByPlaceholderText, getByText, getByLabelText, queryByLabelText } =
          render(<LiliAITabScreen />);

        fireEvent.changeText(getByPlaceholderText('Ask Lili AI...'), 'Question');
        fireEvent.press(getByText('Send'));

        expect(getByLabelText('Typing')).toBeTruthy();
        await waitFor(() => {
          expect(queryByLabelText('Typing')).toBeNull();
          expect(getByText('Delayed answer')).toBeTruthy();
        });
      });
    });
  });
});
