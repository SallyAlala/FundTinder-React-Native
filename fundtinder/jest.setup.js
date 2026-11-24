global.__DEV__ = true;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

require('./constants/i18n');

require('i18next').changeLanguage('en');
