/** @type {import('tailwindcss').Config} */
// Theme-aware colours are CSS variables (see src/index.css) so every screen
// flips between light and dark by toggling the `dark` class on <html>.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`
const shades = (hue, list) => Object.fromEntries(list.map((s) => [s, v(`${hue}-${s}`)]))

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: v('ink'), 2: '#1A1330', 3: '#251C42' },
        lilac: v('lilac'),
        surface: v('surface'),
        fg: v('fg'),
        line: 'var(--line)',
        soft: 'var(--soft)',
        violet: { brand: '#7C3AED', ...shades('violet', [50, 100, 200, 700]) },
        emerald: shades('emerald', [50, 100, 600, 700]),
        red: shades('red', [50, 100, 600]),
        amber: shades('amber', [50, 100, 600, 700]),
        pink: shades('pink', [50, 100, 600, 700]),
        cyan: shades('cyan', [100, 700]),
        gray: shades('gray', [50, 100, 300, 500, 600]),
        fuchsia: shades('fuchsia', [600]),
        glow: { pink: '#EC4899', orange: '#F97316', cyan: '#06B6D4', emerald: '#10B981', gold: '#FBBF24' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        num: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', '"Plus Jakarta Sans"', 'serif'],
      },
      backgroundImage: {
        baari: 'linear-gradient(120deg,#7C3AED 0%,#EC4899 55%,#F97316 100%)',
        trust: 'linear-gradient(120deg,#06B6D4 0%,#10B981 100%)',
      },
      boxShadow: {
        glow: '0 20px 60px -15px rgba(236,72,153,.55)',
        soft: '0 10px 40px -12px var(--shadow)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        spin_slow: { to: { transform: 'rotate(360deg)' } },
        marquee: { to: { transform: 'translateX(-50%)' } },
        pop: { '0%': { transform: 'scale(.6)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shine: { to: { backgroundPosition: '200% center' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin_slow 24s linear infinite',
        marquee: 'marquee 30s linear infinite',
        pop: 'pop .35s cubic-bezier(.2,1.4,.4,1) both',
        shine: 'shine 4s linear infinite',
      },
    },
  },
  plugins: [],
}
