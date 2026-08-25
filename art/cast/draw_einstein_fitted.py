#!/usr/bin/env python3
"""
Generates character illustration sheet for Albert Einstein (The Physicist)
"""
import subprocess
from pathlib import Path

OUT_DIR = Path("/home/hamed/repos/math-or-merit/art/cast")
OUT_DIR.mkdir(parents=True, exist_ok=True)

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
  <g id="einstein-p1" transform="translate(160, 30)">
    <text class="label" x="0" y="420">1. Contemplating (Pacing / Pipe)</text>
    <ellipse class="shadow" cx="0" cy="385" rx="52" ry="8" />

    <!-- Legs & Trousers -->
    <path d="M -22 280 L -22 365 C -22 371 -4 371 -4 365 L -4 280" class="pants" />
    <path d="M 4 280 L 4 365 C 4 371 22 371 22 365 L 22 280" class="pants" />
    <!-- Rounded Shoes -->
    <path d="M -34 374 C -34 362 -10 362 -10 374 Z" class="shoe" />
    <path d="M 10 374 C 10 362 34 362 34 374 Z" class="shoe" />

    <!-- Body / Chubby Tweed Cardigan & Vest -->
    <g id="body-1">
      <path d="M -38 185 C -50 215 -46 272 -30 288 C -10 294 10 294 30 288 C 46 272 50 215 38 185 Z" class="jacket" />
      
      <!-- White shirt & Collar -->
      <path d="M -16 178 L 0 202 L 16 178 Z" class="shirt" />
      <path d="M -8 180 L 0 184 L -8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M 8 180 L 0 184 L 8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />

      <!-- Cardigan Opening & Buttons -->
      <path d="M -18 182 L -10 245 L 0 290 L 10 245 L 18 182" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
      <circle cx="0" cy="225" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="250" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="274" r="2.4" fill="#3c352b" />
    </g>

    <!-- Left Arm: relaxed behind back -->
    <path d="M -36 190 C -52 210 -50 250 -30 262" class="ink-heavy" />

    <!-- Right Arm: holding pipe up -->
    <g id="arm-pipe">
      <path d="M 36 190 C 54 214 50 252 24 250" class="ink-heavy" />
      <circle cx="22" cy="250" r="6" class="skin" />
      <!-- Pipe -->
      <path d="M 22 248 C 18 248 14 240 14 232 L 18 232" class="ink-med" />
      <path d="M 12 232 L 22 232 L 20 242 L 14 242 Z" class="pipe" />
      <!-- Smoke wisps -->
      <path d="M 17 224 C 13 218 21 212 17 204 C 13 196 19 190 16 184" class="ink-fine" stroke-dasharray="4 2" opacity="0.6" />
    </g>

    <!-- Head & Hair Group -->
    <g id="head-1" transform="translate(0, 28)">
      <!-- Neck -->
      <path d="M -14 135 L -14 158 L 14 158 L 14 135 Z" class="skin" />

      <!-- Wild Hair Halo -->
      <path d="M -32 110 
               C -55 102 -60 82 -48 65 
               C -60 48 -45 28 -28 32 
               C -20 18 0 16 16 26 
               C 34 20 50 38 45 56 
               C 58 72 55 98 35 112 
               C 42 130 28 145 15 148 
               C -18 152 -36 132 -32 110 Z" class="hair" />

      <!-- Head Base (Round face) -->
      <path d="M -28 85 C -36 108 -28 146 0 148 C 28 146 36 108 28 85 C 22 58 -22 58 -28 85 Z" class="skin" />

      <!-- Ears -->
      <path d="M -28 104 C -34 104 -34 116 -28 118" class="skin" />
      <path d="M 28 104 C 34 104 34 116 28 118" class="skin" />

      <!-- Wrinkles -->
      <path d="M -10 82 C 0 79 10 82 10 82" class="ink-fine" />
      <path d="M -8 87 C 0 84 8 87 8 87" class="ink-fine" />

      <!-- Eyebrows -->
      <path d="M -20 95 C -14 89 -8 93 -8 93" class="ink-med" />
      <path d="M 8 91 C 14 87 20 91 20 91" class="ink-med" />

      <!-- Round Glasses & Eyes -->
      <circle cx="-14" cy="105" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <circle cx="14" cy="105" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <path d="M -4 104 C 0 101 4 104 4 104" class="ink-med" />
      <circle cx="-14" cy="104" r="2.8" fill="#3c352b" />
      <circle cx="14" cy="104" r="2.8" fill="#3c352b" />

      <!-- Nose -->
      <path d="M 0 102 C 4 112 4 119 0 120 C -4 119 -3 112 0 102 Z" class="skin" stroke-width="2" />

      <!-- Droopy Bushy Mustache -->
      <path d="M -22 124 C -12 118 -2 118 0 124 C 2 118 12 118 22 124 C 20 138 8 138 0 132 C -8 138 -20 138 -22 124 Z" class="hair" stroke-width="2.6" />

      <!-- Hair texture lines -->
      <path d="M -36 65 C -42 57 -32 45 -26 55" class="ink-fine" />
      <path d="M 36 65 C 42 57 32 45 26 55" class="ink-fine" />
      <path d="M -12 24 C -15 14 -2 14 4 22" class="ink-fine" />
    </g>
  </g>

  <!-- ==================== POSE 2: EUREKA! ("SOLVED!") ==================== -->
  <g id="einstein-p2" transform="translate(450, 30)">
    <text class="label" x="0" y="420">2. "Solved!" (Pointing Finger)</text>
    <ellipse class="shadow" cx="0" cy="385" rx="52" ry="8" />

    <!-- Legs -->
    <path d="M -22 280 L -22 365 C -22 371 -4 371 -4 365 L -4 280" class="pants" />
    <path d="M 4 280 L 4 365 C 4 371 22 371 22 365 L 22 280" class="pants" />
    <path d="M -34 374 C -34 362 -10 362 -10 374 Z" class="shoe" />
    <path d="M 10 374 C 10 362 34 362 34 374 Z" class="shoe" />

    <!-- Torso -->
    <path d="M -38 185 C -50 215 -46 272 -30 288 C -10 294 10 294 30 288 C 46 272 50 215 38 185 Z" class="jacket" />
    <path d="M -16 178 L 0 202 L 16 178 Z" class="shirt" />
    <path d="M -8 180 L 0 184 L -8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
    <path d="M 8 180 L 0 184 L 8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
    <path d="M -18 182 L -10 245 L 0 290 L 10 245 L 18 182" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
    <circle cx="0" cy="225" r="2.4" fill="#3c352b" />
    <circle cx="0" cy="250" r="2.4" fill="#3c352b" />
    <circle cx="0" cy="274" r="2.4" fill="#3c352b" />

    <!-- Left Arm: on hip -->
    <path d="M -36 190 C -58 210 -56 248 -36 256" class="ink-heavy" />
    <circle cx="-36" cy="256" r="6" class="skin" />

    <!-- Head & Expressive Face -->
    <g id="head-2" transform="translate(0, 28)">
      <path d="M -14 135 L -14 158 L 14 158 L 14 135 Z" class="skin" />
      <path d="M -32 110 C -55 102 -60 82 -48 65 C -60 48 -45 28 -28 32 C -20 18 0 16 16 26 C 34 20 50 38 45 56 C 58 72 55 98 35 112 C 42 130 28 145 15 148 C -18 152 -36 132 -32 110 Z" class="hair" />
      <path d="M -28 85 C -36 108 -28 146 0 148 C 28 146 36 108 28 85 C 22 58 -22 58 -28 85 Z" class="skin" />
      <path d="M -28 104 C -34 104 -34 116 -28 118" class="skin" />
      <path d="M 28 104 C 34 104 34 116 28 118" class="skin" />

      <!-- Excited eyebrows -->
      <path d="M -20 88 C -14 83 -8 87 -8 87" class="ink-med" />
      <path d="M 8 87 C 14 83 20 88 20 88" class="ink-med" />

      <!-- Glinting Glasses & wide eyes -->
      <circle cx="-14" cy="103" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <circle cx="14" cy="103" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
      <path d="M -4 102 C 0 99 4 102 4 102" class="ink-med" />
      <circle cx="-14" cy="103" r="3" fill="#3c352b" />
      <circle cx="14" cy="103" r="3" fill="#3c352b" />
      <circle cx="-15.5" cy="101.5" r="1" fill="#ffffff" />
      <circle cx="12.5" cy="101.5" r="1" fill="#ffffff" />

      <!-- Nose & Smile -->
      <path d="M 0 100 C 4 110 4 117 0 118 C -4 117 -3 110 0 100 Z" class="skin" stroke-width="2" />
      <path d="M -22 120 C -12 114 -2 114 0 120 C 2 114 12 114 22 120 C 20 132 8 132 0 128 C -8 132 -20 132 -22 120 Z" class="hair" stroke-width="2.6" />
      <path d="M -8 130 Q 0 138 8 130" class="ink-med" />
    </g>

    <!-- Right Arm: Pointing index finger high in the air -->
    <g id="arm-eureka">
      <path d="M 36 190 C 56 198 64 165 52 115" class="ink-heavy" />
      <g transform="translate(52, 110)">
        <circle cx="0" cy="0" r="6" class="skin" />
        <path d="M -2.5 -2 L -2.5 -24 C -2.5 -28 2.5 -28 2.5 -24 L 2.5 -2 Z" class="skin" />
        <!-- Eureka rays -->
        <line x1="0" y1="-34" x2="0" y2="-42" class="ink-fine" />
        <line x1="-8" y1="-32" x2="-14" y2="-38" class="ink-fine" />
        <line x1="8" y1="-32" x2="14" y2="-38" class="ink-fine" />
      </g>
    </g>
  </g>

  <!-- ==================== POSE 3: STANDING BY COW ==================== -->
  <g id="einstein-p3" transform="translate(730, 30)">
    <text class="label" x="-20" y="420">3. In Scene with Cow</text>

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
      <ellipse class="shadow" cx="0" cy="385" rx="52" ry="8" />
      <path d="M -22 280 L -22 365 C -22 371 -4 371 -4 365 L -4 280" class="pants" />
      <path d="M 4 280 L 4 365 C 4 371 22 371 22 365 L 22 280" class="pants" />
      <path d="M -34 374 C -34 362 -10 362 -10 374 Z" class="shoe" />
      <path d="M 6 374 C 6 362 30 362 30 374 Z" class="shoe" />

      <path d="M -38 185 C -50 215 -46 272 -30 288 C -10 294 10 294 30 288 C 46 272 50 215 38 185 Z" class="jacket" />
      <path d="M -16 178 L 0 202 L 16 178 Z" class="shirt" />
      <path d="M -8 180 L 0 184 L -8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M 8 180 L 0 184 L 8 188 Z" fill="#8b5e34" stroke="#3c352b" stroke-width="1.8" />
      <path d="M -18 182 L -10 245 L 0 290 L 10 245 L 18 182" fill="#fdf8ec" stroke="#3c352b" stroke-width="2.5" />
      <circle cx="0" cy="225" r="2.4" fill="#3c352b" />
      <circle cx="0" cy="250" r="2.4" fill="#3c352b" />

      <!-- Gesturing Arm extending toward cow -->
      <path d="M -36 190 C -60 205 -75 225 -86 216" class="ink-heavy" />
      <circle cx="-88" cy="216" r="6" class="skin" />
      <path d="M 36 190 C 54 210 50 245 32 255" class="ink-heavy" />

      <!-- Head looking towards cow -->
      <g transform="translate(0, 28)">
        <path d="M -14 135 L -14 158 L 14 158 L 14 135 Z" class="skin" />
        <path d="M -32 110 C -55 102 -60 82 -48 65 C -60 48 -45 28 -28 32 C -20 18 0 16 16 26 C 34 20 50 38 45 56 C 58 72 55 98 35 112 C 42 130 28 145 15 148 C -18 152 -36 132 -32 110 Z" class="hair" />
        <path d="M -28 85 C -36 108 -28 146 0 148 C 28 146 36 108 28 85 C 22 58 -22 58 -28 85 Z" class="skin" />
        <path d="M -28 104 C -34 104 -34 116 -28 118" class="skin" />
        <path d="M 28 104 C 34 104 34 116 28 118" class="skin" />
        <circle cx="-14" cy="105" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
        <circle cx="14" cy="105" r="10" fill="#fdf8ec" fill-opacity="0.9" stroke="#3c352b" stroke-width="2.6" />
        <path d="M -4 104 C 0 101 4 104 4 104" class="ink-med" />
        <circle cx="-16" cy="105" r="2.8" fill="#3c352b" />
        <circle cx="12" cy="105" r="2.8" fill="#3c352b" />
        <path d="M 0 102 C 4 112 4 119 0 120 C -4 119 -3 112 0 102 Z" class="skin" stroke-width="2" />
        <path d="M -22 124 C -12 118 -2 118 0 124 C 2 118 12 118 22 124 C 20 138 8 138 0 132 C -8 138 -20 138 -22 124 Z" class="hair" stroke-width="2.6" />
      </g>
    </g>
  </g>
</svg>
"""

svg_file = OUT_DIR / "study_einstein_fitted.svg"
png_file = OUT_DIR / "study_einstein_fitted.png"

svg_file.write_text(EINSTEIN_SVG)
subprocess.run(["inkscape", str(svg_file), "-o", str(png_file), "-w", "1400", "-h", "750"], check=True)
print(f"Generated {png_file}")
