// Default landing page content. Super admin edits a copy of this in the Landing editor.
const L = (en, ur) => ({ en, ur })

export const LANDING_ICONS = ['Dices', 'ShieldCheck', 'BellRing', 'Languages', 'Smartphone', 'Wallet', 'Users', 'Gavel', 'Sparkles', 'BarChart3', 'Lock', 'HeartHandshake', 'Calculator', 'MessageCircle']

export const LANDING_DEFAULTS = {
  hero: {
    show: true,
    badge: L("Pakistan's smart kameti app", 'پاکستان کی اسمارٹ کمیٹی ایپ'),
    title: L('Kameti, ab', 'کمیٹی، اب'),
    highlight: L('smart.', 'اسمارٹ۔'),
    subtitle: L(
      'Run your kameti without registers, arguments or forgotten payments. Fair qurandazi in one tap, every payment tracked, everyone knows their baari.',
      'رجسٹر، جھگڑوں اور بھولی ہوئی قسطوں کے بغیر کمیٹی چلائیں۔ ایک بٹن میں قرعہ اندازی، ہر ادائیگی کا حساب، ہر کسی کو اپنی باری معلوم۔'
    ),
    ctaPrimary: L('Start free kameti', 'مفت کمیٹی شروع کریں'),
    ctaSecondary: L('See how it works', 'دیکھیں کیسے چلتی ہے'),
  },
  stats: {
    show: true,
    items: [
      { value: '4', label: L('Kameti types', 'کمیٹی کی اقسام') },
      { value: '1 tap', label: L('Qurandazi', 'قرعہ اندازی') },
      { value: '2', label: L('Languages', 'زبانیں') },
      { value: '0', label: L('Registers needed', 'رجسٹر کی ضرورت') },
    ],
  },
  trust: {
    show: true,
    title: L('Kametis running across Pakistan', 'پورے پاکستان میں کمیٹیاں'),
    items: 'Lahore · Karachi · Islamabad · Faisalabad · Multan · Peshawar · Quetta · Sialkot · Gujranwala · Hyderabad · Rawalpindi · Bahawalpur',
  },
  features: {
    show: true,
    title: L('Everything a kameti needs', 'کمیٹی کی ہر ضرورت'),
    subtitle: L('Built for mohallas, offices, shops and families. So simple anyone can use it.', 'محلے، دفتر، دکان اور خاندان کے لیے۔ اتنی آسان کہ ہر کوئی چلا لے۔'),
    items: [
      { icon: 'Dices', title: L('Fair qurandazi', 'منصفانہ قرعہ اندازی'), desc: L('One tap shuffle gives every member a random turn. No doubts, no favourites.', 'ایک بٹن سے سب کو بے ترتیب باری۔ کوئی شک نہیں، کوئی پسند ناپسند نہیں۔') },
      { icon: 'Wallet', title: L('Every payment tracked', 'ہر قسط کا حساب'), desc: L('Tap a name to mark paid. See who paid and who is pending, round by round.', 'نام پر دبائیں اور ادا کریں۔ ہر راؤنڈ میں کس نے دیا، کس کا باقی۔') },
      { icon: 'BellRing', title: L('WhatsApp reminders', 'واٹس ایپ یاد دہانی'), desc: L('Send a polite reminder to late payers straight on WhatsApp.', 'دیر کرنے والوں کو واٹس ایپ پر شائستہ یاد دہانی۔') },
      { icon: 'Languages', title: L('Urdu and English', 'اردو اور انگریزی'), desc: L('Switch language anytime. Big buttons, clear icons, easy for everyone.', 'جب چاہیں زبان بدلیں۔ بڑے بٹن، واضح نشان، سب کے لیے آسان۔') },
      { icon: 'Calculator', title: L('Instant calculation', 'فوری حساب'), desc: L('Enter amount and duration — pot, end date and schedule appear instantly.', 'رقم اور مدت ڈالیں — کل رقم، آخری تاریخ اور شیڈول فوراً۔') },
      { icon: 'MessageCircle', title: L('Share on WhatsApp', 'واٹس ایپ پر شیئر'), desc: L('Every member gets a picture card with their numbers, months and amounts.', 'ہر ممبر کو اس کے نمبر، مہینے اور رقم والی تصویر۔') },
    ],
  },
  types: {
    show: true,
    title: L('Every kind of kameti', 'ہر قسم کی کمیٹی'),
    subtitle: L('Any type — and any number can be split between 2 or 3 people.', 'کوئی بھی قسم — اور کوئی بھی نمبر 2 یا 3 لوگوں میں بانٹا جا سکتا ہے۔'),
  },
  steps: {
    show: true,
    title: L('Start in 3 minutes', '3 منٹ میں شروع'),
    items: [
      { title: L('Pick a type', 'قسم چنیں'), desc: L('Fixed, qurandazi, boli or need based.', 'مقررہ، قرعہ اندازی، بولی یا ضرورت۔') },
      { title: L('Amount and duration', 'رقم اور مدت'), desc: L('Kumeti calculates everything for you.', 'کمیٹی ایپ سارا حساب خود کرے گی۔') },
      { title: L('Add members', 'ممبرز شامل کریں'), desc: L('Just names is enough. Paste a whole list at once.', 'صرف نام کافی ہیں۔ پوری لسٹ ایک ساتھ۔') },
      { title: L('Shuffle and share', 'قرعہ اندازی اور شیئر'), desc: L('Set the numbers, share each member\'s card on WhatsApp.', 'نمبر طے کریں، ہر ممبر کا کارڈ واٹس ایپ پر بھیجیں۔') },
    ],
  },
  testimonials: {
    show: true,
    title: L('Loved by organizers', 'آرگنائزرز کی پسند'),
    items: [
      { name: 'Shazia Parveen', city: 'Lahore', quote: L('I ran 3 kametis in registers. Now everything is on my phone and nobody argues about turns.', 'میں رجسٹر میں 3 کمیٹیاں چلاتی تھی۔ اب سب فون پر ہے اور باری پر کوئی جھگڑا نہیں۔') },
      { name: 'Haji Rasheed', city: 'Faisalabad', quote: L('Our market boli kameti was always confusing. Kumeti calculates the discount itself.', 'ہماری مارکیٹ کی بولی کمیٹی ہمیشہ الجھن تھی۔ اب رعایت کا حساب خود ہو جاتا ہے۔') },
      { name: 'Areeba Khan', city: 'Karachi', quote: L('Office kameti with 20 people, reminders on WhatsApp in one tap. Brilliant.', '20 لوگوں کی دفتر کمیٹی، ایک بٹن سے واٹس ایپ یاد دہانی۔ کمال۔') },
    ],
  },
  faq: {
    show: true,
    title: L('Questions', 'سوالات'),
    items: [
      { q: L('Is Kumeti free?', 'کیا کمیٹی ایپ مفت ہے؟'), a: L('Yes, organizers can create and run kametis for free.', 'جی ہاں، آرگنائزر مفت کمیٹی بنا اور چلا سکتے ہیں۔') },
      { q: L('Does Kumeti hold our money?', 'کیا ایپ ہمارے پیسے رکھتی ہے؟'), a: L('No. Money stays with your organizer as always. Kumeti only keeps the record.', 'نہیں۔ پیسے ہمیشہ کی طرح آرگنائزر کے پاس رہتے ہیں۔ ایپ صرف حساب رکھتی ہے۔') },
      { q: L('Do members need a smartphone?', 'کیا ممبر کے پاس اسمارٹ فون ضروری ہے؟'), a: L('No. You can add members by name only. Logins are optional.', 'نہیں۔ صرف نام سے ممبر شامل کریں۔ لاگ اِن اختیاری ہے۔') },
      { q: L('Is the qurandazi fair?', 'کیا قرعہ اندازی منصفانہ ہے؟'), a: L('Yes. Turns are shuffled randomly on the server, and turns already paid out are never changed.', 'جی ہاں۔ باریاں سرور پر بے ترتیب طے ہوتی ہیں، اور جن کو کمیٹی مل چکی ان کی باری نہیں بدلتی۔') },
    ],
  },
  cta: {
    show: true,
    title: L('Your next kameti starts here', 'آپ کی اگلی کمیٹی یہاں سے'),
    subtitle: L('Free for organizers. Ready in minutes.', 'آرگنائزرز کے لیے مفت۔ منٹوں میں تیار۔'),
    button: L('Create my kameti', 'میری کمیٹی بنائیں'),
  },
  footer: {
    about: L('Kumeti — apni baari, apne waqt pe.', 'کمیٹی — اپنی باری، اپنے وقت پہ۔'),
    phone: '+92 300 0000000',
    email: 'hello@kumeti.pk',
    address: L('Lahore, Pakistan', 'لاہور، پاکستان'),
  },
}

// Deep-merge saved landing over defaults so new fields always exist.
export function mergeLanding(saved) {
  const merge = (a, b) => {
    if (Array.isArray(a)) return Array.isArray(b) ? b : a
    if (a && typeof a === 'object') {
      const out = { ...a }
      if (b && typeof b === 'object') for (const k of Object.keys(b)) out[k] = k in a ? merge(a[k], b[k]) : b[k]
      return out
    }
    return b === undefined || b === null ? a : b
  }
  return merge(LANDING_DEFAULTS, saved || {})
}
