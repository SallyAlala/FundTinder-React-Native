import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { TextField } from '@/components/ui/text-field/text-field';

jest.mock('@/hooks/use-color-scheme/use-color-scheme', () => ({
  useColorScheme: () => 'light',
}));

describe('TextField', () => {
  describe('by default', () => {
    it('should render its label and placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <TextField label="Email" placeholder="Enter your email" />,
      );

      expect(getByText('Email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    });
  });

  describe('when an email is invalid', () => {
    it('should display an email validation error after blur', () => {
      function ControlledEmailField() {
        const [value, setValue] = useState('');

        return (
          <TextField
            required
            type="emailAddress"
            placeholder="Enter your email"
            value={value}
            onChangeText={setValue}
          />
        );
      }

      const { getByPlaceholderText, getByText } = render(
        <ControlledEmailField />,
      );
      const input = getByPlaceholderText('Enter your email');

      fireEvent.changeText(input, 'invalid-email');
      fireEvent(input, 'blur');

      expect(getByText('Invalid email address!')).toBeTruthy();
    });
  });

  describe('when numeric input contains non-digits', () => {
    it('should pass only digits to onChangeText', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = render(
        <TextField
          type="numeric"
          placeholder="Budget"
          onChangeText={onChangeText}
        />,
      );

      fireEvent.changeText(getByPlaceholderText('Budget'), '12abc3');

      expect(onChangeText).toHaveBeenCalledWith('123');
    });
  });
});
