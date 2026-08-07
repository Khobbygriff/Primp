import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import tw from './locales/tw.json';

export const LANGUAGE_STORAGE_KEY = 'primp-language';
export const SUPPORTED_LANGUAGES = ['en', 'tw'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  tw: { translation: tw },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React handles XSS escaping natively
  },
});

export const loadPersistedLanguage = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    // Standard JS includes work directly on typed arrays; no raw string casting needed
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.error('Failed to load persisted language:', error);
  }
};

export const changeAppLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to persist language:', error);
  }
};

export default i18n;