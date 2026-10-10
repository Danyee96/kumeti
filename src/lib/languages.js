export const LANGUAGES = [
  { value: 'en', label: 'English', htmlLang: 'en', dir: 'ltr' },
  { value: 'ur', label: 'اردو', htmlLang: 'ur', dir: 'rtl' },
  { value: 'roman', label: 'Roman Urdu', htmlLang: 'ur-Latn', dir: 'ltr' },
]
export const normalizeLanguage = (value) => LANGUAGES.some((language) => language.value === value) ? value : 'en'
