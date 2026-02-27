import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
}

export const AgriSenseLogo = ({ size = 44 }: LogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="lg-b"
        x1="0"
        y1="0"
        x2="200"
        y2="200"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#16a34a" />
        <stop offset="50%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient
        id="lg-l"
        x1="80"
        y1="48"
        x2="115"
        y2="148"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient
        id="lg-d"
        x1="100"
        y1="88"
        x2="100"
        y2="162"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient
        id="lg-a"
        x1="148"
        y1="40"
        x2="172"
        y2="160"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    <circle
      cx="100"
      cy="100"
      r="93"
      stroke="url(#lg-b)"
      strokeWidth="4"
      fill="none"
    />
    {Array.from({ length: 10 }).map((_, i) => {
      const a = ((-180 + i * 20) * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={100 + 50 * Math.cos(a)}
          y1={100 + 50 * Math.sin(a)}
          x2={100 + 72 * Math.cos(a)}
          y2={100 + 72 * Math.sin(a)}
          stroke={i % 2 === 0 ? "#f59e0b" : "#64748b"}
          strokeWidth="5.5"
          strokeLinecap="round"
        />
      );
    })}
    <path
      d="M93 52 C74 68 62 94 68 120 C74 144 94 152 110 138 C126 124 128 96 114 72 C106 58 98 48 93 52Z"
      fill="url(#lg-l)"
    />
    <path
      d="M94 56 C98 82 106 108 110 136"
      stroke="white"
      strokeWidth="1.4"
      strokeOpacity="0.5"
      fill="none"
    />
    {[
      [102, 74],
      [107, 96],
      [110, 116],
    ].map(([cx, cy], i) => (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={3 - i * 0.4}
        fill="white"
        fillOpacity="0.85"
      />
    ))}
    <line
      x1="102"
      y1="74"
      x2="116"
      y2="68"
      stroke="white"
      strokeWidth="1.4"
      strokeOpacity="0.6"
    />
    <line
      x1="107"
      y1="96"
      x2="122"
      y2="90"
      stroke="white"
      strokeWidth="1.4"
      strokeOpacity="0.6"
    />
    <circle cx="116" cy="68" r="2.2" fill="white" fillOpacity="0.7" />
    <circle cx="122" cy="90" r="2.2" fill="white" fillOpacity="0.7" />
    <path
      d="M100 88 C100 88 76 118 76 134 C76 148 87 159 100 159 C113 159 124 148 124 134 C124 118 100 88 100 88Z"
      fill="url(#lg-d)"
    />
    <path
      d="M91 138 Q100 131 109 138"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeOpacity="0.75"
    />
    <path
      d="M86 146 Q100 136 114 146"
      stroke="white"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeOpacity="0.5"
    />
    <circle cx="100" cy="153" r="2.5" fill="white" fillOpacity="0.8" />
    <path
      d="M150 54 A62 62 0 0 1 150 146"
      stroke="url(#lg-a)"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    {[
      [160, 150],
      [166, 158],
      [172, 150],
      [160, 162],
      [172, 162],
    ].map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="3" fill="#64748b" fillOpacity="0.45" />
    ))}
  </svg>
);
