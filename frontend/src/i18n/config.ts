import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationAR from './locales/ar/translation.json';
import translationDE from './locales/de/translation.json';
import translationFR from './locales/fr/translation.json';
import translationHI from './locales/hi/translation.json';
import translationIT from './locales/it/translation.json';
import translationJA from './locales/ja/translation.json';
import translationNL from './locales/nl/translation.json';
import translationPL from './locales/pl/translation.json';
import translationPT from './locales/pt/translation.json';
import translationSV from './locales/sv/translation.json';
import translationTR from './locales/tr/translation.json';
import translationZHCN from './locales/zh-CN/translation.json';

const resources = {
    en: { translation: translationEN },
    es: { translation: translationES },
    ar: { translation: translationAR },
    de: { translation: translationDE },
    fr: { translation: translationFR },
    hi: { translation: translationHI },
    it: { translation: translationIT },
    ja: { translation: translationJA },
    nl: { translation: translationNL },
    pl: { translation: translationPL },
    pt: { translation: translationPT },
    sv: { translation: translationSV },
    tr: { translation: translationTR },
    'zh-CN': { translation: translationZHCN },
};

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        resources,
        fallbackLng: 'en',
        debug: true,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    });

export default i18n;
