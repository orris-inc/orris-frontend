/**
 * i18n Configuration
 * Internationalization setup using react-i18next.
 *
 * Translations are lazy-loaded per language: only the active language's JSON is
 * bundled into its own chunk and preloaded before the app renders; the other
 * language is fetched on demand when the user switches. This keeps the large
 * translation files out of the main bundle.
 */

import i18n, { type BackendModule, type ReadCallback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  zh: { name: 'Chinese', nativeName: '中文' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'zh';

// localStorage key used for language persistence
const LANGUAGE_STORAGE_KEY = 'orris-language';

/**
 * Lazy backend: load a language namespace as its own Vite chunk on demand.
 * Used when switching to a language that was not preloaded at startup.
 */
const lazyBackend: BackendModule = {
  type: 'backend',
  init: () => {},
  read: (language: string, namespace: string, callback: ReadCallback) => {
    import(`../locales/${language}/${namespace}.json`)
      .then((mod) => callback(null, mod.default))
      .catch((error) => callback(error as Error, null));
  },
};

/**
 * Resolve the initial language before init so only that language's chunk is
 * preloaded. Mirrors the detector order (localStorage → navigator → default).
 */
function detectInitialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  } catch {
    // localStorage may be unavailable (private mode) — fall through to navigator
  }
  const navLang = navigator.language?.split('-')[0];
  if (navLang && navLang in SUPPORTED_LANGUAGES) {
    return navLang as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Initialize i18next. Awaits the active language's translations so the first
 * render already has them (avoids a flash of untranslated keys).
 */
export async function initI18n(): Promise<typeof i18n> {
  const language = detectInitialLanguage();
  const initial = await import(`../locales/${language}/common.json`);

  await i18n
    .use(lazyBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      // Explicit initial language (already detected + preloaded above)
      lng: language,
      resources: {
        [language]: { common: initial.default },
      },
      // Allow combining preloaded resources with the lazy backend
      partialBundledLanguages: true,

      // Default namespace
      defaultNS: 'common',
      ns: ['common'],

      // Fallback language
      fallbackLng: DEFAULT_LANGUAGE,

      // Supported languages
      supportedLngs: Object.keys(SUPPORTED_LANGUAGES),

      // Language detection options (used for persistence on change)
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
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

  return i18n;
}

export default i18n;
