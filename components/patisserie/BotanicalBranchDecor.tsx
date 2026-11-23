import React from "react";

interface BotanicalBranchProps {
  className?: string;
  color?: string;
  opacity?: number;
}

/**
 * Realistic Botanical Branch with pointed lanceolate leaves, central midribs, and delicate veins
 * Styled to match the vintage patisserie aesthetic in the design reference.
 */

export const BotanicalTopLeft: React.FC<BotanicalBranchProps> = ({
  className = "w-44 sm:w-56 lg:w-68 h-auto",
  color = "#8A675C",
  opacity = 0.55,
}) => (
  <svg
    viewBox="0 0 260 180"
    className={className}
    fill="none"
    style={{ opacity }}
    aria-hidden="true"
  >
    {/* Main curving stem */}
    <path
      d="M -10,-10 C 35,25 90,65 160,118"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* Secondary stem twig */}
    <path
      d="M 65,48 C 85,38 115,35 140,42"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
    />

    {/* ===== LEAVES ON MAIN STEM ===== */}

    {/* Leaf 1 (Lower left, pointing downwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 32,24 C 20,40 28,62 48,72 C 54,54 46,34 32,24 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      {/* Midrib */}
      <path d="M 32,24 Q 38,46 48,72" strokeWidth="0.9" />
      {/* Side veins */}
      <path d="M 36,36 Q 30,44 26,48" strokeWidth="0.7" opacity="0.65" />
      <path d="M 40,46 Q 46,50 51,54" strokeWidth="0.7" opacity="0.65" />
      <path d="M 43,56 Q 38,62 35,66" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 2 (Upper left, pointing upwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 40,28 C 48,12 68,6 84,14 C 74,26 58,34 40,28 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 40,28 Q 60,20 84,14" strokeWidth="0.9" />
      <path d="M 52,24 Q 56,16 62,13" strokeWidth="0.7" opacity="0.65" />
      <path d="M 64,21 Q 66,27 68,31" strokeWidth="0.7" opacity="0.65" />
      <path d="M 72,18 Q 76,13 80,11" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 3 on secondary twig (pointing upper right) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 95,40 C 104,24 125,20 142,26 C 132,38 116,46 95,40 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 95,40 Q 118,32 142,26" strokeWidth="0.9" />
      <path d="M 110,36 Q 115,28 122,25" strokeWidth="0.7" opacity="0.65" />
      <path d="M 124,32 Q 126,38 129,42" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 4 on secondary twig tip */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 140,42 C 154,34 174,38 186,52 C 170,58 152,54 140,42 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 140,42 Q 162,46 186,52" strokeWidth="0.9" />
      <path d="M 152,44 Q 158,39 165,38" strokeWidth="0.7" opacity="0.65" />
      <path d="M 166,48 Q 168,54 171,57" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 5 (Lower middle, pointing downwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 88,64 C 80,82 90,104 110,114 C 114,94 104,74 88,64 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 88,64 Q 96,88 110,114" strokeWidth="0.9" />
      <path d="M 92,76 Q 86,84 82,90" strokeWidth="0.7" opacity="0.65" />
      <path d="M 98,88 Q 104,92 108,96" strokeWidth="0.7" opacity="0.65" />
      <path d="M 103,100 Q 98,106 94,110" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 6 (Upper middle, pointing outwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 112,82 C 124,68 146,65 162,75 C 150,88 132,94 112,82 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 112,82 Q 136,78 162,75" strokeWidth="0.9" />
      <path d="M 126,80 Q 132,73 138,70" strokeWidth="0.7" opacity="0.65" />
      <path d="M 142,78 Q 144,85 147,89" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 7 (Terminal leaf pair 1) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 140,104 C 138,124 150,144 170,152 C 170,132 158,114 140,104 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 140,104 Q 152,128 170,152" strokeWidth="0.9" />
      <path d="M 146,116 Q 140,123 137,128" strokeWidth="0.7" opacity="0.65" />
      <path d="M 154,128 Q 160,132 165,135" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 8 (Terminal leaf at tip) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 160,118 C 176,112 198,120 210,136 C 192,142 174,136 160,118 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 160,118 Q 185,126 210,136" strokeWidth="0.9" />
      <path d="M 174,122 Q 180,117 186,115" strokeWidth="0.7" opacity="0.65" />
      <path d="M 188,128 Q 190,134 193,138" strokeWidth="0.7" opacity="0.65" />
    </g>
  </svg>
);

export const BotanicalTopRight: React.FC<BotanicalBranchProps> = ({
  className = "w-44 sm:w-56 lg:w-68 h-auto",
  color = "#8A675C",
  opacity = 0.55,
}) => (
  <svg
    viewBox="0 0 260 180"
    className={className}
    fill="none"
    style={{ opacity }}
    aria-hidden="true"
  >
    {/* Main curving stem from top-right towards bottom-left */}
    <path
      d="M 270,-10 C 225,25 170,65 100,118"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    {/* Secondary stem twig */}
    <path
      d="M 195,48 C 175,38 145,35 120,42"
      stroke={color}
      strokeWidth="1.1"
      strokeLinecap="round"
    />

    {/* ===== LEAVES ON MAIN STEM ===== */}

    {/* Leaf 1 (Lower right, pointing downwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 228,24 C 240,40 232,62 212,72 C 206,54 214,34 228,24 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 228,24 Q 222,46 212,72" strokeWidth="0.9" />
      <path d="M 224,36 Q 230,44 234,48" strokeWidth="0.7" opacity="0.65" />
      <path d="M 220,46 Q 214,50 209,54" strokeWidth="0.7" opacity="0.65" />
      <path d="M 217,56 Q 222,62 225,66" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 2 (Upper right, pointing upwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 220,28 C 212,12 192,6 176,14 C 186,26 202,34 220,28 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 220,28 Q 200,20 176,14" strokeWidth="0.9" />
      <path d="M 208,24 Q 204,16 198,13" strokeWidth="0.7" opacity="0.65" />
      <path d="M 196,21 Q 194,27 192,31" strokeWidth="0.7" opacity="0.65" />
      <path d="M 188,18 Q 184,13 180,11" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 3 on secondary twig (pointing upper left) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 165,40 C 156,24 135,20 118,26 C 128,38 144,46 165,40 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 165,40 Q 142,32 118,26" strokeWidth="0.9" />
      <path d="M 150,36 Q 145,28 138,25" strokeWidth="0.7" opacity="0.65" />
      <path d="M 136,32 Q 134,38 131,42" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 4 on secondary twig tip */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 120,42 C 106,34 86,38 74,52 C 90,58 108,54 120,42 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 120,42 Q 98,46 74,52" strokeWidth="0.9" />
      <path d="M 108,44 Q 102,39 95,38" strokeWidth="0.7" opacity="0.65" />
      <path d="M 94,48 Q 92,54 89,57" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 5 (Lower middle, pointing downwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 172,64 C 180,82 170,104 150,114 C 146,94 156,74 172,64 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 172,64 Q 164,88 150,114" strokeWidth="0.9" />
      <path d="M 168,76 Q 174,84 178,90" strokeWidth="0.7" opacity="0.65" />
      <path d="M 162,88 Q 156,92 152,96" strokeWidth="0.7" opacity="0.65" />
      <path d="M 157,100 Q 162,106 166,110" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 6 (Upper middle, pointing inwards) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 148,82 C 136,68 114,65 98,75 C 110,88 128,94 148,82 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 148,82 Q 124,78 98,75" strokeWidth="0.9" />
      <path d="M 134,80 Q 128,73 122,70" strokeWidth="0.7" opacity="0.65" />
      <path d="M 118,78 Q 116,85 113,89" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 7 (Terminal leaf pair 1) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 120,104 C 122,124 110,144 90,152 C 90,132 102,114 120,104 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 120,104 Q 108,128 90,152" strokeWidth="0.9" />
      <path d="M 114,116 Q 120,123 123,128" strokeWidth="0.7" opacity="0.65" />
      <path d="M 106,128 Q 100,132 95,135" strokeWidth="0.7" opacity="0.65" />
    </g>

    {/* Leaf 8 (Terminal leaf at tip) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 100,118 C 84,112 62,120 50,136 C 68,142 86,136 100,118 Z"
        fill="#FAF4EE"
        fillOpacity="0.7"
      />
      <path d="M 100,118 Q 75,126 50,136" strokeWidth="0.9" />
      <path d="M 86,122 Q 80,117 74,115" strokeWidth="0.7" opacity="0.65" />
      <path d="M 72,128 Q 70,134 67,138" strokeWidth="0.7" opacity="0.65" />
    </g>
  </svg>
);

export const BotanicalBottomRight: React.FC<BotanicalBranchProps> = ({
  className = "w-40 sm:w-52 lg:w-64 h-auto",
  color = "#8A675C",
  opacity = 0.5,
}) => (
  <svg
    viewBox="0 0 240 180"
    className={className}
    fill="none"
    style={{ opacity }}
    aria-hidden="true"
  >
    {/* Branch curving from bottom-right towards upper-left */}
    <path
      d="M 230,170 C 190,140 145,95 90,40"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />

    {/* Leaf 1 (Lower branch) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 195,142 C 210,126 216,104 204,90 C 190,102 185,124 195,142 Z"
        fill="#FAF4EE"
        fillOpacity="0.65"
      />
      <path d="M 195,142 Q 202,116 204,90" strokeWidth="0.85" />
      <path d="M 198,126 Q 206,122 212,118" strokeWidth="0.65" opacity="0.6" />
      <path d="M 201,110 Q 194,106 190,103" strokeWidth="0.65" opacity="0.6" />
    </g>

    {/* Leaf 2 (Opposite side) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 180,130 C 158,136 142,124 136,104 C 154,106 172,118 180,130 Z"
        fill="#FAF4EE"
        fillOpacity="0.65"
      />
      <path d="M 180,130 Q 158,120 136,104" strokeWidth="0.85" />
      <path d="M 168,124 Q 164,132 158,136" strokeWidth="0.65" opacity="0.6" />
      <path d="M 152,116 Q 154,108 152,102" strokeWidth="0.65" opacity="0.6" />
    </g>

    {/* Leaf 3 (Middle branch right) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 148,98 C 162,84 168,64 158,50 C 144,62 140,82 148,98 Z"
        fill="#FAF4EE"
        fillOpacity="0.65"
      />
      <path d="M 148,98 Q 156,74 158,50" strokeWidth="0.85" />
      <path d="M 151,84 Q 158,80 164,76" strokeWidth="0.65" opacity="0.6" />
      <path d="M 154,70 Q 148,66 144,63" strokeWidth="0.65" opacity="0.6" />
    </g>

    {/* Leaf 4 (Middle branch left) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 130,82 C 108,88 94,78 88,58 C 106,60 122,70 130,82 Z"
        fill="#FAF4EE"
        fillOpacity="0.65"
      />
      <path d="M 130,82 Q 109,72 88,58" strokeWidth="0.85" />
      <path d="M 120,78 Q 116,84 110,88" strokeWidth="0.65" opacity="0.6" />
      <path d="M 104,68 Q 106,60 104,54" strokeWidth="0.65" opacity="0.6" />
    </g>

    {/* Leaf 5 (Terminal apex leaf) */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M 90,40 C 80,22 60,16 46,24 C 54,40 72,48 90,40 Z"
        fill="#FAF4EE"
        fillOpacity="0.65"
      />
      <path d="M 90,40 Q 68,30 46,24" strokeWidth="0.85" />
      <path d="M 78,35 Q 74,27 68,24" strokeWidth="0.65" opacity="0.6" />
      <path d="M 64,30 Q 66,37 68,41" strokeWidth="0.65" opacity="0.6" />
    </g>
  </svg>
);
