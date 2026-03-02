interface LogoProps {
  size?: number;
  animate?: boolean;
}

export const AgriSenseLogo = ({ size = 44, animate = false }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      {/* Main ring gradient */}
      <linearGradient
        id="lg-ring"
        x1="0"
        y1="0"
        x2="200"
        y2="200"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="45%" stopColor="#22c55e" />
        <stop offset="75%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#fbbf24" />
      </linearGradient>

      {/* Leaf gradient */}
      <linearGradient
        id="lg-leaf"
        x1="80"
        y1="40"
        x2="118"
        y2="148"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#86efac" />
        <stop offset="40%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>

      {/* Water drop gradient */}
      <linearGradient
        id="lg-drop"
        x1="100"
        y1="84"
        x2="100"
        y2="164"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="45%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>

      {/* Arc gradient */}
      <linearGradient
        id="lg-arc"
        x1="148"
        y1="36"
        x2="170"
        y2="164"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>

      {/* Glow filter */}
      <filter id="glow-leaf" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-drop" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Soft glow for outer ring */}
      <filter id="glow-ring" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ── Outer decorative ring */}
    <circle
      cx="100"
      cy="100"
      r="92"
      stroke="url(#lg-ring)"
      strokeWidth="2.5"
      strokeDasharray="4 6"
      fill="none"
      opacity="0.35"
      filter="url(#glow-ring)"
    />

    {/* ── Solid inner ring */}
    <circle
      cx="100"
      cy="100"
      r="85"
      stroke="url(#lg-ring)"
      strokeWidth="3.5"
      fill="none"
      filter="url(#glow-ring)"
    />

    {/* ── Inner dark background circle */}
    <circle cx="100" cy="100" r="80" fill="#081510" opacity="0.6" />

    {/* ── Solar rays (top arc) */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = ((-180 + i * 18) * Math.PI) / 180;
      const r1 = 53,
        r2 = i % 3 === 0 ? 70 : 63;
      return (
        <line
          key={i}
          x1={100 + r1 * Math.cos(angle)}
          y1={100 + r1 * Math.sin(angle)}
          x2={100 + r2 * Math.cos(angle)}
          y2={100 + r2 * Math.sin(angle)}
          stroke={i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f59e0b" : "#d97706"}
          strokeWidth={i % 3 === 0 ? 4 : 2.5}
          strokeLinecap="round"
          opacity={i % 3 === 0 ? 0.95 : 0.55}
        />
      );
    })}

    {/* ── LEAF */}
    <path
      d="M95 48
         C74 66 60 96 67 124
         C73 148 95 156 113 140
         C131 124 132 92 116 66
         C107 50 100 44 95 48Z"
      fill="url(#lg-leaf)"
      filter="url(#glow-leaf)"
    />

    {/* Leaf midrib */}
    <path
      d="M96 52 C100 80 108 108 112 138"
      stroke="rgba(255,255,255,0.55)"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
    />

    {/* Leaf veins */}
    {[
      { cx: 103, cy: 76, tx: 120, ty: 70 },
      { cx: 108, cy: 98, tx: 126, ty: 93 },
      { cx: 111, cy: 118, tx: 127, ty: 115 },
    ].map(({ cx, cy, tx, ty }, i) => (
      <g key={i}>
        <line
          x1={cx}
          y1={cy}
          x2={tx}
          y2={ty}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <circle cx={tx} cy={ty} r="2.2" fill="rgba(255,255,255,0.6)" />
        <circle cx={cx} cy={cy} r={3 - i * 0.4} fill="rgba(255,255,255,0.85)" />
      </g>
    ))}

    {/* ── WATER DROP */}
    <path
      d="M100 86
         C100 86 74 118 74 136
         C74 151 86 163 100 163
         C114 163 126 151 126 136
         C126 118 100 86 100 86Z"
      fill="url(#lg-drop)"
      filter="url(#glow-drop)"
    />

    {/* Water drop highlight */}
    <ellipse
      cx="92"
      cy="118"
      rx="5"
      ry="9"
      fill="rgba(255,255,255,0.22)"
      transform="rotate(-20 92 118)"
    />

    {/* Water ripples inside drop */}
    <path
      d="M90 140 Q100 134 110 140"
      stroke="rgba(255,255,255,0.5)"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M85 150 Q100 142 115 150"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="100" cy="156" r="2.5" fill="rgba(255,255,255,0.7)" />

    {/* ── SIGNAL ARC (right side) */}
    <path
      d="M152 55 A62 62 0 0 1 152 145"
      stroke="url(#lg-arc)"
      strokeWidth="5.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M163 70 A48 48 0 0 1 163 130"
      stroke="#38bdf8"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    <path
      d="M173 83 A36 36 0 0 1 173 117"
      stroke="#7dd3fc"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.3"
    />

    {/* ── Corner dots */}
    {[
      [164, 155, 0.5],
      [170, 162, 0.35],
      [177, 155, 0.25],
      [164, 168, 0.2],
    ].map(([cx, cy, op], i) => (
      <circle
        key={i}
        cx={cx as number}
        cy={cy as number}
        r="3"
        fill="#64748b"
        fillOpacity={op as number}
      />
    ))}
  </svg>
);
