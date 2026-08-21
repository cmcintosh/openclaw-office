// office-game/src/i18n.ts
type Locale = 'en' | 'zh-Hans' | 'ja' | 'ko' | 'de' | 'es';

const SUPPORTED_LOCALES: readonly string[] = ['en', 'zh-Hans', 'ja', 'ko', 'de', 'es'];

let currentLocale: Locale = 'en';
let translations: Record<string, string> = {};

// Import translations
import { zhHans } from './locales/zh-Hans';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { de } from './locales/de';
import { es } from './locales/es';

const LOCALE_MAP: Record<string, Record<string, string>> = {
  'zh-Hans': zhHans,
  ja,
  ko,
  de,
  es,
};

/** Set the active locale. Called when bridge receives LOCALE message. */
export function setLocale(locale: string): void {
  const normalized = locale.startsWith('zh') ? 'zh-Hans' : locale;
  currentLocale = SUPPORTED_LOCALES.includes(normalized) ? (normalized as Locale) : 'en';
  translations = LOCALE_MAP[currentLocale] ?? {};
}

/** Translate a key. Returns the translation if available, otherwise the key itself (English fallback). */
export function t(key: string): string {
  return translations[key] ?? key;
}

/** Get current locale. */
export function getLocale(): Locale {
  return currentLocale;
}
