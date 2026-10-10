import { useId } from 'react'

// Circle of members, one glowing dot = "is mahine ki baari".
export function LogoMark({ size = 36, spin = false, className = '' }) {
  const id = useId().replace(/:/g, '')
  const dots = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2
    return [32 + Math.cos(a) * 20, 32 + Math.sin(a) * 20]
  })
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A99BF8" /><stop offset=".55" stopColor="#8576F2" /><stop offset="1" stopColor="#6C5CE7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#0F0A1F" /><rect x=".75" y=".75" width="62.5" height="62.5" rx="17.25" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.5" />
      <g className={spin ? 'origin-center animate-spin-slow' : ''} style={{ transformBox: 'view-box' }}>
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 5 ? 6.5 : 4.2} fill={i === 5 ? `url(#g${id})` : '#fff'} opacity={i === 5 ? 1 : 0.35} />
        ))}
      </g>
      <circle cx="32" cy="32" r="7" fill="none" stroke={`url(#g${id})`} strokeWidth="3" />
    </svg>
  )
}

export default function Logo({ light = false, size = 36, spin = false }) {
  return (
    <span className="inline-flex items-center gap-2.5" dir="ltr">
      <LogoMark size={size} spin={spin} />
      <span className={`font-sans text-2xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-fg'}`} style={{ lineHeight: 1 }}>
        kumeti<span className="text-gradient">.</span>
      </span>
    </span>
  )
}
