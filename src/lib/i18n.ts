/**
 * i18n Configuration
 * Internationalization setup using react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import zhCommon from '@/locales/zh/common.json';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  zh: { name: 'Chinese', nativeName: '中文' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh';

// Language detection order
const DETECTION_ORDER = [
  'localStorage',
  'navigator',
  'htmlTag',
] as const;

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Resources
    resources: {
      en: {
        common: enCommon,
      },
      zh: {
        common: zhCommon,
      },
    },

    // Default namespace
    defaultNS: 'common',
    ns: ['common'],

    // Fallback language
    fallbackLng: DEFAULT_LANGUAGE,

    // Supported languages
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),

    // Language detection options
    detection: {
      order: [...DETECTION_ORDER],
      caches: ['localStorage'],
      lookupLocalStorage: 'orris-language',
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React options
    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },

    // Debug mode (only in development)
    debug: import.meta.env.DEV,
  });

export default i18n;
