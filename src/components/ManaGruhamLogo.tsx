import React, { useId, useState } from 'react';
import officialLogoPng from '../assets/mana_gruham_logo.png';

interface ManaGruhamLogoProps {
  className?: string;
  size?: number;
  variant?: 'badge' | 'on-dark' | 'clean';
}

/**
 * Official Mana Gruham Real App House Logo
 * Renders the single canonical 512x512 Mana Gruham logo image bundled directly
 * into Vite / Android offline assets, with a unique-ID SVG fallback if needed.
 */
export const ManaGruhamLogo: React.FC<ManaGruhamLogoProps> = ({
  className = '',
  size = 44,
  variant = 'badge',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const bgGradId = `mgBg-${rawId}`;
  const roofGradId = `mgRoof-${rawId}`;

  if (!imgFailed) {
    return (
      <img
        src={officialLogoPng}
        alt="Mana Gruham Official Logo"
        width={size}
        height={size}
        draggable={false}
        onError={() => setImgFailed(true)}
        className={`shrink-0 select-none object-contain ${
          variant === 'on-dark' ? 'rounded-xl' : ''
        } ${className}`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      role="img"
      aria-label="Mana Gruham Official Logo"
    >
      <defs>
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#065F46" />
          <stop offset="55%" stopColor="#15803D" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={roofGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#ECFDF5" />
        </linearGradient>
      </defs>

      {variant !== 'clean' && (
        <>
          <rect x="24" y="24" width="464" height="464" rx="108" fill={`url(#${bgGradId})`} />
          <rect
            x="38"
            y="38"
            width="436"
            height="436"
            rx="96"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.26"
            strokeWidth="5"
          />
        </>
      )}

      <circle cx="256" cy="216" r="132" fill="#FFFFFF" fillOpacity={variant === 'clean' ? 0.14 : 0.08} />
      <rect x="336" y="138" width="32" height="66" rx="8" fill="#D1FAE5" />
      <path d="M96 244 L256 106 L416 244 L390 272 L256 156 L122 272 Z" fill={`url(#${roofGradId})`} />
      <path
        d="M142 254 L256 158 L370 254 L370 368 C370 380 360 390 348 390 L164 390 C152 390 142 380 142 368 Z"
        fill="#FFFFFF"
      />
      <rect x="172" y="274" width="56" height="56" rx="10" fill="#15803D" />
      <rect x="179" y="281" width="18" height="18" rx="3" fill="#A7F3D0" />
      <rect x="203" y="281" width="18" height="18" rx="3" fill="#A7F3D0" />
      <rect x="179" y="305" width="18" height="18" rx="3" fill="#ECFDF5" />
      <rect x="203" y="305" width="18" height="18" rx="3" fill="#ECFDF5" />
      <path
        d="M254 390 L254 294 C254 277 268 264 285 264 C302 264 316 277 316 294 L316 390 Z"
        fill="#065F46"
      />
      <circle cx="303" cy="336" r="5" fill="#FDE68A" />
      <path d="M108 392 Q256 364 404 392 Q256 414 108 392 Z" fill="#D1FAE5" />
      <circle cx="372" cy="364" r="46" fill="#065F46" />
      <circle cx="372" cy="364" r="38" fill="#10B981" stroke="#FFFFFF" strokeWidth="5" />
      <path
        d="M353 365 L366 378 L392 350"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
