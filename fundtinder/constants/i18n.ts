import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from '@/locales/en.json';
import hu from '@/locales/hu.json';
import de from '@/locales/de.json';

const deviceLanguage = getLocales()[0]?.languageCode;

i18n.use(initReactI18next).init({
  lng: deviceLanguage === 'hu' ? 'hu' : deviceLanguage === 'de' ? 'de' : 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    hu: { translation: hu },
    de: { translation: de },
  },
  interpolation: { escapeValue: false },
});

export default i18n;
