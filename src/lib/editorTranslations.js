const labels = {
  section_hero: ['Hero', 'ابتدائی حصہ', 'Shuru ka hissa'], section_stats: ['Stats', 'اعداد و شمار', 'Adad o shumar'], section_trust: ['Cities ticker', 'شہروں کی پٹی', 'Shehron ki patti'],
  section_features: ['Features', 'سہولیات', 'Sahuliyat'], section_types: ['Kameti types', 'کمیٹی کی اقسام', 'Kameti ki qismein'], section_steps: ['How it works', 'طریقہ کار', 'Kaise chalegi'],
  section_testimonials: ['Testimonials', 'لوگوں کی رائے', 'Logon ki raye'], section_faq: ['FAQ', 'عام سوالات', 'Aam sawalat'], section_cta: ['Call to action', 'شروع کرنے کا حصہ', 'Shuru karne ka hissa'], section_footer: ['Footer', 'آخری حصہ', 'Neechay ka hissa'],
  badge: ['Badge', 'چھوٹا پیغام', 'Chhota paigham'], title: ['Title', 'عنوان', 'Unwan'], highlight: ['Highlight', 'نمایاں الفاظ', 'Numayan alfaaz'], subtitle: ['Subtitle', 'تفصیل', 'Tafseel'],
  ctaPrimary: ['Primary button', 'بنیادی بٹن', 'Bunyadi button'], ctaSecondary: ['Secondary button', 'دوسرا بٹن', 'Doosra button'], value: ['Value', 'قدر', 'Qeemat'], label: ['Label', 'نام', 'Naam'], items: ['Cities', 'شہر', 'Shehr'],
  icon: ['Icon', 'نشان', 'Nishan'], desc: ['Description', 'تفصیل', 'Tafseel'], name: ['Name', 'نام', 'Naam'], city: ['City', 'شہر', 'Shehr'], quote: ['Quote', 'رائے', 'Raye'],
  q: ['Question', 'سوال', 'Sawal'], a: ['Answer', 'جواب', 'Jawab'], button: ['Button', 'بٹن', 'Button'], about: ['About', 'تعارف', 'Taaruf'], phone: ['Phone', 'فون', 'Phone'], email: ['Email', 'ای میل', 'Email'], address: ['Address', 'پتہ', 'Pata'],
}
export const EDITOR_TRANSLATIONS = Object.fromEntries(['en', 'ur', 'roman'].map((language, i) => [language, Object.fromEntries(Object.entries(labels).map(([key, values]) => [`editor_${key}`, values[i]]))]))
