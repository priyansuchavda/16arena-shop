type IconProps = { size?: number; className?: string };

export function StarIcon({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFC24D" className={className}>
      <path d="m12 2 2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.6 5.9 20.4l1.5-6.8L2.2 9l6.9-.7z" />
    </svg>
  );
}

export function CoinIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFC24D" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="#a8730a" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#a8730a" strokeWidth="1.2" opacity="0.7" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="800" fill="#7a4d00">
        ₹
      </text>
    </svg>
  );
}

export function SearchIcon({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

export function CartIcon({ size = 19, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="21" r="1.2" />
      <circle cx="19" cy="21" r="1.2" />
      <path d="M2.5 3h2l2.4 13.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}

export function BellIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

export function BoltIcon({ size = 13, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c1.5 4-2 5-2 8a4 4 0 0 0 8 0c0-2-1-3-1-5 3 2 5 5 5 9a8 8 0 1 1-16 0c0-5 4-7 6-12z" />
    </svg>
  );
}

export function ZapIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}
