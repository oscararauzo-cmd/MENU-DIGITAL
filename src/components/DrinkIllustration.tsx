import React from 'react';

interface DrinkIllustrationProps {
  keyName?: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const DrinkIllustration: React.FC<DrinkIllustrationProps> = ({
  keyName = 'pisco-sour',
  imageUrl,
  className = '',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36',
    full: 'w-full h-full',
  };

  const dim = sizeMap[size];

  // If a high-resolution realistic image is provided, render with luxury framing
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-[#4a3a2e]/60 shadow-xl bg-[#14110e] ${dim} ${className} group`}>
        <img
          src={imageUrl}
          alt={keyName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-95 contrast-105"
        />
        {/* Subtle warm amber vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
      </div>
    );
  }

  // Fallback vector illustrations
  switch (keyName) {
    case 'pisco-sour':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(217,101,72,0.3)]">
            <defs>
              <linearGradient id="piscoLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="foamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#fef9c3" />
              </linearGradient>
            </defs>
            {/* Coupe Glass Bowl */}
            <path
              d="M 18 36 C 18 64 82 64 82 36 Z"
              fill="url(#piscoLiquid)"
              stroke="#fef08a"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            {/* Silky Egg White Foam */}
            <ellipse cx="50" cy="36" rx="32" ry="7" fill="url(#foamGrad)" />
            {/* Amargo de Chuncho Bitters Drops on Foam */}
            <circle cx="42" cy="35" r="2.2" fill="#78350f" />
            <circle cx="50" cy="36" r="2.5" fill="#78350f" />
            <circle cx="58" cy="35" r="2.2" fill="#78350f" />
            <circle cx="50" cy="33" r="1.5" fill="#9a3412" />
            {/* Glass Rim highlight */}
            <ellipse cx="50" cy="35" rx="32" ry="7" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
            {/* Glass Stem */}
            <line x1="50" y1="62" x2="50" y2="86" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            {/* Glass Base */}
            <ellipse cx="50" cy="87" rx="20" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'chilcano':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(234,179,8,0.25)]">
            <defs>
              <linearGradient id="chilcanoLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {/* Highball Glass Body */}
            <rect x="28" y="24" width="44" height="64" rx="4" fill="url(#chilcanoLiquid)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
            {/* Ice Cubes */}
            <rect x="36" y="38" width="18" height="16" rx="3" fill="#ffffff" fillOpacity="0.45" stroke="#ffffff" strokeWidth="1" />
            <rect x="46" y="56" width="18" height="16" rx="3" fill="#ffffff" fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />
            <rect x="34" y="68" width="16" height="14" rx="3" fill="#ffffff" fillOpacity="0.35" stroke="#ffffff" strokeWidth="1" />
            {/* Lime Wheel Garnish on rim */}
            <circle cx="28" cy="24" r="13" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1.5" />
            <circle cx="28" cy="24" r="9" fill="#a3e635" />
            <line x1="28" y1="15" x2="28" y2="33" stroke="#4d7c0f" strokeWidth="1" />
            <line x1="19" y1="24" x2="37" y2="24" stroke="#4d7c0f" strokeWidth="1" />
            {/* Glass Highball Rim and Straw */}
            <line x1="58" y1="12" x2="48" y2="60" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
            <line x1="26" y1="24" x2="74" y2="24" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'chilcano-maracuya':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(249,115,22,0.3)]">
            <defs>
              <linearGradient id="maracuyaLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fdba74" />
                <stop offset="60%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            <rect x="28" y="24" width="44" height="64" rx="4" fill="url(#maracuyaLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.6" />
            {/* Ice */}
            <rect x="38" y="36" width="18" height="16" rx="3" fill="#ffffff" fillOpacity="0.4" />
            <rect x="42" y="58" width="18" height="16" rx="3" fill="#ffffff" fillOpacity="0.35" />
            {/* Maracuya seeds inside */}
            <circle cx="38" cy="72" r="2.2" fill="#451a03" />
            <circle cx="58" cy="76" r="2.5" fill="#451a03" />
            <circle cx="52" cy="48" r="2.2" fill="#451a03" />
            <circle cx="36" cy="52" r="1.8" fill="#451a03" />
            {/* Mint Sprig garnish */}
            <path d="M 28 24 C 20 16 28 8 36 18 Z" fill="#22c55e" />
            <path d="M 32 20 C 40 12 48 20 38 24 Z" fill="#16a34a" />
            <line x1="26" y1="24" x2="74" y2="24" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'maracuya-sour':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(234,179,8,0.35)]">
            <defs>
              <linearGradient id="maracSour" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <path d="M 18 36 C 18 64 82 64 82 36 Z" fill="url(#maracSour)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
            <ellipse cx="50" cy="36" rx="32" ry="7" fill="#fef3c7" />
            <circle cx="44" cy="35" r="2.2" fill="#78350f" />
            <circle cx="56" cy="36" r="2.2" fill="#78350f" />
            <line x1="50" y1="62" x2="50" y2="86" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            <ellipse cx="50" cy="87" rx="20" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'capitan':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(159,18,57,0.35)]">
            <defs>
              <linearGradient id="capitanLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#be123c" />
                <stop offset="60%" stopColor="#881337" />
                <stop offset="100%" stopColor="#4c0519" />
              </linearGradient>
            </defs>
            {/* Classic V-Martini bowl */}
            <polygon points="16,28 84,28 50,66" fill="url(#capitanLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
            {/* Cocktail Pick with Cherry */}
            <line x1="26" y1="20" x2="68" y2="44" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="48" cy="33" r="6" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
            <line x1="50" y1="66" x2="50" y2="88" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            <ellipse cx="50" cy="89" rx="22" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'negroni':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(225,29,72,0.4)]">
            <defs>
              <linearGradient id="negroniLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="50%" stopColor="#be123c" />
                <stop offset="100%" stopColor="#9f1239" />
              </linearGradient>
            </defs>
            {/* Rocks Glass */}
            <polygon points="26,34 74,34 70,86 30,86" fill="url(#negroniLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
            {/* Giant Ice Sphere/Cube */}
            <rect x="36" y="44" width="28" height="28" rx="6" fill="#ffffff" fillOpacity="0.4" stroke="#ffffff" strokeWidth="1" />
            {/* Orange Peel Twist */}
            <path
              d="M 68 28 C 76 34 68 44 60 48"
              fill="none"
              stroke="#ea580c"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <line x1="24" y1="34" x2="76" y2="34" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'muna-mule':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(217,119,6,0.35)]">
            <defs>
              <linearGradient id="copper" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="50%" stopColor="#c2410c" />
                <stop offset="100%" stopColor="#7c2d12" />
              </linearGradient>
            </defs>
            {/* Copper Mug Body */}
            <rect x="26" y="34" width="46" height="52" rx="8" fill="url(#copper)" stroke="#fdba74" strokeWidth="2" />
            {/* Copper Handle */}
            <path d="M 72 42 C 86 42 86 76 72 76" fill="none" stroke="#c2410c" strokeWidth="5.5" strokeLinecap="round" />
            {/* Crushed Ice Dome top */}
            <path d="M 28 34 C 36 24 62 24 70 34 Z" fill="#f8fafc" />
            {/* Fresh Muña / Mint Leaves */}
            <path d="M 44 26 C 36 14 50 12 50 24 Z" fill="#15803d" />
            <path d="M 52 24 C 62 12 66 22 54 26 Z" fill="#22c55e" />
          </svg>
        </div>
      );

    case 'gin-tonic':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(14,165,233,0.3)]">
            <defs>
              <linearGradient id="tonicLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Large Balloon Copa */}
            <circle cx="50" cy="44" r="28" fill="url(#tonicLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
            {/* Grapefruit slice */}
            <path d="M 34 32 C 44 26 56 30 52 42 Z" fill="#fb7185" stroke="#e11d48" strokeWidth="1" />
            {/* Molle pink peppercorn / rosemary */}
            <circle cx="62" cy="46" r="2.5" fill="#e11d48" />
            <circle cx="44" cy="54" r="2.2" fill="#e11d48" />
            <circle cx="54" cy="56" r="2" fill="#e11d48" />
            <line x1="50" y1="72" x2="50" y2="88" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round" />
            <ellipse cx="50" cy="89" rx="20" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'algarrobina':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(120,53,15,0.4)]">
            <defs>
              <linearGradient id="algarrobaLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
            </defs>
            <path d="M 20 38 C 20 64 80 64 80 38 Z" fill="url(#algarrobaLiq)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
            <ellipse cx="50" cy="38" rx="30" ry="6" fill="#b45309" />
            {/* Cinnamon powder sprinkle */}
            <circle cx="46" cy="37" r="1.5" fill="#451a03" />
            <circle cx="52" cy="39" r="1.8" fill="#451a03" />
            <circle cx="58" cy="36" r="1.4" fill="#451a03" />
            <line x1="50" y1="62" x2="50" y2="86" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            <ellipse cx="50" cy="87" rx="18" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'espresso-martini':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(30,27,24,0.6)]">
            <defs>
              <linearGradient id="espressoLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#292524" />
                <stop offset="100%" stopColor="#0c0a09" />
              </linearGradient>
            </defs>
            <polygon points="18,28 82,28 50,66" fill="url(#espressoLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
            {/* Crema top */}
            <ellipse cx="50" cy="28" rx="32" ry="5" fill="#d97706" fillOpacity="0.85" />
            {/* 3 Roasted Coffee Beans garnish */}
            <ellipse cx="44" cy="27" rx="3" ry="1.8" fill="#1c1917" stroke="#78350f" strokeWidth="0.8" />
            <ellipse cx="52" cy="29" rx="3" ry="1.8" fill="#1c1917" stroke="#78350f" strokeWidth="0.8" />
            <ellipse cx="56" cy="26" rx="3" ry="1.8" fill="#1c1917" stroke="#78350f" strokeWidth="0.8" />
            <line x1="50" y1="66" x2="50" y2="88" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            <ellipse cx="50" cy="89" rx="20" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );

    case 'cerveza':
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(234,179,8,0.35)]">
            <defs>
              <linearGradient id="beerLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* Beer Mug/Glass */}
            <path d="M 28 32 C 30 76 34 84 44 86 L 56 86 C 66 84 70 76 72 32 Z" fill="url(#beerLiq)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
            {/* Frothy Beer Foam Head */}
            <path d="M 24 32 C 24 22 40 22 46 25 C 50 20 64 20 68 25 C 74 22 76 28 76 32 Z" fill="#ffffff" />
            {/* Beer Bubbles */}
            <circle cx="42" cy="65" r="1.8" fill="#ffffff" fillOpacity="0.8" />
            <circle cx="54" cy="55" r="2" fill="#ffffff" fillOpacity="0.7" />
            <circle cx="48" cy="45" r="1.6" fill="#ffffff" fillOpacity="0.9" />
            <line x1="40" y1="88" x2="60" y2="88" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.8" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'mocktail-chicha':
    default:
      return (
        <div className={`relative flex items-center justify-center ${dim} ${className}`}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(147,51,234,0.35)]">
            <defs>
              <linearGradient id="chichaLiq" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#7e22ce" />
                <stop offset="60%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
            <path d="M 20 36 C 20 64 80 64 80 36 Z" fill="url(#chichaLiq)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
            <ellipse cx="50" cy="36" rx="30" ry="6" fill="#f3e8ff" />
            {/* Dehydrated Apple & Cinnamon */}
            <circle cx="48" cy="36" r="3" fill="#a855f7" />
            <line x1="50" y1="62" x2="50" y2="86" stroke="#ffffff" strokeWidth="3" strokeOpacity="0.7" strokeLinecap="round" />
            <ellipse cx="50" cy="87" rx="18" ry="4" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeOpacity="0.8" />
          </svg>
        </div>
      );
  }
};
