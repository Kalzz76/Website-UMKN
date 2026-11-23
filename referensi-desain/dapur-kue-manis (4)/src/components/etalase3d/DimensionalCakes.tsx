import React from 'react';

interface DimensionalCakeProps {
  cakeId: string;
  className?: string;
}

/**
 * Ultra-lightweight 2.5D sculpted dimensional patisserie cakes
 * crafted specifically for Cravely's zoomed-in glass bakery showcase:
 * multi-stop cylindrical shading, glossy glaze specular highlights,
 * cast shadows on gold-rimmed porcelain pedestals, and authentic
 * Chiffon / Birthday Cake silhouettes.
 */
export const DimensionalCake: React.FC<DimensionalCakeProps> = ({ cakeId, className = 'w-56 h-48' }) => {
  return (
    <svg
      viewBox="0 0 260 220"
      className={`${className} overflow-visible select-none`}
      aria-hidden="true"
    >
      <defs>
        {/* Shared Porcelain Pedestal & Brass Rim Gradients */}
        <radialGradient id={`sh-${cakeId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3D2B28" stopOpacity="0.34" />
          <stop offset="65%" stopColor="#3D2B28" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#3D2B28" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`porc-${cakeId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#EAE0D6" />
          <stop offset="28%" stopColor="#FFFFFF" />
          <stop offset="68%" stopColor="#FAF3EB" />
          <stop offset="100%" stopColor="#DDD0C3" />
        </linearGradient>
        <linearGradient id={`gold-${cakeId}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9D7841" />
          <stop offset="32%" stopColor="#EED29E" />
          <stop offset="65%" stopColor="#C49A5D" />
          <stop offset="100%" stopColor="#856230" />
        </linearGradient>
        <linearGradient id={`shine-${cakeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Cake-Specific Volumetric Cylindrical Gradients */}
        <linearGradient id="volPandan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#77A364" />
          <stop offset="28%" stopColor="#B4DC9B" />
          <stop offset="56%" stopColor="#9BC884" />
          <stop offset="84%" stopColor="#7EA96B" />
          <stop offset="100%" stopColor="#618A50" />
        </linearGradient>
        <linearGradient id="volKaya" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF5D1" />
          <stop offset="55%" stopColor="#DAE8AA" />
          <stop offset="100%" stopColor="#BFCF89" />
        </linearGradient>

        <linearGradient id="volChantilly" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E9DDD2" />
          <stop offset="26%" stopColor="#FFFFFF" />
          <stop offset="64%" stopColor="#FFFBF4" />
          <stop offset="100%" stopColor="#E1D2C5" />
        </linearGradient>

        <linearGradient id="volEarlGrey" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#AC8B6D" />
          <stop offset="28%" stopColor="#E3C9B0" />
          <stop offset="62%" stopColor="#CFAF92" />
          <stop offset="100%" stopColor="#99775B" />
        </linearGradient>
        <linearGradient id="volTeaGlaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5E7D7" />
          <stop offset="55%" stopColor="#DFC3A7" />
          <stop offset="100%" stopColor="#BA9270" />
        </linearGradient>

        <linearGradient id="volBlush" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#DF9FB0" />
          <stop offset="28%" stopColor="#FFE1E9" />
          <stop offset="60%" stopColor="#F8C2D0" />
          <stop offset="100%" stopColor="#CE8B9D" />
        </linearGradient>

        <linearGradient id="volRoseCream" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8D7C8" />
          <stop offset="28%" stopColor="#FFFDF9" />
          <stop offset="64%" stopColor="#FDF3E7" />
          <stop offset="100%" stopColor="#DEC8B8" />
        </linearGradient>

        <linearGradient id="volChoco" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#351C14" />
          <stop offset="28%" stopColor="#6D4131" />
          <stop offset="58%" stopColor="#522F22" />
          <stop offset="100%" stopColor="#2C150F" />
        </linearGradient>
        <linearGradient id="volGanache" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#583224" />
          <stop offset="45%" stopColor="#3B1E14" />
          <stop offset="100%" stopColor="#26110B" />
        </linearGradient>

        <linearGradient id="volLemon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#DFC07C" />
          <stop offset="28%" stopColor="#FFF2C7" />
          <stop offset="64%" stopColor="#FBE1A1" />
          <stop offset="100%" stopColor="#CEAC66" />
        </linearGradient>
        <linearGradient id="volRaspGlaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EE6A84" />
          <stop offset="55%" stopColor="#CA3655" />
          <stop offset="100%" stopColor="#9A203B" />
        </linearGradient>
      </defs>

      {/* ==================== GROUNDED CONTACT SHADOW & PORCELAIN PEDESTAL ==================== */}
      <ellipse cx="130" cy="198" rx="96" ry="18" fill={`url(#sh-${cakeId})`} />

      {/* Pedestal Foot */}
      <path
        d="M94 186 L98 197 Q130 205 162 197 L166 186 Z"
        fill={`url(#porc-${cakeId})`}
        stroke="#CDBBA8"
        strokeWidth="1.2"
      />

      {/* Porcelain Plate Rim + Brass Trim */}
      <ellipse
        cx="130"
        cy="182"
        rx="92"
        ry="21"
        fill={`url(#porc-${cakeId})`}
        stroke={`url(#gold-${cakeId})`}
        strokeWidth="3.2"
      />
      <ellipse cx="130" cy="180" rx="81" ry="15.5" fill="#FFFDF8" stroke="#E5D5C4" strokeWidth="1.2" />

      {/* Subtle Lace Doily Rim */}
      <ellipse
        cx="130"
        cy="179"
        rx="74"
        ry="13"
        fill="none"
        stroke="#DFC4BC"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* ==================== 1. PANDAN KAYA CHIFFON CAKE ==================== */}
      {cakeId === 'et-chiffon-pandan' && (
        <g>
          {/* Cast Shadow on Plate */}
          <ellipse cx="130" cy="177" rx="68" ry="12" fill="#4E6E40" opacity="0.24" />
          {/* Tall Fluted Chiffon Cylinder */}
          <path
            d="M66 96 L64 171 A66 14 0 0 0 196 171 L194 96 Z"
            fill="url(#volPandan)"
            stroke="#5D844C"
            strokeWidth="1.4"
          />
          {/* Subtle Vertical Fluted Chiffon Ribs */}
          {[80, 96, 114, 132, 150, 168, 182].map((rx, idx) => (
            <line
              key={rx}
              x1={rx}
              y1={99}
              x2={rx}
              y2={173}
              stroke={idx % 2 === 0 ? '#D4F0BF' : '#658F53'}
              strokeWidth="2.2"
              opacity="0.34"
            />
          ))}
          {/* Rounded Chiffon Top Crown */}
          <ellipse cx="130" cy="96" rx="64" ry="18" fill="#BBE1A4" stroke="#6E995C" strokeWidth="1.2" />
          {/* Iconic Chiffon Central Chimney Hole */}
          <ellipse cx="130" cy="95" rx="20" ry="7.5" fill="#648B53" stroke="#517442" strokeWidth="1.2" />
          <ellipse cx="130" cy="97" rx="14" ry="4.5" fill="#46653A" />

          {/* Glossy Srikaya Kaya Glaze Ring + Drips */}
          <path
            d="M66 96 C66 112 72 126 78 126 C84 126 84 108 92 109 C100 110 100 135 108 135 C115 135 116 114 125 114 C135 114 136 141 144 141 C152 141 153 114 162 113 C170 112 171 130 178 130 C185 130 187 109 194 98 C194 84 164 78 130 78 C96 78 66 84 66 96 Z"
            fill="url(#volKaya)"
            stroke="#B4C67B"
            strokeWidth="1.2"
          />
          {/* Re-open Center Chimney Through Glaze */}
          <ellipse cx="130" cy="93" rx="18" ry="6.5" fill="#5D854C" />
          <ellipse cx="130" cy="95" rx="12" ry="3.8" fill="#426136" />

          {/* Soft Whipped Cream Rosettes & Pandan Leaf Garnish */}
          {[
            [86, 86],
            [110, 77],
            [152, 78],
            [174, 87],
            [102, 102],
            [158, 102],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx}, ${cy})`}>
              <ellipse cx="0" cy="4" rx="11" ry="6.5" fill="#FFFDF8" stroke="#DECBB8" strokeWidth="1" />
              <path d="M-7 2 Q0 -11 7 2 Z" fill="#FFFFFF" stroke="#E5D5C4" strokeWidth="1" />
            </g>
          ))}
          {/* Fresh Pandan Leaf Ribbons */}
          <path d="M138 78 Q154 46 168 56 Q155 68 144 82 Z" fill="#4C8643" stroke="#36622F" strokeWidth="1" />
          <path d="M144 80 Q168 58 178 72 Q160 76 148 84 Z" fill="#63A158" stroke="#36622F" strokeWidth="1" />
          {/* Specular Light Band */}
          <path d="M78 102 L77 166" stroke="url(#shine-et-chiffon-pandan)" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {/* ==================== 2. JAPANESE STRAWBERRY CHIFFON ==================== */}
      {cakeId === 'et-chiffon-strawberry' && (
        <g>
          <ellipse cx="130" cy="177" rx="70" ry="12" fill="#8C665E" opacity="0.22" />
          {/* Tall Cloud-Soft Ivory Chantilly Chiffon Body */}
          <path
            d="M62 94 L62 171 A68 14 0 0 0 198 171 L198 94 Z"
            fill="url(#volChantilly)"
            stroke="#D6C4B5"
            strokeWidth="1.4"
          />
          {/* Subtle Peeking Sponge & Strawberry Jam Mid-Layer */}
          <path
            d="M62 132 A68 13 0 0 0 198 132 L198 144 A68 13 0 0 1 62 144 Z"
            fill="#F9DFB8"
            opacity="0.72"
          />
          <path
            d="M62 137 A68 13 0 0 0 198 137 L198 141 A68 13 0 0 1 62 141 Z"
            fill="#DC455E"
            opacity="0.78"
          />
          {/* Top Chantilly Dome */}
          <ellipse cx="130" cy="94" rx="68" ry="19" fill="#FFFFFF" stroke="#E2D2C4" strokeWidth="1.2" />

          {/* Whipped Cream Swirls Around Rim */}
          {[74, 92, 112, 130, 148, 168, 186].map((cx, i) => {
            const cy = 92 + (i === 0 || i === 6 ? 8 : i === 1 || i === 5 ? 12 : 14);
            return (
              <g key={cx} transform={`translate(${cx}, ${cy})`}>
                <ellipse cx="0" cy="3" rx="11.5" ry="6.5" fill="#FFFDF9" stroke="#E3D4C7" strokeWidth="1" />
                <path d="M-7 1 Q0 -11 7 1 Z" fill="#FFFFFF" stroke="#E6D8CC" strokeWidth="0.9" />
              </g>
            );
          })}

          {/* Plump Glossy Lembang Strawberries Crown */}
          {[
            [86, 86, -12, 0.92],
            [110, 77, -5, 1.0],
            [150, 77, 6, 1.0],
            [174, 86, 14, 0.92],
            [130, 88, 0, 1.15],
          ].map(([cx, cy, rot, sc], i) => (
            <g key={i} transform={`translate(${cx}, ${cy}) rotate(${rot}) scale(${sc})`}>
              <path
                d="M-11 -4 C-12 9 -5 16 0 18 C5 16 12 9 11 -4 C10 -12 -10 -12 -11 -4 Z"
                fill="#D42A42"
                stroke="#921A2B"
                strokeWidth="1.2"
              />
              {/* Glossy Berry Highlight */}
              <ellipse cx="-4" cy="0" rx="2.5" ry="5.5" fill="#FF92A1" opacity="0.65" />
              {/* Green Calyx Leaf */}
              <path d="M-9 -8 L-3 -13 L0 -7 L3 -13 L9 -8 L0 -5 Z" fill="#5A8749" />
            </g>
          ))}
          <path d="M76 106 L76 164" stroke="url(#shine-et-chiffon-strawberry)" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
        </g>
      )}

      {/* ==================== 3. EARL GREY MILK TEA CHIFFON ==================== */}
      {cakeId === 'et-chiffon-earlgrey' && (
        <g>
          <ellipse cx="130" cy="177" rx="68" ry="12" fill="#6D4E3A" opacity="0.24" />
          {/* Warm Bergamot Milk-Tea Chiffon Cylinder */}
          <path
            d="M66 96 L64 171 A66 14 0 0 0 196 171 L194 96 Z"
            fill="url(#volEarlGrey)"
            stroke="#8B6B50"
            strokeWidth="1.4"
          />
          {/* Subtle Tea Flecks & Flutes */}
          {[82, 100, 118, 136, 154, 174].map((rx, idx) => (
            <line
              key={rx}
              x1={rx}
              y1={100}
              x2={rx}
              y2={172}
              stroke={idx % 2 === 0 ? '#F2DFC9' : '#7E5E45'}
              strokeWidth="2"
              opacity="0.3"
            />
          ))}
          {/* Milk Tea Caramel Glaze Crown & Drips */}
          <path
            d="M66 96 C66 112 73 129 80 129 C86 129 88 109 96 109 C105 109 106 138 114 138 C122 138 123 114 132 114 C142 114 143 132 151 132 C159 132 160 112 169 112 C177 112 178 126 185 126 C191 126 194 108 194 96 C194 82 164 76 130 76 C96 76 66 82 66 96 Z"
            fill="url(#volTeaGlaze)"
            stroke="#AA8462"
            strokeWidth="1.2"
          />
          {/* Milk Tea Cream Tufts & Dried Rose Petals */}
          {[
            [86, 86],
            [108, 78],
            [130, 75],
            [152, 78],
            [174, 86],
            [118, 96],
            [144, 96],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx}, ${cy})`}>
              <ellipse cx="0" cy="4" rx="10.5" ry="6" fill="#F9EFE3" stroke="#CFAF92" strokeWidth="1" />
              <path d="M-6.5 2 Q0 -10 6.5 2 Z" fill="#FFF9F1" stroke="#D5B99E" strokeWidth="0.9" />
            </g>
          ))}
          {/* Dried Rose Petals & Edible Gold Leaf */}
          <ellipse cx="104" cy="92" rx="6" ry="3" transform="rotate(-18 104 92)" fill="#C65F72" />
          <ellipse cx="154" cy="90" rx="6" ry="3" transform="rotate(22 154 90)" fill="#C65F72" />
          <polygon points="126,82 135,79 138,87 128,89" fill="#E9C373" stroke="#B68B38" strokeWidth="0.8" />
          <path d="M78 104 L77 166" stroke="url(#shine-et-chiffon-earlgrey)" strokeWidth="7" strokeLinecap="round" opacity="0.45" />
        </g>
      )}

      {/* ==================== 4. VINTAGE COQUETTE BIRTHDAY CAKE ==================== */}
      {cakeId === 'et-ultah-coquette' && (
        <g>
          <ellipse cx="130" cy="177" rx="72" ry="13" fill="#8C5361" opacity="0.22" />
          {/* Bottom Tier */}
          <path
            d="M60 116 L60 172 A70 14 0 0 0 200 172 L200 116 Z"
            fill="url(#volBlush)"
            stroke="#C9889B"
            strokeWidth="1.4"
          />
          <ellipse cx="130" cy="116" rx="70" ry="17" fill="#FFE6EE" stroke="#D799AA" strokeWidth="1.2" />

          {/* Lambeth Piped Pearl Swags on Bottom Tier */}
          <path
            d="M62 128 Q84 150 107 132 Q130 152 153 132 Q176 150 198 128"
            fill="none"
            stroke="#FFFDF9"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Bottom Shell Piping Trim */}
          {[68, 82, 96, 110, 124, 138, 152, 166, 180, 192].map((cx) => (
            <circle key={cx} cx={cx} cy={175} r="5.5" fill="#FFFDF9" stroke="#E5C8CF" strokeWidth="1" />
          ))}

          {/* Upper Tier */}
          <path
            d="M84 74 L84 114 A46 11 0 0 0 176 114 L176 74 Z"
            fill="url(#volBlush)"
            stroke="#C9889B"
            strokeWidth="1.4"
          />
          <ellipse cx="130" cy="74" rx="46" ry="12" fill="#FFECF2" stroke="#D799AA" strokeWidth="1.2" />

          {/* Upper Rim Shell Piping */}
          {[90, 102, 114, 126, 138, 150, 162, 170].map((cx) => (
            <circle key={cx} cx={cx} cy={79} r="4.5" fill="#FFFDF9" stroke="#E5C8CF" strokeWidth="0.9" />
          ))}

          {/* Signature Satin Pink Bows */}
          {[
            [107, 134, 0.95],
            [153, 134, 0.95],
            [130, 106, 0.85],
          ].map(([bx, by, sc], i) => (
            <g key={i} transform={`translate(${bx}, ${by}) scale(${sc})`}>
              <path d="M0 0 C-10 -8 -17 -2 -11 4 C-7 7 -2 3 0 0 Z" fill="#D54D67" stroke="#962A40" strokeWidth="1.1" />
              <path d="M0 0 C10 -8 17 -2 11 4 C7 7 2 3 0 0 Z" fill="#D54D67" stroke="#962A40" strokeWidth="1.1" />
              <path d="M-2 2 L-7 14 M2 2 L7 14" stroke="#B63750" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="0" cy="0" r="3.2" fill="#F9C5D1" stroke="#962A40" strokeWidth="1" />
            </g>
          ))}

          {/* Top Strawberries & Glowing Gold Birthday Candle */}
          {[104, 156].map((sx) => (
            <g key={sx} transform={`translate(${sx}, 68) scale(0.75)`}>
              <path d="M-9 -3 C-10 8 -4 14 0 16 C4 14 10 8 9 -3 Z" fill="#D42A42" />
              <path d="M-7 -6 L0 -10 L7 -6 Z" fill="#5B8849" />
            </g>
          ))}
          <rect x="126.5" y="34" width="7" height="36" rx="3" fill={`url(#gold-${cakeId})`} stroke="#9C753B" strokeWidth="1" />
          <ellipse cx="130" cy="24" rx="5.5" ry="9" fill="#FFCA58" />
          <ellipse cx="130" cy="25" rx="2.8" ry="5" fill="#FFF8DC" />
        </g>
      )}

      {/* ==================== 5. THE ROSE GARDEN BIRTHDAY ==================== */}
      {cakeId === 'et-ultah-rosegarden' && (
        <g>
          <ellipse cx="130" cy="177" rx="70" ry="12" fill="#8C645E" opacity="0.22" />
          <path
            d="M62 96 L62 171 A68 14 0 0 0 198 171 L198 96 Z"
            fill="url(#volRoseCream)"
            stroke="#D1B9A8"
            strokeWidth="1.4"
          />
          <ellipse cx="130" cy="96" rx="68" ry="18" fill="#FFFBF5" stroke="#DEC9B8" strokeWidth="1.2" />

          {/* Satin Pink Ribbon Wrap Around Lower Base */}
          <path
            d="M62 150 A68 13 0 0 0 198 150 L198 164 A68 13 0 0 1 62 164 Z"
            fill="#D87689"
            stroke="#A84A5E"
            strokeWidth="1.1"
          />
          {/* Center Satin Bow on Ribbon */}
          <g transform="translate(130, 163) scale(1.15)">
            <path d="M0 0 C-12 -8 -20 -1 -12 5 C-8 8 -2 3 0 0 Z" fill="#E88C9F" stroke="#9E3B42" strokeWidth="1.2" />
            <path d="M0 0 C12 -8 20 -1 12 5 C8 8 2 3 0 0 Z" fill="#E88C9F" stroke="#9E3B42" strokeWidth="1.2" />
            <path d="M-2 2 L-8 15 M2 2 L8 15" stroke="#B6495B" strokeWidth="2.8" strokeLinecap="round" />
            <circle cx="0" cy="0" r="3.6" fill="#FCE0E7" stroke="#9E3B42" strokeWidth="1.1" />
          </g>

          {/* Sculpted Buttercream Roses Bouquet on Top */}
          {[
            [88, 92, '#EE93A6', 0.95],
            [110, 82, '#F7BCCB', 1.05],
            [150, 82, '#E0748B', 1.05],
            [172, 92, '#F5B0C0', 0.95],
            [130, 88, '#D25770', 1.2],
          ].map(([rx, ry, col, sc], idx) => (
            <g key={idx} transform={`translate(${rx}, ${ry}) scale(${sc})`}>
              <ellipse cx="-10" cy="6" rx="8" ry="4" transform="rotate(-24 -10 6)" fill="#7A9A6B" />
              <ellipse cx="10" cy="6" rx="8" ry="4" transform="rotate(24 10 6)" fill="#7A9A6B" />
              <circle cx="0" cy="0" r="13" fill={col as string} stroke="#A8465B" strokeWidth="1.1" />
              <path
                d="M-6 -2 C-5 -8 6 -8 6 -1 C6 5 -3 7 -5 2 C-6 -1 0 -4 3 -1"
                fill="none"
                stroke="#FFF5F7"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
          ))}
          <path d="M76 106 L76 146" stroke="url(#shine-et-ultah-rosegarden)" strokeWidth="7" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {/* ==================== 6. PINK ROSE CHOCOLATE CAKE ==================== */}
      {cakeId === 'et-ultah-pinkchoc' && (
        <g>
          <ellipse cx="130" cy="177" rx="70" ry="12" fill="#2A150F" opacity="0.28" />
          <path
            d="M62 96 L62 171 A68 14 0 0 0 198 171 L198 96 Z"
            fill="url(#volChoco)"
            stroke="#2B150E"
            strokeWidth="1.4"
          />
          {/* Glossy Belgian Ganache Cap + Drips */}
          <path
            d="M62 96 C62 114 69 135 76 135 C83 135 84 111 93 111 C102 111 103 144 111 144 C119 144 121 115 130 115 C140 115 141 138 149 138 C157 138 159 113 168 113 C176 113 177 130 185 130 C192 130 198 110 198 96 C198 81 167 75 130 75 C93 75 62 81 62 96 Z"
            fill="url(#volGanache)"
            stroke="#26110A"
            strokeWidth="1.2"
          />
          {/* Blush Rose Buttercream Swirls + Ruby Raspberries */}
          {[
            [82, 89],
            [106, 80],
            [130, 77],
            [154, 80],
            [178, 89],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx}, ${cy})`}>
              <ellipse cx="0" cy="4" rx="12" ry="6.8" fill="#F5B4C5" stroke="#C87D90" strokeWidth="1" />
              <path d="M-7.5 2 Q0 -11 7.5 2 Z" fill="#FAD2DD" stroke="#D28C9E" strokeWidth="0.9" />
            </g>
          ))}
          {[96, 120, 142, 164].map((bx, i) => (
            <g key={bx} transform={`translate(${bx}, ${93 + (i % 2) * 3})`}>
              <circle cx="0" cy="0" r="6.5" fill="#BE2745" stroke="#7E162B" strokeWidth="1" />
              <circle cx="-2" cy="-2" r="2" fill="#FF8FA3" opacity="0.65" />
            </g>
          ))}
          <path d="M76 106 L76 164" stroke="url(#shine-et-ultah-pinkchoc)" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        </g>
      )}

      {/* ==================== 7. RASPBERRY LEMONADE CAKE ==================== */}
      {cakeId === 'et-ultah-raspberry' && (
        <g>
          <ellipse cx="130" cy="177" rx="70" ry="12" fill="#8C6D38" opacity="0.22" />
          <path
            d="M62 98 L62 171 A68 14 0 0 0 198 171 L198 98 Z"
            fill="url(#volLemon)"
            stroke="#C39E58"
            strokeWidth="1.4"
          />
          {/* Glossy Raspberry Glaze Top & Drips */}
          <path
            d="M62 98 C62 114 70 132 77 132 C84 132 86 112 95 112 C104 112 105 138 113 138 C121 138 122 115 131 115 C140 115 142 135 150 135 C158 135 160 114 169 114 C177 114 179 128 186 128 C193 128 198 110 198 98 C198 83 167 77 130 77 C93 77 62 83 62 98 Z"
            fill="url(#volRaspGlaze)"
            stroke="#9E2440"
            strokeWidth="1.2"
          />
          {/* Fresh Lemon Slices */}
          {[
            [92, 82, -24],
            [168, 82, 24],
          ].map(([lx, ly, rot], i) => (
            <g key={i} transform={`translate(${lx}, ${ly}) rotate(${rot})`}>
              <circle cx="0" cy="0" r="14" fill="#F9D54E" stroke="#E0AE24" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="11" fill="#FFF7D4" />
              <circle cx="0" cy="0" r="9.2" fill="#FCE27A" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#FFF7D4" strokeWidth="1.4" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#FFF7D4" strokeWidth="1.4" />
            </g>
          ))}
          {/* Plump Raspberries & Center Cream Swirl */}
          <g transform="translate(130, 84)">
            <ellipse cx="0" cy="5" rx="15" ry="8" fill="#FFFDF8" stroke="#DECBB8" strokeWidth="1" />
            <path d="M-9 2 Q0 -14 9 2 Z" fill="#FFFFFF" stroke="#E5D5C4" strokeWidth="1" />
          </g>
          {[108, 122, 138, 152, 130].map((bx, i) => (
            <g key={i} transform={`translate(${bx}, ${i === 4 ? 95 : 89})`}>
              <circle cx="0" cy="0" r="6.8" fill="#C42548" stroke="#85152F" strokeWidth="1" />
              <circle cx="-2" cy="-2" r="2.2" fill="#FF98AE" opacity="0.7" />
            </g>
          ))}
          <path d="M76 106 L76 164" stroke="url(#shine-et-ultah-raspberry)" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
    </svg>
  );
};
