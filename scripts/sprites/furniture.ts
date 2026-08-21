// Furniture sprites - desk, chair, couch, bookshelf, filing cabinet, etc.

import { _, O } from './palette';
import type { SpriteData } from './tiles';

function fillRect(d: number[][], x1: number, y1: number, x2: number, y2: number, c: number) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      d[y][x] = c;
}

function makeGrid(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(_));
}

export const FURNITURE: Record<string, SpriteData> = {};

// Desk 32x24 (2 tiles wide) - 3/4 perspective: top surface + front panel
FURNITURE["desk"] = { width: 32, height: 24, pixels: (() => {
  const d = makeGrid(32, 24);
  // Top surface y1-8 (lighter, ~40%)
  fillRect(d, 1, 1, 30, 1, O); // top outline
  d[1][0] = O; d[1][31] = O;
  for (let y = 2; y <= 8; y++) {
    d[y][0] = O;
    d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (y === 2) d[y][x] = 65; // highlight row
      else if (y === 8) d[y][x] = 25; // shadow row (transition)
      else d[y][x] = 24; // wood top
    }
  }
  // 1px shadow line between top and front
  for (let x = 0; x <= 31; x++) d[9][x] = O;
  // Front panel y10-20 (darker, ~60%)
  for (let y = 10; y <= 20; y++) {
    d[y][0] = O;
    d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (x === 1) d[y][x] = 66; // left edge darker for depth
      else if (y === 20) d[y][x] = 66; // bottom darker
      else d[y][x] = 25; // front panel
    }
  }
  // Bottom outline
  for (let x = 0; x <= 31; x++) d[21][x] = O;
  // Legs y22-23
  d[22][2] = O; d[22][3] = 66; d[22][28] = O; d[22][29] = 66;
  d[23][2] = O; d[23][3] = O; d[23][28] = O; d[23][29] = O;
  // Drawer handle on front
  for (let x = 13; x <= 18; x++) d[15][x] = 48;
  return d;
})()};

// Computer/Monitor 16x20 - screen + base, 3/4 perspective
for (const [suffix, screenColor] of [["off", 31], ["blue", 28], ["green", 29], ["yellow", 30]] as const) {
  FURNITURE[`monitor_${suffix}`] = { width: 16, height: 20, pixels: (() => {
    const d = makeGrid(16, 20);
    // Screen body y0-12, x1-14 - top bevel + front screen
    // Top edge (top surface of monitor, lighter)
    for (let x = 2; x <= 13; x++) d[0][x] = O;
    d[1][1] = O; d[1][14] = O;
    for (let x = 2; x <= 13; x++) d[1][x] = 48; // top surface metal
    // Shadow line
    for (let x = 1; x <= 14; x++) d[2][x] = O;
    // Screen area y3-11 (front face)
    for (let y = 3; y <= 11; y++) {
      d[y][1] = O;
      d[y][14] = O;
      for (let x = 2; x <= 13; x++) {
        if (y === 3 || y === 11 || x === 2 || x === 13) d[y][x] = 27; // inner frame
        else d[y][x] = screenColor;
      }
    }
    // Bottom of screen
    for (let x = 1; x <= 14; x++) d[12][x] = O;
    // Stand y13-16
    for (let y = 13; y <= 16; y++) { d[y][6] = 26; d[y][7] = 48; d[y][8] = 27; d[y][9] = 49; }
    // Base y17-18 (3/4: top surface + front)
    for (let x = 4; x <= 11; x++) d[17][x] = O;
    for (let x = 4; x <= 11; x++) d[18][x] = 49;
    for (let x = 4; x <= 11; x++) d[19][x] = O;
    return d;
  })()};
}

// Chair 16x20 - 3/4 perspective (seat + backrest)
// Grey ergonomic office chair — no outline on backrest, grey tones
// 48=#787878 medium grey, 81=#989898 light grey, 49=dark grey, 128=#c8c8c8 seat surface
function makeChairV2(dir: string): number[][] {
  const d = makeGrid(16, 20);
  if (dir === "front") {
    // Backrest y0-8 (outline + grey fill)
    for (let x = 3; x <= 12; x++) d[0][x] = O;
    for (let y = 1; y <= 7; y++) {
      d[y][3] = O; d[y][12] = O;
      for (let x = 4; x <= 11; x++) d[y][x] = 48;
    }
    for (let x = 3; x <= 12; x++) d[8][x] = O;
    // Seat top y9-11
    for (let x = 2; x <= 13; x++) d[9][x] = O;
    for (let y = 10; y <= 11; y++) {
      d[y][2] = O; d[y][13] = O;
      for (let x = 3; x <= 12; x++) d[y][x] = 81;
    }
    // Seat front y12-13
    for (let x = 2; x <= 13; x++) d[12][x] = O;
    d[13][2] = O; d[13][13] = O;
    for (let x = 3; x <= 12; x++) d[13][x] = 48;
    for (let x = 2; x <= 13; x++) d[14][x] = O;
    // Legs y15-18
    for (let y = 15; y <= 18; y++) { d[y][5] = 49; d[y][10] = 49; }
    d[19][4] = 49; d[19][6] = 49; d[19][9] = 49; d[19][11] = 49;
  } else if (dir === "back") {
    // Backrest y0-10 (outline + grey fill)
    for (let x = 3; x <= 12; x++) d[0][x] = O;
    for (let y = 1; y <= 9; y++) {
      d[y][3] = O; d[y][12] = O;
      for (let x = 4; x <= 11; x++) d[y][x] = 48;
    }
    for (let x = 3; x <= 12; x++) d[10][x] = O;
    // Legs y15-18
    for (let y = 15; y <= 18; y++) { d[y][5] = 49; d[y][10] = 49; }
    d[19][4] = 49; d[19][6] = 49; d[19][9] = 49; d[19][11] = 49;
  } else if (dir === "left") {
    // Backrest on left y0-8
    for (let y = 0; y <= 8; y++) {
      if (y === 0 || y === 8) { for (let x = 2; x <= 5; x++) d[y][x] = O; continue; }
      d[y][2] = O; d[y][5] = O;
      for (let x = 3; x <= 4; x++) d[y][x] = 48;
    }
    // Seat y9-11
    for (let x = 3; x <= 12; x++) d[9][x] = O;
    for (let y = 10; y <= 11; y++) {
      d[y][3] = O; d[y][12] = O;
      for (let x = 4; x <= 11; x++) d[y][x] = 81;
    }
    for (let x = 3; x <= 12; x++) d[12][x] = O;
    d[13][3] = O; d[13][12] = O;
    for (let x = 4; x <= 11; x++) d[13][x] = 48;
    for (let x = 3; x <= 12; x++) d[14][x] = O;
    for (let y = 15; y <= 18; y++) { d[y][5] = 49; d[y][10] = 49; }
    d[19][4] = 49; d[19][6] = 49; d[19][9] = 49; d[19][11] = 49;
  } else { // right
    // Backrest on right y0-8
    for (let y = 0; y <= 8; y++) {
      if (y === 0 || y === 8) { for (let x = 10; x <= 13; x++) d[y][x] = O; continue; }
      d[y][10] = O; d[y][13] = O;
      for (let x = 11; x <= 12; x++) d[y][x] = 48;
    }
    // Seat y9-11
    for (let x = 3; x <= 12; x++) d[9][x] = O;
    for (let y = 10; y <= 11; y++) {
      d[y][3] = O; d[y][12] = O;
      for (let x = 4; x <= 11; x++) d[y][x] = 81;
    }
    for (let x = 3; x <= 12; x++) d[12][x] = O;
    d[13][3] = O; d[13][12] = O;
    for (let x = 4; x <= 11; x++) d[13][x] = 48;
    for (let x = 3; x <= 12; x++) d[14][x] = O;
    for (let y = 15; y <= 18; y++) { d[y][5] = 49; d[y][10] = 49; }
    d[19][4] = 49; d[19][6] = 49; d[19][9] = 49; d[19][11] = 49;
  }
  return d;
}
for (const dir of ["front", "back", "left", "right"]) {
  FURNITURE[`chair_${dir}`] = { width: 16, height: 20, pixels: makeChairV2(dir) };
}

// Couch 48x24 (3 tiles wide) - 3/4 perspective
// Foosball table 48x24 (3 tiles wide) - 3/4 perspective
FURNITURE["foosball"] = { width: 48, height: 24, pixels: (() => {
  const d = makeGrid(48, 24);
  const G1 = 44;  // bright green (field)
  const G2 = 45;  // dark green (field lines)
  const W  = 25;  // brown wood (table edge)
  const WD = 66;  // dark brown (table front)
  const R  = 12;  // red (players)
  const B  = 10;  // deep blue (players) — was 126 (#88aadd), now 10 (#3868b8)
  const WH = 9;   // white (ball, markings)
  const MG = 48;  // metal grey (rods)

  // === Table top surface (rows 0-15) ===
  // Row 0: top rail outline
  for (let x = 2; x <= 45; x++) d[0][x] = O;
  // Row 1: top rail (wood, 1 row only)
  d[1][1] = O; d[1][46] = O;
  for (let x = 2; x <= 45; x++) d[1][x] = W;

  // Row 2-14: green playing field (13 rows — much bigger!)
  for (let y = 2; y <= 14; y++) {
    d[y][1] = O; d[y][2] = W; d[y][45] = W; d[y][46] = O;
    for (let x = 3; x <= 44; x++) d[y][x] = G1;
  }

  // Center line (y=8, middle of 2-14)
  for (let x = 3; x <= 44; x++) d[8][x] = G2;

  // Goal areas — left goal (x:4-7), right goal (x:40-43)
  for (let y = 5; y <= 11; y++) { d[y][5] = WH; d[y][42] = WH; }
  d[5][5] = WH; d[5][6] = WH; d[5][7] = WH;
  d[11][5] = WH; d[11][6] = WH; d[11][7] = WH;
  d[5][42] = WH; d[5][41] = WH; d[5][40] = WH;
  d[11][42] = WH; d[11][41] = WH; d[11][40] = WH;

  // Center circle (bigger)
  d[6][21] = G2; d[6][26] = G2;
  d[7][20] = G2; d[7][27] = G2;
  d[9][20] = G2; d[9][27] = G2;
  d[10][21] = G2; d[10][26] = G2;

  // Ball (center, aligned with red center column x23)
  d[8][23] = WH; d[8][24] = WH;

    // 8 rods, standard foosball: 1-2-3-5-5-3-2-1 (capped to 3 for pixel space)
  // Each rod calculates its own even spacing independently.
  // Red offset -2px from center, Blue offset +2px, so columns never overlap.
  const fieldL = 6, fieldR = 40; // usable field (inside goal lines)
  const placeRod = (y: number, n: number, color: number, offset: number) => {
    for (let i = 0; i < n; i++) {
      const cx = fieldL + Math.round((i + 1) * (fieldR - fieldL) / (n + 1)) + offset;
      d[y][cx] = color; d[y][cx + 1] = color;
    }
    // Rod handles
    d[y][0] = MG; d[y][1] = MG;
    d[y][46] = MG; d[y][47] = MG;
  };

  // Rods from top (red goal) to bottom (blue goal)
  // Red rods offset -2, Blue rods offset +2
  placeRod(3,  1, R, -2);  // 🔴 Goalkeeper
  placeRod(4,  2, R, -2);  // 🔴 Defense
  placeRod(6,  3, B, +2);  // 🔵 Attack
  placeRod(7,  3, R, -2);  // 🔴 Midfield
  placeRod(9,  3, B, +2);  // 🔵 Midfield
  placeRod(10, 3, R, -2);  // 🔴 Attack
  placeRod(12, 2, B, +2);  // 🔵 Defense
  placeRod(13, 1, B, +2);  // 🔵 Goalkeeper

  // Row 15: bottom rail (wood, 1 row)
  d[15][1] = O; d[15][46] = O;
  for (let x = 2; x <= 45; x++) d[15][x] = W;

  // === Table front panel (rows 16-20, thinner!) ===
  for (let x = 1; x <= 46; x++) d[16][x] = O;
  for (let y = 17; y <= 19; y++) {
    d[y][1] = O; d[y][46] = O;
    for (let x = 2; x <= 45; x++) d[y][x] = WD;
  }
  for (let x = 1; x <= 46; x++) d[20][x] = O;

  // === Legs (rows 21-23) ===
  for (let y = 21; y <= 22; y++) {
    d[y][4] = O; d[y][5] = WD;
    d[y][42] = O; d[y][43] = WD;
  }
  d[23][4] = O; d[23][5] = O; d[23][42] = O; d[23][43] = O;

  return d;
})()};

// Boss desk + computer 48x24 (3 tiles wide) - mahogany, nameplate
// Layout: monitor rows 0-3 (larger 14px wide), keyboard row 4, desk surface rows 5-6,
// shadow line row 7, front panel rows 8-20, bottom outline row 21, legs rows 22-23
for (const [suffix, screenColor] of [["blue", 28], ["green", 29], ["yellow", 30]] as const) {
  FURNITURE[`boss_desk_with_computer_${suffix}`] = { width: 48, height: 24, pixels: (() => {
    const d = makeGrid(48, 24);
    // Monitor (14px wide x 4px tall) - rows 0-3, centered on 48px desk
    for (let x = 17; x <= 30; x++) d[0][x] = O;
    for (let y = 1; y <= 2; y++) {
      d[y][16] = O; d[y][31] = O;
      for (let x = 17; x <= 30; x++) {
        if (x === 17 || x === 30) { d[y][x] = 57; continue; }
        d[y][x] = screenColor;
      }
    }
    for (let x = 17; x <= 30; x++) d[3][x] = O;
    d[3][22] = 48; d[3][23] = 48; d[3][24] = 49; d[3][25] = 49; // stand
    // Keyboard row 4
    for (let x = 20; x <= 27; x++) d[4][x] = 49;
    // Desk surface rows 5-6 (lighter mahogany)
    for (let y = 5; y <= 6; y++) {
      d[y][0] = O; d[y][47] = O;
      for (let x = 1; x <= 46; x++) {
        if (y === 5) d[y][x] = 87;
        else d[y][x] = 85;
      }
    }
    // Pen holder (right side of desk surface)
    d[5][35] = O; d[5][36] = O;
    d[6][35] = 46; d[6][36] = 46;
    // Papers (left side of desk surface)
    d[5][10] = 9; d[5][11] = 9; d[5][12] = 9; d[5][13] = 57;
    d[6][10] = 9; d[6][11] = 9; d[6][12] = 9; d[6][13] = 57;
    // Shadow line row 7
    for (let x = 0; x <= 47; x++) d[7][x] = O;
    // Front panel rows 8-20 (darker mahogany)
    for (let y = 8; y <= 20; y++) {
      d[y][0] = O; d[y][47] = O;
      for (let x = 1; x <= 46; x++) {
        if (x === 1) d[y][x] = 88;
        else if (y === 20) d[y][x] = 88;
        else d[y][x] = 86;
      }
    }
    // Nameplate on front panel (centered)
    for (let x = 18; x <= 29; x++) d[13][x] = 89;
    for (let x = 18; x <= 29; x++) d[14][x] = 90;
    for (let x = 18; x <= 29; x++) d[15][x] = 89;
    // Drawer handles
    for (let x = 8; x <= 13; x++) d[14][x] = 48;
    for (let x = 34; x <= 39; x++) d[14][x] = 48;
    // Bottom outline
    for (let x = 0; x <= 47; x++) d[21][x] = O;
    // Legs
    d[22][3] = O; d[22][4] = 88; d[22][43] = O; d[22][44] = 88;
    d[23][3] = O; d[23][4] = O; d[23][43] = O; d[23][44] = O;
    return d;
  })()};
}

// Secretary desk + computer 32x24 - nicer mahogany wood
// Layout: monitor rows 0-3, keyboard row 4, desk surface rows 5-6,
// shadow line row 7, front panel rows 8-20, bottom outline row 21, legs rows 22-23
for (const [suffix, screenColor] of [["blue", 28], ["green", 29], ["yellow", 30]] as const) {
  FURNITURE[`secretary_desk_with_computer_${suffix}`] = { width: 32, height: 24, pixels: (() => {
    const d = makeGrid(32, 24);
    // Monitor (12px wide x 4px tall) - rows 0-3, centered
    for (let x = 10; x <= 21; x++) d[0][x] = O;
    for (let y = 1; y <= 2; y++) {
      d[y][9] = O; d[y][22] = O;
      for (let x = 10; x <= 21; x++) {
        if (x === 10 || x === 21) { d[y][x] = 57; continue; }
        d[y][x] = screenColor;
      }
    }
    for (let x = 10; x <= 21; x++) d[3][x] = O;
    d[3][14] = 48; d[3][15] = 48; d[3][16] = 49; d[3][17] = 49;
    // Keyboard row 4
    for (let x = 12; x <= 19; x++) d[4][x] = 49;
    // Desk surface rows 5-6 (lighter mahogany)
    for (let y = 5; y <= 6; y++) {
      d[y][0] = O; d[y][31] = O;
      for (let x = 1; x <= 30; x++) {
        if (y === 5) d[y][x] = 87;
        else d[y][x] = 85;
      }
    }
    // Shadow line row 7
    for (let x = 0; x <= 31; x++) d[7][x] = O;
    // Front panel rows 8-20 (darker mahogany)
    for (let y = 8; y <= 20; y++) {
      d[y][0] = O; d[y][31] = O;
      for (let x = 1; x <= 30; x++) {
        if (x === 1) d[y][x] = 88;
        else if (y === 20) d[y][x] = 88;
        else d[y][x] = 86;
      }
    }
    // Drawer handle
    for (let x = 13; x <= 18; x++) d[14][x] = 48;
    // Bottom outline
    for (let x = 0; x <= 31; x++) d[21][x] = O;
    d[22][2] = O; d[22][3] = 88; d[22][28] = O; d[22][29] = 88;
    d[23][2] = O; d[23][3] = O; d[23][28] = O; d[23][29] = O;
    return d;
  })()};
}

// Worker desk + computer 32x24 - regular desk wood
// Layout: monitor rows 0-3 (ON TOP of desk), keyboard row 4, desk surface rows 5-6,
// shadow line row 7, front panel rows 8-20, bottom outline row 21, legs rows 22-23
for (const [suffix, screenColor] of [["blue", 28], ["green", 29], ["yellow", 30]] as const) {
  FURNITURE[`desk_with_computer_${suffix}`] = { width: 32, height: 24, pixels: (() => {
    const d = makeGrid(32, 24);
    // Monitor (12px wide x 4px tall) - rows 0-3, centered
    // Row 0: top frame
    for (let x = 10; x <= 21; x++) d[0][x] = O;
    // Row 1-2: screen with frame
    for (let y = 1; y <= 2; y++) {
      d[y][9] = O; d[y][22] = O;
      for (let x = 10; x <= 21; x++) {
        if (x === 10 || x === 21) { d[y][x] = 57; continue; }
        d[y][x] = screenColor;
      }
    }
    // Row 3: monitor base/stand
    for (let x = 10; x <= 21; x++) d[3][x] = O;
    d[3][14] = 48; d[3][15] = 48; d[3][16] = 49; d[3][17] = 49; // stand neck
    // Row 4: keyboard on desk surface
    for (let x = 12; x <= 19; x++) d[4][x] = 49;
    // Desk surface rows 5-6 (lighter wood)
    for (let y = 5; y <= 6; y++) {
      d[y][0] = O; d[y][31] = O;
      for (let x = 1; x <= 30; x++) {
        if (y === 5) d[y][x] = 65; // highlight row
        else d[y][x] = 24; // wood top
      }
    }
    // Shadow line row 7
    for (let x = 0; x <= 31; x++) d[7][x] = O;
    // Front panel rows 8-20 (darker wood)
    for (let y = 8; y <= 20; y++) {
      d[y][0] = O; d[y][31] = O;
      for (let x = 1; x <= 30; x++) {
        if (x === 1) d[y][x] = 66;
        else if (y === 20) d[y][x] = 66;
        else d[y][x] = 25;
      }
    }
    // Drawer handle
    for (let x = 13; x <= 18; x++) d[14][x] = 48;
    // Bottom outline
    for (let x = 0; x <= 31; x++) d[21][x] = O;
    // Legs
    d[22][2] = O; d[22][3] = 66; d[22][28] = O; d[22][29] = 66;
    d[23][2] = O; d[23][3] = O; d[23][28] = O; d[23][29] = O;
    return d;
  })()};
}
// Alias blue variants as base names
FURNITURE["desk_with_computer"] = FURNITURE["desk_with_computer_blue"];
FURNITURE["boss_desk_with_computer"] = FURNITURE["boss_desk_with_computer_blue"];
FURNITURE["secretary_desk_with_computer"] = FURNITURE["secretary_desk_with_computer_blue"];

// ---- SEPARATE DESK + MONITOR SPRITES (no combined computer) ----

// desk_only 32x20: Just desk — top surface (light wood) + front panel (darker wood). NO computer.
FURNITURE["desk_only"] = { width: 32, height: 20, pixels: (() => {
  const d = makeGrid(32, 20);
  // Top surface rows 0-7 (lighter wood, 8 rows)
  for (let x = 1; x <= 30; x++) d[0][x] = O;
  for (let y = 1; y <= 7; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (y === 1) d[y][x] = 65; // highlight
      else if (y === 7) d[y][x] = 25; // shadow transition
      else d[y][x] = 24; // wood top
    }
  }
  // Edge line between surface and front panel
  for (let x = 0; x <= 31; x++) d[8][x] = O;
  // Front panel rows 9-16 (darker wood, clean, 8 rows)
  for (let y = 9; y <= 16; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (x === 1) d[y][x] = 66;
      else if (y === 16) d[y][x] = 66;
      else d[y][x] = 25;
    }
  }
  // Bottom outline
  for (let x = 0; x <= 31; x++) d[17][x] = O;
  // Legs
  d[18][2] = O; d[18][3] = 66; d[18][28] = O; d[18][29] = 66;
  d[19][2] = O; d[19][3] = O; d[19][28] = O; d[19][29] = O;
  return d;
})()};

// boss_desk_only 48x20: Wider, darker mahogany wood. No computer.
FURNITURE["boss_desk_only"] = { width: 48, height: 20, pixels: (() => {
  const d = makeGrid(48, 20);
  // Top surface rows 0-7 (lighter mahogany, 8 rows)
  for (let x = 1; x <= 46; x++) d[0][x] = O;
  for (let y = 1; y <= 7; y++) {
    d[y][0] = O; d[y][47] = O;
    for (let x = 1; x <= 46; x++) {
      if (y === 1) d[y][x] = 87; // mahogany highlight
      else if (y === 7) d[y][x] = 86; // shadow transition
      else d[y][x] = 85; // mahogany top
    }
  }
  // Pen holder (right side)
  d[2][35] = O; d[2][36] = O;
  d[3][35] = 46; d[3][36] = 46;
  // Papers (left side)
  d[2][10] = 9; d[2][11] = 9; d[2][12] = 9; d[2][13] = 57;
  d[3][10] = 9; d[3][11] = 9; d[3][12] = 9; d[3][13] = 57;
  // Edge line between surface and front panel
  for (let x = 0; x <= 47; x++) d[8][x] = O;
  // Front panel rows 9-16 (darker mahogany, clean)
  for (let y = 9; y <= 16; y++) {
    d[y][0] = O; d[y][47] = O;
    for (let x = 1; x <= 46; x++) {
      if (x === 1) d[y][x] = 88;
      else if (y === 16) d[y][x] = 88;
      else d[y][x] = 86;
    }
  }
  // Drawer handles (grey lines on left and right sides)
  for (let x = 8; x <= 13; x++) d[12][x] = 48;
  for (let x = 34; x <= 39; x++) d[12][x] = 48;
  // Bottom outline
  for (let x = 0; x <= 47; x++) d[17][x] = O;
  // Legs
  d[18][3] = O; d[18][4] = 88; d[18][43] = O; d[18][44] = 88;
  d[19][3] = O; d[19][4] = O; d[19][43] = O; d[19][44] = O;
  return d;
})()};

// secretary_desk_only 32x20: Same size as worker, darker mahogany wood. No computer.
FURNITURE["secretary_desk_only"] = { width: 32, height: 20, pixels: (() => {
  const d = makeGrid(32, 20);
  // Top surface rows 0-7 (lighter mahogany, 8 rows)
  for (let x = 1; x <= 30; x++) d[0][x] = O;
  for (let y = 1; y <= 7; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (y === 1) d[y][x] = 87;
      else if (y === 7) d[y][x] = 86;
      else d[y][x] = 85;
    }
  }
  // Edge line between surface and front panel
  for (let x = 0; x <= 31; x++) d[8][x] = O;
  // Front panel rows 9-16 (darker mahogany, clean)
  for (let y = 9; y <= 16; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) {
      if (x === 1) d[y][x] = 88;
      else if (y === 16) d[y][x] = 88;
      else d[y][x] = 86;
    }
  }
  // Bottom outline
  for (let x = 0; x <= 31; x++) d[17][x] = O;
  // Legs
  d[18][2] = O; d[18][3] = 88; d[18][28] = O; d[18][29] = 88;
  d[19][2] = O; d[19][3] = O; d[19][28] = O; d[19][29] = O;
  return d;
})()};

// Standalone monitor 12x12 - bright screen, slim stand, 3 variants for cycling
// Layout: Row 0 top frame, Rows 1-6 screen, Row 7 bottom frame, Row 8 stand neck, Row 9 base, Rows 10-11 keyboard
for (const [suffix, screenColor] of [
  ["green", 125],   // bright green #88ccaa
  ["blue", 126],    // bright blue #88aadd
  ["bright", 129],  // bright green highlight #a0e8c0
] as const) {
  FURNITURE[`monitor_standalone_${suffix}`] = { width: 12, height: 12, pixels: (() => {
    const d = makeGrid(12, 12);
    // Row 0: top frame
    for (let x = 1; x <= 10; x++) d[0][x] = 127; // white frame
    d[0][0] = O; d[0][11] = O;
    // Rows 1-6: screen area with frame sides
    for (let y = 1; y <= 6; y++) {
      d[y][0] = O;
      d[y][1] = 128; // light gray frame left
      d[y][10] = 128; // light gray frame right
      d[y][11] = O;
      for (let x = 2; x <= 9; x++) {
        d[y][x] = screenColor; // BRIGHT screen
      }
    }
    // Row 7: bottom frame
    d[7][0] = O;
    for (let x = 1; x <= 10; x++) d[7][x] = 127; // white frame
    d[7][11] = O;
    // Row 8: stand/neck (slim, 1px)
    d[8][5] = 128; d[8][6] = 128;
    // Row 9: base (compact)
    for (let x = 4; x <= 7; x++) d[9][x] = 49;
    // Rows 10-11: keyboard
    for (let x = 2; x <= 9; x++) d[10][x] = 49;
    for (let x = 3; x <= 8; x++) d[11][x] = 82;
    return d;
  })()};
}

// Standalone monitor OFF state - dark/black screen
FURNITURE["monitor_standalone_off"] = { width: 12, height: 12, pixels: (() => {
  const d = makeGrid(12, 12);
  // Row 0: top frame
  for (let x = 1; x <= 10; x++) d[0][x] = 128; // gray frame (dimmer than on)
  d[0][0] = O; d[0][11] = O;
  // Rows 1-6: dark screen with frame sides
  for (let y = 1; y <= 6; y++) {
    d[y][0] = O;
    d[y][1] = 49; // dark gray frame left
    d[y][10] = 49; // dark gray frame right
    d[y][11] = O;
    for (let x = 2; x <= 9; x++) {
      d[y][x] = 82; // dark screen (near black)
    }
  }
  // Row 7: bottom frame
  d[7][0] = O;
  for (let x = 1; x <= 10; x++) d[7][x] = 128; // gray frame
  d[7][11] = O;
  // Row 8: stand/neck (slim, 1px)
  d[8][5] = 128; d[8][6] = 128;
  // Row 9: base (compact)
  for (let x = 4; x <= 7; x++) d[9][x] = 49;
  // Rows 10-11: keyboard
  for (let x = 2; x <= 9; x++) d[10][x] = 49;
  for (let x = 3; x <= 8; x++) d[11][x] = 82;
  return d;
})()};

// Bookshelf 32x24 - against back wall, books with colored spines, 3/4 perspective
FURNITURE["bookshelf"] = { width: 32, height: 24, pixels: (() => {
  const d = makeGrid(32, 24);
  // Top surface y0-2 (lighter wood)
  for (let x = 1; x <= 30; x++) d[0][x] = O;
  for (let y = 1; y <= 2; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) d[y][x] = (y === 1) ? 87 : 91;
  }
  // Shadow line
  for (let x = 0; x <= 31; x++) d[3][x] = O;
  // Front face with two shelves of books y4-22
  for (let y = 4; y <= 22; y++) {
    d[y][0] = O; d[y][31] = O;
    for (let x = 1; x <= 30; x++) d[y][x] = 92; // dark wood background
  }
  // Shelf divider y12-13
  for (let x = 1; x <= 30; x++) { d[12][x] = 91; d[13][x] = O; }
  // Top row of books y4-11
  const topBooks: [number, number][] = [
    [2,93],[4,94],[6,95],[8,96],[10,97],[12,93],[14,94],[16,95],
    [18,96],[20,97],[22,93],[24,94],[26,95],[28,96],
  ];
  for (const [bx, bc] of topBooks) {
    for (let y = 5; y <= 11; y++) {
      d[y][bx] = bc;
      d[y][bx+1] = bc;
    }
    d[4][bx] = 98; d[4][bx+1] = 98; // page tops visible
  }
  // Bottom row of books y14-21
  const botBooks: [number, number][] = [
    [3,96],[5,93],[7,97],[9,94],[11,95],[13,93],[15,96],[17,94],
    [19,95],[21,97],[23,93],[25,96],[27,94],
  ];
  for (const [bx, bc] of botBooks) {
    for (let y = 15; y <= 21; y++) {
      d[y][bx] = bc;
      d[y][bx+1] = bc;
    }
    d[14][bx] = 98; d[14][bx+1] = 98;
  }
  // Bottom outline
  for (let x = 0; x <= 31; x++) d[23][x] = O;
  // Side depth strips
  for (let y = 4; y <= 22; y++) { d[y][1] = 88; d[y][30] = 88; }
  return d;
})()};

// Filing cabinet 16x20 - small metal cabinet, 3/4 perspective
FURNITURE["filing_cabinet"] = { width: 16, height: 20, pixels: (() => {
  const d = makeGrid(16, 20);
  // Top surface y0-2 (lighter metal)
  for (let x = 2; x <= 13; x++) d[0][x] = O;
  for (let y = 1; y <= 2; y++) {
    d[y][1] = O; d[y][14] = O;
    for (let x = 2; x <= 13; x++) d[y][x] = (y === 1) ? 101 : 99;
  }
  // Shadow line
  for (let x = 1; x <= 14; x++) d[3][x] = O;
  // Front body y4-17 (darker metal)
  for (let y = 4; y <= 17; y++) {
    d[y][1] = O; d[y][14] = O;
    for (let x = 2; x <= 13; x++) {
      if (x === 2) d[y][x] = 102;
      else d[y][x] = 100;
    }
  }
  // Two drawer fronts
  // Top drawer y5-9
  for (let y = 5; y <= 9; y++) {
    for (let x = 3; x <= 12; x++) d[y][x] = 99;
  }
  d[7][7] = 48; d[7][8] = 48; // handle
  // Bottom drawer y11-15
  for (let y = 11; y <= 15; y++) {
    for (let x = 3; x <= 12; x++) d[y][x] = 99;
  }
  d[13][7] = 48; d[13][8] = 48; // handle
  // Bottom outline
  for (let x = 1; x <= 14; x++) d[18][x] = O;
  // Feet
  d[19][2] = 102; d[19][3] = 102; d[19][12] = 102; d[19][13] = 102;
  return d;
})()};

// Signal tower 32x48 (2 tiles wide, 3 tiles tall) - telecom lattice tower with panel antennas
FURNITURE["signal_tower"] = { width: 32, height: 48, pixels: (() => {
  const d = makeGrid(32, 48);
  const M  = 48;   // metal grey
  const MH = 81;   // metal highlight
  const MD = 49;   // metal dark
  const MK = 82;   // metal darkest
  const RD = 12;   // red warning light
  const RS = 13;   // red shadow
  const SG = 40;   // signal wave (sky blue)
  const PV = 107;  // pavement light (foundation top)
  const PM = 108;  // pavement mid (foundation front)

  // Helper: draw diagonal line (Bresenham-like interpolation)
  const line = (x1: number, y1: number, x2: number, y2: number, c: number) => {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    if (steps === 0) { d[y1][x1] = c; return; }
    for (let i = 0; i <= steps; i++) {
      d[Math.round(y1 + (y2 - y1) * i / steps)][Math.round(x1 + (x2 - x1) * i / steps)] = c;
    }
  };

  // ===== AVIATION WARNING LIGHT (rows 0-1) =====
  d[0][15] = RD; d[0][16] = RD;
  d[1][15] = RS; d[1][16] = RS;

  // ===== ANTENNA MAST (rows 2-5) =====
  for (let y = 2; y <= 5; y++) { d[y][15] = O; d[y][16] = MH; }
  // Whip antennas angled outward
  d[2][13] = MD; d[3][12] = MD;
  d[2][18] = MD; d[3][19] = MD;

  // ===== TOP PLATFORM (rows 6-7) =====
  for (let x = 12; x <= 19; x++) d[6][x] = O;
  for (let x = 13; x <= 18; x++) d[7][x] = MH;
  d[7][12] = O; d[7][19] = O;

  // ===== PANEL ANTENNAS LEVEL 1 + MAST (rows 8-12) =====
  // Tower center mast
  for (let y = 8; y <= 12; y++) {
    d[y][14] = O; d[y][15] = MD; d[y][16] = M; d[y][17] = O;
  }
  // Left panel antenna (3px wide box)
  for (let x = 9; x <= 11; x++) d[8][x] = O;
  for (let y = 9; y <= 11; y++) { d[y][9] = O; d[y][10] = MH; d[y][11] = M; }
  for (let x = 9; x <= 11; x++) d[12][x] = O;
  d[10][12] = MD; d[10][13] = MD;  // connecting arm
  // Right panel antenna
  for (let x = 20; x <= 22; x++) d[8][x] = O;
  for (let y = 9; y <= 11; y++) { d[y][20] = M; d[y][21] = MH; d[y][22] = O; }
  for (let x = 20; x <= 22; x++) d[12][x] = O;
  d[10][18] = MD; d[10][19] = MD;  // connecting arm

  // ===== SIGNAL WAVE ARCS (rows 8-12) =====
  // Inner arc left
  d[8][7] = SG; d[9][6] = SG; d[10][6] = SG; d[11][6] = SG; d[12][7] = SG;
  // Outer arc left
  d[8][4] = SG; d[9][3] = SG; d[10][3] = SG; d[11][3] = SG; d[12][4] = SG;
  // Inner arc right
  d[8][24] = SG; d[9][25] = SG; d[10][25] = SG; d[11][25] = SG; d[12][24] = SG;
  // Outer arc right
  d[8][27] = SG; d[9][28] = SG; d[10][28] = SG; d[11][28] = SG; d[12][27] = SG;

  // ===== STRUT + SECTION A (rows 13-20, legs at 13,18) =====
  for (let x = 13; x <= 18; x++) d[13][x] = MK;
  line(14, 14, 17, 20, MK);   // X-brace diagonal \
  line(17, 14, 14, 20, MK);   // X-brace diagonal /
  for (let y = 14; y <= 20; y++) { d[y][13] = O; d[y][18] = O; }

  // ===== STRUT + SECTION B (rows 21-28, legs at 11,20) =====
  for (let x = 11; x <= 20; x++) d[21][x] = MK;
  line(12, 22, 19, 28, MK);   // X-brace diagonal \
  line(19, 22, 12, 28, MK);   // X-brace diagonal /
  for (let y = 22; y <= 28; y++) { d[y][11] = O; d[y][20] = O; }
  // Small panel antennas level 2
  d[22][8] = O; d[22][9] = O;
  d[23][8] = MH; d[23][9] = M;
  d[24][8] = O; d[24][9] = O;
  d[23][10] = MD;  // arm
  d[22][22] = O; d[22][23] = O;
  d[23][22] = M; d[23][23] = MH;
  d[24][22] = O; d[24][23] = O;
  d[23][21] = MD;  // arm

  // ===== STRUT + SECTION C (rows 29-37, legs at 9,22) =====
  for (let x = 9; x <= 22; x++) d[29][x] = MK;
  line(10, 30, 21, 37, MK);   // X-brace diagonal \
  line(21, 30, 10, 37, MK);   // X-brace diagonal /
  for (let x = 9; x <= 22; x++) d[33][x] = MK;  // mid strut
  for (let y = 30; y <= 37; y++) { d[y][9] = O; d[y][22] = O; }

  // ===== BASE STRUT (row 38) =====
  for (let x = 8; x <= 23; x++) d[38][x] = O;

  // ===== FOUNDATION (rows 39-46) =====
  // Top surface (lighter, 3/4 perspective)
  for (let y = 39; y <= 41; y++) {
    d[y][8] = O; d[y][23] = O;
    for (let x = 9; x <= 22; x++) d[y][x] = PV;
  }
  // Shadow line
  for (let x = 8; x <= 23; x++) d[42][x] = O;
  // Front face (darker)
  for (let y = 43; y <= 45; y++) {
    d[y][8] = O; d[y][23] = O;
    for (let x = 9; x <= 22; x++) d[y][x] = PM;
  }
  // Bottom outline
  for (let x = 8; x <= 23; x++) d[46][x] = O;

  return d;
})()};
