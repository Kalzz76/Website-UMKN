import React from 'react';
import type { DessertIllustType } from '../data/patisserieData';

interface DessertIllustrationProps {
  tipe: DessertIllustType;
  className?: string;
}

export const DessertIllustration: React.FC<DessertIllustrationProps> = ({
  tipe,
  className = 'w-24 h-24 mx-auto',
}) => {
  switch (tipe) {
    case 'cupcake-straw':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <ellipse cx="60" cy="106" rx="28" ry="5" fill="#E8D6D0" opacity="0.65" />
          <polygon points="36,66 84,66 76,104 44,104" fill="#A36361" />
          <line x1="48" y1="66" x2="51" y2="104" stroke="#854846" strokeWidth="2" />
          <line x1="60" y1="66" x2="60" y2="104" stroke="#854846" strokeWidth="2" />
          <line x1="72" y1="66" x2="69" y2="104" stroke="#854846" strokeWidth="2" />
          <path
            d="M30,66 Q30,44 60,44 Q90,44 90,66 Q75,72 60,66 Q45,72 30,66 Z"
            fill="#FDF5E7"
            stroke="#E5CFC6"
            strokeWidth="1.6"
          />
          <path d="M40,56 Q60,44 80,56" fill="none" stroke="#F1DBD0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="36" r="11" fill="#B23A48" />
          <path d="M53,35 Q60,28 67,35" fill="none" stroke="#F6C8CF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="56" cy="32" r="2.2" fill="#FFFDF9" opacity="0.85" />
          <circle cx="43" cy="54" r="2" fill="#D96B91" />
          <circle cx="77" cy="54" r="2" fill="#D96B91" />
        </svg>
      );

    case 'cupcake-apple':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <ellipse cx="60" cy="106" rx="28" ry="5" fill="#E8D6D0" opacity="0.65" />
          <polygon points="36,66 84,66 76,104 44,104" fill="#C49A76" />
          <line x1="48" y1="66" x2="51" y2="104" stroke="#A87E5B" strokeWidth="1.8" />
          <line x1="60" y1="66" x2="60" y2="104" stroke="#A87E5B" strokeWidth="1.8" />
          <line x1="72" y1="66" x2="69" y2="104" stroke="#A87E5B" strokeWidth="1.8" />
          <path d="M32,66 Q34,42 60,42 Q86,42 88,66 Z" fill="#F7E4CE" stroke="#E5CBAE" strokeWidth="1.5" />
          <circle cx="60" cy="44" r="14" fill="#E5987E" />
          <path
            d="M52,44 A8,8 0 1,1 68,44 A6,6 0 1,1 55,44"
            fill="none"
            stroke="#FDF5E7"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M68,32 Q76,26 78,34 Q72,38 68,32 Z" fill="#8EA17B" />
        </svg>
      );

    case 'cupcake-mint':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <ellipse cx="60" cy="106" rx="28" ry="5" fill="#E8D6D0" opacity="0.65" />
          <polygon points="36,66 84,66 76,104 44,104" fill="#6B4A3E" />
          <line x1="48" y1="66" x2="51" y2="104" stroke="#53372D" strokeWidth="1.8" />
          <line x1="60" y1="66" x2="60" y2="104" stroke="#53372D" strokeWidth="1.8" />
          <line x1="72" y1="66" x2="69" y2="104" stroke="#53372D" strokeWidth="1.8" />
          <path d="M32,66 Q34,40 60,40 Q86,40 88,66 Z" fill="#9E3B42" />
          <path d="M38,62 Q48,46 60,56 Q72,46 82,62 Z" fill="#FFFDF9" />
          <circle cx="60" cy="36" r="10" fill="#B23A48" />
          <circle cx="57" cy="33" r="2.2" fill="#FFFDF9" opacity="0.8" />
        </svg>
      );

    case 'cupcake-peach':
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <ellipse cx="60" cy="106" rx="28" ry="5" fill="#E8D6D0" opacity="0.65" />
          <polygon points="36,66 84,66 76,104 44,104" fill="#D8B692" />
          <line x1="48" y1="66" x2="51" y2="104" stroke="#BC9874" strokeWidth="1.8" />
          <line x1="60" y1="66" x2="60" y2="104" stroke="#BC9874" strokeWidth="1.8" />
          <line x1="72" y1="66" x2="69" y2="104" stroke="#BC9874" strokeWidth="1.8" />
          <path d="M31,66 Q33,40 60,40 Q87,40 89,66 Z" fill="#F6D5CE" />
          <circle cx="60" cy="44" r="13" fill="#EFA7B8" />
          <path d="M53,44 Q60,36 67,44" fill="none" stroke="#FFFDF9" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="46" cy="57" r="2" fill="#FFFDF9" />
          <circle cx="74" cy="57" r="2" fill="#FFFDF9" />
        </svg>
      );

    case 'cake-raspberry':
      return (
        <svg viewBox="0 0 160 115" className={className} aria-hidden="true">
          <ellipse cx="80" cy="96" rx="64" ry="12" fill="#E8D6D0" />
          <path d="M26 52 L26 84 A54 12 0 0 0 134 84 L134 52 Z" fill="#F6D5CE" />
          <ellipse cx="80" cy="52" rx="54" ry="12" fill="#FDF5E7" stroke="#EAD4CA" strokeWidth="1.5" />
          <polygon points="80,52 126,60 126,86 80,82" fill="#E5989B" opacity="0.85" />
          <path
            d="M30,58 Q40,68 50,58 Q60,68 70,58 Q80,68 90,58 Q100,68 110,58 Q120,68 130,58"
            fill="none"
            stroke="#FFFDF9"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="58" cy="46" r="7" fill="#9E3B42" />
          <circle cx="74" cy="43" r="8" fill="#B23A48" />
          <circle cx="92" cy="45" r="7" fill="#9E3B42" />
          <circle cx="106" cy="49" r="6.5" fill="#B23A48" />
          <circle cx="71" cy="40" r="2" fill="#FFFDF9" opacity="0.8" />
        </svg>
      );

    case 'cake-pinkchoc':
      return (
        <svg viewBox="0 0 160 115" className={className} aria-hidden="true">
          <ellipse cx="80" cy="96" rx="64" ry="12" fill="#E8D6D0" />
          <path d="M26 50 L26 84 A54 12 0 0 0 134 84 L134 50 Z" fill="#6B4A3E" />
          <path d="M26 64 A54 11 0 0 0 134 64 L134 70 A54 11 0 0 1 26 70 Z" fill="#EFA7B8" />
          <ellipse cx="80" cy="50" rx="54" ry="12" fill="#F1DBD0" />
          <circle cx="62" cy="46" r="6.5" fill="#EFA7B8" />
          <circle cx="80" cy="43" r="9" fill="#D3A29D" />
          <circle cx="98" cy="46" r="6.5" fill="#EFA7B8" />
          <path d="M75,42 Q80,36 85,42" fill="none" stroke="#FFFDF9" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    case 'cake-rosegarden':
      return (
        <svg viewBox="0 0 160 115" className={className} aria-hidden="true">
          <ellipse cx="80" cy="96" rx="64" ry="12" fill="#E8D6D0" />
          <path
            d="M26 52 L26 84 A54 12 0 0 0 134 84 L134 52 Z"
            fill="#FFFDF9"
            stroke="#E8D6D0"
            strokeWidth="1.5"
          />
          <ellipse cx="80" cy="52" rx="54" ry="12" fill="#FDF5E7" stroke="#E8D6D0" strokeWidth="1.2" />
          <circle cx="46" cy="68" r="2.6" fill="#B23A48" />
          <circle cx="64" cy="76" r="2.6" fill="#EFA7B8" />
          <circle cx="86" cy="70" r="2.6" fill="#B23A48" />
          <circle cx="106" cy="74" r="2.6" fill="#EFA7B8" />
          <circle cx="62" cy="48" r="6" fill="#B23A48" />
          <circle cx="82" cy="45" r="7.5" fill="#D96B91" />
          <circle cx="102" cy="49" r="6" fill="#B23A48" />
          <path d="M72,46 Q68,38 75,39" fill="none" stroke="#8EA17B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M91,46 Q96,38 90,39" fill="none" stroke="#8EA17B" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'donuts':
      return (
        <svg viewBox="0 0 150 110" className={className} aria-hidden="true">
          <ellipse cx="75" cy="94" rx="52" ry="8" fill="#E8D6D0" opacity="0.65" />
          <ellipse cx="94" cy="64" rx="34" ry="24" fill="#E5C09B" />
          <ellipse cx="94" cy="60" rx="34" ry="21" fill="#F6D5CE" />
          <ellipse cx="94" cy="60" rx="11" ry="7" fill="#FFFDF9" />
          <circle cx="80" cy="52" r="2" fill="#FFFFFF" />
          <circle cx="108" cy="54" r="2" fill="#9E3B42" />
          <ellipse cx="56" cy="72" rx="34" ry="24" fill="#D49A6A" />
          <ellipse cx="56" cy="68" rx="34" ry="21" fill="#A33B46" />
          <ellipse cx="56" cy="68" rx="11" ry="7" fill="#FFFDF9" />
          <circle cx="42" cy="62" r="2.2" fill="#F6D5CE" />
          <circle cx="68" cy="61" r="2.2" fill="#FDF5E7" />
        </svg>
      );

    case 'bananasplit':
      return (
        <svg viewBox="0 0 160 115" className={className} aria-hidden="true">
          <ellipse cx="80" cy="100" rx="56" ry="7" fill="#E8D6D0" opacity="0.6" />
          <path
            d="M24 68 Q80 96 136 68 Q126 98 80 98 Q34 98 24 68 Z"
            fill="#F1DBD0"
            stroke="#D3A29D"
            strokeWidth="1.5"
          />
          <path d="M32 62 Q44 38 66 56" fill="#F7D97E" />
          <path d="M128 62 Q116 38 94 56" fill="#F7D97E" />
          <circle cx="56" cy="62" r="15" fill="#FDF5E7" />
          <circle cx="80" cy="58" r="16" fill="#F6C5CE" />
          <circle cx="104" cy="62" r="15" fill="#FDF5E7" />
          <circle cx="56" cy="46" r="5" fill="#B23A48" />
          <circle cx="80" cy="41" r="5.5" fill="#B23A48" />
          <circle cx="104" cy="46" r="5" fill="#B23A48" />
          <circle cx="78" cy="39" r="1.6" fill="#FFFDF9" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
          <ellipse cx="60" cy="110" rx="26" ry="5" fill="#E8D6D0" opacity="0.65" />
          <path
            d="M38 46 H82 L72 94 Q60 102 48 94 Z"
            fill="#F6D5CE"
            stroke="#D3A29D"
            strokeWidth="2"
          />
          <path
            d="M42 56 L76 68 L46 80 L72 90"
            fill="none"
            stroke="#A33B46"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M38 46 Q60 22 82 46 Z" fill="#FFFDF9" />
          <circle cx="60" cy="28" r="6.5" fill="#B23A48" />
          <circle cx="58" cy="26" r="1.8" fill="#FFFDF9" />
          <rect x="56" y="96" width="8" height="10" fill="#D3A29D" />
          <ellipse cx="60" cy="108" rx="22" ry="5" fill="#F1DBD0" />
        </svg>
      );
  }
};

interface CoquetteRibbonCardProps {
  children: React.ReactNode;
  variant?: 'menu' | 'cart';
  className?: string;
}

/**
 * Signature Coquette Double-Wavy Ribbon Border Card with a Satin Bow Knot on top.
 * Used uniformly on both the Desserts Menu cards and the Kasir order cards.
 */
export const CoquetteRibbonCard: React.FC<CoquetteRibbonCardProps> = ({
  children,
  variant = 'menu',
  className = '',
}) => {
  const isMenu = variant === 'menu';

  return (
    <div
      className={`kartu-pita-coquette group ${
        isMenu ? 'pt-8 pb-5 px-4 sm:px-5' : 'pt-7 pb-5 px-5 sm:px-6'
      } ${className}`}
    >
      {/* Top Satin Coquette Bow Knot */}
      <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-[#FFFDF9] px-2 rounded-full">
        <svg
          viewBox="0 0 120 46"
          className={`ribbon-bow-hover overflow-visible ${isMenu ? 'w-20 h-8' : 'w-24 h-9'}`}
          aria-hidden="true"
        >
          {/* Soft Blush Ribbon Fill */}
          <path
            d="M60 12 C42 -2 18 4 24 20 C29 31 48 21 60 12 Z"
            fill="#F9E5E3"
            stroke="#9E3B42"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M60 12 C45 3 26 7 30 18 C34 26 49 19 60 12 Z"
            fill="none"
            stroke="#D3A29D"
            strokeWidth="1.2"
          />
          <path
            d="M60 12 C78 -2 102 4 96 20 C91 31 72 21 60 12 Z"
            fill="#F9E5E3"
            stroke="#9E3B42"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <path
            d="M60 12 C75 3 94 7 90 18 C86 26 71 19 60 12 Z"
            fill="none"
            stroke="#D3A29D"
            strokeWidth="1.2"
          />
          {/* Flowing Ribbon Tails */}
          <path
            d="M57 15 Q44 30 28 38 Q35 42 44 34 Q53 26 59 16"
            fill="none"
            stroke="#9E3B42"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M63 15 Q76 30 92 38 Q85 42 76 34 Q67 26 61 16"
            fill="none"
            stroke="#9E3B42"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Center Pearl Knot */}
          <circle cx="60" cy="12" r="4.3" fill="#FFFDF9" stroke="#9E3B42" strokeWidth="2.3" />
          <circle cx="60" cy="12" r="1.6" fill="#EFA7B8" />
        </svg>
      </div>

      {/* Double Wavy Coquette Frame */}
      {isMenu ? (
        <svg
          viewBox="0 0 260 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
          aria-hidden="true"
        >
          <path
            d="M16,12 Q42,6 68,12 T120,12 T172,12 T244,12 Q252,12 252,22 Q256,56 252,92 T252,162 T252,232 T252,298 Q252,308 242,308 Q208,314 174,308 T108,308 T18,308 Q8,308 8,298 Q4,264 8,228 T8,158 T8,88 T8,22 Q8,12 16,12 Z"
            fill="none"
            stroke="#9E3B42"
            strokeWidth="2.1"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M21,17 Q46,12 70,17 T122,17 T174,17 T239,17 Q247,17 247,26 Q250,58 247,92 T247,162 T247,232 T247,294 Q247,303 238,303 Q206,308 174,303 T108,303 T22,303 Q13,303 13,294 Q10,262 13,228 T13,158 T13,88 T13,26 Q13,17 21,17 Z"
            fill="none"
            stroke="#D3A29D"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 400 130"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
          aria-hidden="true"
        >
          <path
            d="M18,12 Q45,6 75,12 T135,12 T195,12 T255,12 T315,12 T382,12 Q392,12 392,24 Q396,45 392,65 T392,106 Q392,118 380,118 Q345,124 310,118 T240,118 T170,118 T100,118 T20,118 Q8,118 8,106 Q4,85 8,65 T8,24 Q8,12 18,12 Z"
            fill="none"
            stroke="#9E3B42"
            strokeWidth="2.2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M22,16 Q48,11 76,16 T136,16 T196,16 T256,16 T316,16 T378,16 Q387,16 387,26 Q391,46 387,65 T387,104 Q387,114 377,114 Q344,119 310,114 T240,114 T170,114 T100,114 T23,114 Q13,114 13,104 Q9,84 13,65 T13,26 Q13,16 22,16 Z"
            fill="none"
            stroke="#D3A29D"
            strokeWidth="1.3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* Inner Content */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};
