import React, { useEffect } from 'react';

export function GradientSubtitle({ text }: { text: string }) {
  useEffect(() => {
    if (document.getElementById('harl-font')) return;
    const link = document.createElement('link');
    link.id = 'harl-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Ultra&family=Alfa+Slab+One&display=swap';
    document.head.appendChild(link);
  }, []);

  const label = text.toUpperCase();

  return (
    <svg
      width="380"
      height="38"
      viewBox="0 0 380 38"
      style={{ marginTop: -6, overflow: 'visible' as const }}
    >
      <defs>
        {/*
          Pixel-sampled directly from logo.png (python/PIL):
          Two repeating bands, each: #C45F05 (dark orange) → #F6BA01 (bright gold)
          Hard reset at 50%. Border: outer #000000 (7px) + inner #8C0301 (10px).
        */}
        <linearGradient id="harlGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#C45F05" />
          <stop offset="45%"  stopColor="#F6BA01" />
          <stop offset="50%"  stopColor="#C45F05" />
          <stop offset="100%" stopColor="#F6BA01" />
        </linearGradient>
      </defs>

      {/* Layer 1 — outer black stroke (matches logo's outer #000000 border) */}
      <text
        x="190" y="28"
        textAnchor="middle"
        fontFamily="'Ultra', 'Alfa Slab One', Georgia, serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="1"
        strokeLinejoin="round"
        textRendering="geometricPrecision"
        fill="none"
        stroke="#000000"
        strokeWidth="7"
      >{label}</text>

      {/* Layer 2 — red stroke + gradient fill (matches logo's #8C0301 inner border) */}
      <text
        x="190" y="28"
        textAnchor="middle"
        fontFamily="'Ultra', 'Alfa Slab One', Georgia, serif"
        fontSize="22"
        fontWeight="400"
        letterSpacing="1"
        strokeLinejoin="round"
        textRendering="geometricPrecision"
        fill="url(#harlGold)"
        stroke="#8C0301"
        strokeWidth="4"
        paintOrder="stroke fill"
      >{label}</text>
    </svg>
  );
}
