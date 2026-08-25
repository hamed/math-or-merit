#!/usr/bin/env python3
"""
Refined character drawing script for the cast:
1. Albert Einstein (The Physicist)
2. Marie Curie (The Chemist)
3. Robert Bakewell (The Farmer)
4. Charles Darwin (The Biologist)
"""
import subprocess
from pathlib import Path

OUT_DIR = Path("/home/hamed/repos/math-or-merit/art/cast")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. ALBERT EINSTEIN (PHYSICIST) - Based on inbox/albert 000.png (top-left)
# ------------------------------------------------------------------------------
EINSTEIN_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="900" height="480">
  <defs>
    <style>
      .bg { fill: #f7f4ec; }
      .ink-heavy { fill: none; stroke: #3c352b; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
      .ink-med { fill: none; stroke: #3c352b; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
      .ink-fine { fill: none; stroke: #3c352b; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .skin { fill: #efdcc0; stroke: #3c352b; stroke-width: 3.5; stroke-linejoin: round; }
      .hair { fill: #f6ead2; stroke: #3c352b; stroke-width: 3.5; stroke-linejoin: round; }
      .jacket { fill: #d5c8b2; stroke: #3c352b; stroke-width: 3.5; stroke-linejoin: round; }
      .vest { fill: #b8a68d; stroke: #3c352b; stroke-width: 2.8; stroke-linejoin: round; }
      .shirt { fill: #fdf8ec; stroke: #3c352b; stroke-width: 3; stroke-linejoin: round; }
      .pants { fill: #4a4034; stroke: #3c352b; stroke-width: 3.5; stroke-linejoin: round; }
      .shoe { fill: #2c2825; stroke: #3c352b; stroke-width: 2.5; stroke-linejoin: round; }
      .pipe { fill: #8b5e34; stroke: #3c352b; stroke-width: 2; stroke-linejoin: round; }
      .shadow { fill: #3c352b; fill-opacity: 0.12; }
      .label { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; fill: #6e6253; font-weight: 600; text-anchor: middle; }
    </style>
  </defs>

  <rect class="bg" width="900" height="480" />

  <!-- ==================== POSE 1: CONTEMPLATING WITH PIPE ==================== -->
  <g id="einstein-p1" transform="translate(160, 40)">
    <text class="label" x="0" y="410">1. Contemplating (Pacing / Pipe)</text>
    <ellipse class="shadow" cx="0" cy="380" rx="52" ry="8" />

    <!-- Legs & Trousers -->
    <path d="M -22 280 L -22 360 C -22 366 -4 366 -4 360 L -4 280" class="pants" />
    <path d="M 4 280 L 4 360 C 4 366 22 366 22 360 L 22 280" class="pants" />
    <!-- Rounded Shoes -->
    <path d="M -34 370 C -34 358 -10 358 -10 370 Z" class="shoe" />
    <path d="M 10 370 C 10 358 34 358 34 370 Z" class="shoe" />

    <!-- Body / Chubby Tweed Cardigan & Vest -->
    <g id="body-1">
      <!-- Base Torso -->
      <path d="M -38 180 C -50 210 -46 270 -30 286 C -10 292 10 292 30 286 C 46 270 50 210 38 180 Z" class="jacket" />
      
      <!-- White shirt & Collar -->
      <path d="M -16 172 L 0 196 L 16 172 Z" class="shirt" />
      <path d="M -8 174 L 0 178 L -8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M 8 174 L 0 178 L 8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />

      <!-- Cardigan Opening & Buttons -->
      <path d="M -18 176 L -10 240 L 0 288 L 10 240 L 18 176" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
      <circle cx="0" cy="220" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="245" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="270" r="2.4" fill="#3c352b" />
    </g>

    <!-- Left Arm: relaxed behind back -->
    <path d="M -36 186 C -52 205 -50 246 -30 258" class="ink-heavy" />

    <!-- Right Arm: holding pipe up -->
    <g id="arm-pipe">
      <path d="M 36 186 C 54 210 50 248 24 246" class="ink-heavy" />
      <circle cx="22" cy="246" r="6" class="skin" />
      <!-- Pipe -->
      <path d="M 22 244 C 18 244 14 236 14 228 L 18 228" class="ink-med" />
      <path d="M 12 228 L 22 228 L 20 238 L 14 238 Z" class="pipe" />
      <!-- Smoke wisps -->
      <path d="M 17 220 C 13 214 21 208 17 200 C 13 192 19 186 16 180" class="ink-fine" stroke-dasharray="4 2" opacity="0.6" />
    </g>

    <!-- Head & Hair Group (Hugging head, cute proportions) -->
    <g id="head-1" transform="translate(0, 0)">
      <!-- Neck -->
      <path d="M -12 165 L -12 178 L 12 178 L 12 165 Z" class="skin" />

      <!-- Wild Hair Halo (Curls framing the head) -->
      <path d="M -30 115 
               C -55 105 -58 80 -45 65 
               C -55 45 -40 25 -25 30 
               C -20 12 0 10 15 22 
               C 35 15 52 35 45 55 
               C 58 70 55 98 35 115 
               C 40 135 25 150 15 152 
               C -20 155 -38 135 -30 115 Z" class="hair" />

      <!-- Head Base (Round chubby face) -->
      <path d="M -28 92 C -35 115 -28 152 0 154 C 28 152 35 115 28 92 C 22 68 -22 68 -28 92 Z" class="skin" />

      <!-- Ears -->
      <path d="M -28 110 C -34 110 -34 122 -28 124" class="skin" />
      <path d="M 28 110 C 34 110 34 122 28 124" class="skin" />

      <!-- Forehead Wrinkles -->
      <path d="M -10 90 C 0 87 10 90 10 90" class="ink-fine" />
      <path d="M -8 95 C 0 92 8 95 8 95" class="ink-fine" />

      <!-- Eyebrows -->
      <path d="M -20 102 C -14 96 -8 100 -8 100" class="ink-med" />
      <path d="M 8 98 C 14 94 20 98 20 98" class="ink-med" />

      <!-- Round Glasses & Eyes -->
      <circle cx="-14" cy="112" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <circle cx="14" cy="112" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <path d="M -4 111 C 0 108 4 111 4 111" class="ink-med" />
      <circle cx="-14" cy="111" r="2.8" fill="#3c352b" />
      <circle cx="14" cy="111" r="2.8" fill="#3c352b" />

      <!-- Nose (Cute button curve) -->
      <path d="M 0 108 C 4 118 4 125 0 126 C -4 125 -3 118 0 108 Z" class="skin" stroke-width="2" />

      <!-- Droopy Bushy Mustache -->
      <path d="M -22 130 C -12 124 -2 124 0 130 C 2 124 12 124 22 130 C 20 144 8 144 0 138 C -8 144 -20 144 -22 130 Z" class="hair" stroke-width="2.6" />

      <!-- Inner hair curl details -->
      <path d="M -36 70 C -42 62 -32 50 -26 60" class="ink-fine" />
      <path d="M 36 70 C 42 62 32 50 26 60" class="ink-fine" />
      <path d="M -12 28 C -15 18 -2 18 4 26" class="ink-fine" />
    </g>
  </g>

  <!-- ==================== POSE 2: EUREKA! ("SOLVED!") ==================== -->
  <g id="einstein-p2" transform="translate(450, 40)">
    <text class="label" x="0" y="410">2. "Solved!" (Pointing Finger)</text>
    <ellipse class="shadow" cx="0" cy="380" rx="52" ry="8" />

    <!-- Legs -->
    <path d="M -22 280 L -22 360 C -22 366 -4 366 -4 360 L -4 280" class="pants" />
    <path d="M 4 280 L 4 360 C 4 366 22 366 22 360 L 22 280" class="pants" />
    <path d="M -34 370 C -34 358 -10 358 -10 370 Z" class="shoe" />
    <path d="M 10 370 C 10 358 34 358 34 370 Z" class="shoe" />

    <!-- Torso -->
    <path d="M -38 180 C -50 210 -46 270 -30 286 C -10 292 10 292 30 286 C 46 270 50 210 38 180 Z" class="jacket" />
    <path d="M -16 172 L 0 196 L 16 172 Z" class="shirt" />
    <path d="M -8 174 L 0 178 L -8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
    <path d="M 8 174 L 0 178 L 8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
    <path d="M -18 176 L -10 240 L 0 288 L 10 240 L 18 176" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
    <circle cx="0" cy="220" r="2.4" fill="#3c352b" />
    <circle cx="0" cy="245" r="2.4" fill="#3c352b" />
    <circle cx="0" cy="270" r="2.4" fill="#3c352b" />

    <!-- Left Arm: relaxed on hip -->
    <path d="M -36 186 C -58 205 -56 242 -36 250" class="ink-heavy" />
    <circle cx="-36" cy="250" r="6" class="skin" />

    <!-- Head & Expressive Face -->
    <g id="head-2">
      <path d="M -12 165 L -12 178 L 12 178 L 12 165 Z" class="skin" />
      <path d="M -30 115 C -55 105 -58 80 -45 65 C -55 45 -40 25 -25 30 C -20 12 0 10 15 22 C 35 15 52 35 45 55 C 58 70 55 98 35 115 C 40 135 25 150 15 152 C -20 155 -38 135 -30 115 Z" class="hair" />
      <path d="M -28 92 C -35 115 -28 152 0 154 C 28 152 35 115 28 92 C 22 68 -22 68 -28 92 Z" class="skin" />
      <path d="M -28 110 C -34 110 -34 122 -28 124" class="skin" />
      <path d="M 28 110 C 34 110 34 122 28 124" class="skin" />

      <!-- High excited eyebrows -->
      <path d="M -20 95 C -14 90 -8 94 -8 94" class="ink-med" />
      <path d="M 8 94 C 14 90 20 95 20 95" class="ink-med" />

      <!-- Wide Glinting Glasses -->
      <circle cx="-14" cy="110" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <circle cx="14" cy="110" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <path d="M -4 109 C 0 106 4 109 4 109" class="ink-med" />
      <circle cx="-14" cy="110" r="3" fill="#3c352b" />
      <circle cx="14" cy="110" r="3" fill="#3c352b" />
      <circle cx="-15.5" cy="108.5" r="1" fill="#ffffff" />
      <circle cx="12.5" cy="108.5" r="1" fill="#ffffff" />

      <!-- Nose & Smile -->
      <path d="M 0 106 C 4 116 4 123 0 124 C -4 123 -3 116 0 106 Z" class="skin" stroke-width="2" />
      <path d="M -22 126 C -12 120 -2 120 0 126 C 2 120 12 120 22 126 C 20 138 8 138 0 134 C -8 138 -20 138 -22 126 Z" class="hair" stroke-width="2.6" />
      <path d="M -8 136 Q 0 144 8 136" class="ink-med" />
    </g>

    <!-- Right Arm (Foreground): Pointing index finger high in the air -->
    <g id="arm-eureka">
      <path d="M 36 186 C 56 195 64 160 52 110" class="ink-heavy" />
      <!-- Hand with finger -->
      <g transform="translate(52, 106)">
        <circle cx="0" cy="0" r="6" class="skin" />
        <!-- Pointing index finger -->
        <path d="M -2.5 -2 L -2.5 -24 C -2.5 -28 2.5 -28 2.5 -24 L 2.5 -2 Z" class="skin" />
        <!-- Eureka rays -->
        <line x1="0" y1="-34" x2="0" y2="-42" class="ink-fine" />
        <line x1="-8" y1="-32" x2="-14" y2="-38" class="ink-fine" />
        <line x1="8" y1="-32" x2="14" y2="-38" class="ink-fine" />
      </g>
    </g>
  </g>

  <!-- ==================== POSE 3: STANDING BY COW ==================== -->
  <g id="einstein-p3" transform="translate(730, 40)">
    <text class="label" x="-20" y="410">3. In Scene with Cow</text>

    <!-- Sad Cow standing beside him -->
    <g transform="translate(-105, 175) scale(0.68)">
      <ellipse class="shadow" cx="150" cy="232" rx="60" ry="7" />
      <ellipse cx="150" cy="111" rx="60" ry="90" fill="#f6ead2" stroke="#3c352b" stroke-width="4.5" />
      <ellipse cx="118" cy="150" rx="14" ry="19" fill="#3c352b" transform="rotate(-18 118 150)" />
      <path d="m 150 30 a 120 120 0 0 0 -43.7 8.2 a 450 450 0 0 0 18.2 71.5 a 65 65 0 0 0 25.5 5.2 a 65 65 0 0 0 25.5 -5.2 a 450 450 0 0 0 18.2 -71.5 a 120 120 0 0 0 -43.7 -8.2 z" fill="#f6ead2" stroke="#3c352b" stroke-width="4.5" />
      <path d="m 150 90 a 60 60 0 0 0 -37.6 13.3 a 40 40 0 0 0 37.6 26.6 a 40 40 0 0 0 37.6 -26.6 a 60 60 0 0 0 -37.6 -13.3 z" fill="#efdcc0" stroke="#3c352b" stroke-width="3" />
      <ellipse cx="165" cy="65" rx="20" ry="25" fill="#3c352b" />
      <path d="M 150 63 A 120 120 0 0 1 58 20 A 200 200 0 0 0 150 43 A 200 200 0 0 0 241 20 A 120 120 0 0 1 150 63 Z" fill="#e5d5ae" stroke="#3c352b" stroke-width="3" />
      <circle cx="131" cy="72" r="10" fill="#fdf8ec" stroke="#3c352b" stroke-width="2" />
      <circle cx="132" cy="77" r="5" fill="#5a4632" />
      <circle cx="132" cy="77" r="2.5" fill="#3c352b" />
      <path d="M 125 79 A 10 10 0 0 1 132 68 A 10 10 0 0 1 141 75" fill="#f6ead2" stroke="#3c352b" stroke-width="2" />
      <path d="M 130 115 A 40 40 0 0 1 170 115" fill="none" stroke="#3c352b" stroke-width="2.5" stroke-linecap="round" />
    </g>

    <!-- Einstein introducing the cow -->
    <g transform="translate(45, 0)">
      <ellipse class="shadow" cx="0" cy="380" rx="52" ry="8" />
      <path d="M -22 280 L -22 360 C -22 366 -4 366 -4 360 L -4 280" class="pants" />
      <path d="M 4 280 L 4 360 C 4 366 22 366 22 360 L 22 280" class="pants" />
      <path d="M -34 370 C -34 358 -10 358 -10 370 Z" class="shoe" />
      <path d="M 6 370 C 6 358 30 358 30 370 Z" class="shoe" />

      <path d="M -38 180 C -50 210 -46 270 -30 286 C -10 292 10 292 30 286 C 46 270 50 210 38 180 Z" class="jacket" />
      <path d="M -16 172 L 0 196 L 16 172 Z" class="shirt" />
      <path d="M -8 174 L 0 178 L -8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M 8 174 L 0 178 L 8 182 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M -18 176 L -10 240 L 0 288 L 10 240 L 18 176" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
      <circle cx="0" cy="220" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="245" r="2.4" fill="#3c352b" />

      <!-- Gesturing Arm extending toward cow -->
      <path d="M -36 186 C -60 200 -75 220 -86 212" class="ink-heavy" />
      <circle cx="-88" cy="212" r="6" class="skin" />
      <!-- Right arm on hip -->
      <path d="M 36 186 C 54 205 50 240 32 250" class="ink-heavy" />

      <!-- Head looking towards cow -->
      <path d="M -12 165 L -12 178 L 12 178 L 12 165 Z" class="skin" />
      <path d="M -30 115 C -55 105 -58 80 -45 65 C -55 45 -40 25 -25 30 C -20 12 0 10 15 22 C 35 15 52 35 45 55 C 58 70 55 98 35 115 C 40 135 25 150 15 152 C -20 155 -38 135 -30 115 Z" class="hair" />
      <path d="M -28 92 C -35 115 -28 152 0 154 C 28 152 35 115 28 92 C 22 68 -22 68 -28 92 Z" class="skin" />
      <path d="M -28 110 C -34 110 -34 122 -28 124" class="skin" />
      <path d="M 28 110 C 34 110 34 122 28 124" class="skin" />
      <circle cx="-14" cy="112" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <circle cx="14" cy="112" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <path d="M -4 111 C 0 108 4 111 4 111" class="ink-med" />
      <!-- Eyes looking left toward cow -->
      <circle cx="-16" cy="112" r="2.8" fill="#3c352b" />
      <circle cx="12" cy="112" r="2.8" fill="#3c352b" />
      <path d="M 0 108 C 4 118 4 125 0 126 C -4 125 -3 118 0 108 Z" class="skin" stroke-width="2" />
      <path d="M -22 130 C -12 124 -2 124 0 130 C 2 124 12 124 22 130 C 20 144 8 144 0 138 C -8 144 -20 144 -22 130 Z" class="hair" stroke-width="2.6" />
    </g>
  </g>
</svg>
"""

svg_file = OUT_DIR / "study_einstein_refined.svg"
png_file = OUT_DIR / "study_einstein_refined.png"

svg_file.write_text(EINSTEIN_SVG)
subprocess.run(["inkscape", str(svg_file), "-o", str(png_file), "-w", "1400", "-h", "750"], check=True)
print(f"Generated {png_file}")
