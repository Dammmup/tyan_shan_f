import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ru from './locales/ru.json';
import kk from './locales/kk.json';
import en from './locales/en.json';

const saved = localStorage.getItem('tyan-shan-lang') || 'ru';

void i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
    en: { translation: en },
  },
  lng: saved,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lng: string): void {
  localStorage.setItem('tyan-shan-lang', lng);
  void i18n.changeLanguage(lng);
}

export default i18n;
