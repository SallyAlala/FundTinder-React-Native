/** @type {import('jest').Config} */
const expoPreset = require('jest-expo/jest-preset.js');

module.exports = {
  ...expoPreset,
  testPathIgnorePatterns: ['/node_modules/', '/functions/'],
  setupFiles: [...(expoPreset.setupFiles || []), '<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/hooks/use-color-scheme/use-color-scheme$':
      '<rootDir>/hooks/use-color-scheme/use-color-scheme.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/index.{ts,tsx}',
    '!app/**/_layout.{ts,tsx}',
    '!app/**/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
