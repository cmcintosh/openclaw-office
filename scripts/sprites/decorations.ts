// Decoration sprites - plants, coffee machine, etc.

import { _, O } from './palette';
import type { SpriteData } from './tiles';

function makeGrid(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(_));
}

export const DECORATIONS: Record<string, SpriteData> = {};

// Coffee machine 16x24 (taller) - 3/4 perspective
DECORATIONS["coffee_machine"] = { width: 16, height: 24, pixels: (() => {
  const d = makeGrid(16, 24);
  // === Water bottle (blue, same width as machine) rows 0-10 ===
  // Row 0: top outline
  for (let x = 4; x <= 11; x++) d[0][x] = O;
  // Rows 1-8: bottle body (blue water, full width)
  for (let y = 1; y <= 8; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) {
      d[y][x] = (x === 4) ? 126 : 125;  // left side darker blue, rest lighter
    }
  }
  // Row 9: bottle bottom + narrowed neck into machine
  d[9][3] = O; d[9][12] = O;
  d[9][4] = O; d[9][11] = O;
  for (let x = 5; x <= 10; x++) d[9][x] = 126;  // narrow blue neck
  // === Dispenser body (white/light grey) rows 10-21 ===
  // Rows 10-20: machine body
  for (let y = 10; y <= 20; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) d[y][x] = 128;  // light grey body
  }
  // Taps row 13: red (hot) and blue (cold)
  d[13][5] = 12; d[13][6] = 12;   // red tap
  d[13][9] = 126; d[13][10] = 126; // blue tap
  // Drip tray row 16-17
  for (let x = 4; x <= 11; x++) d[16][x] = O;
  for (let x = 5; x <= 10; x++) d[17][x] = 81;  // tray surface
  for (let x = 4; x <= 11; x++) d[18][x] = O;
  // Row 21: bottom outline
  for (let x = 3; x <= 12; x++) d[21][x] = O;
  // Rows 22-23: feet
  d[22][4] = O; d[22][5] = O; d[22][10] = O; d[22][11] = O;
  return d;
})()};

// Minecraft village-style bell 16x32 (1x2 tiles)
// Dark oak frame with golden bell hanging from crossbeam.
DECORATIONS["office_clock"] = { width: 16, height: 32, pixels: (() => {
  const d = makeGrid(16, 32);
  // Color aliases
  const WOOD_LT = 42;   // door brown (dark oak light face)
  const WOOD_DK = 43;   // door shadow (dark oak dark face)
  const WOOD_TOP = 46;  // pot brown (wood top surface)
  const GOLD_LT = 16;   // shirt yellow (bell highlight)
  const GOLD_MD = 17;   // shirt yellow shadow (bell mid)
  const GOLD_DK = 89;   // nameplate gold (bell shadow)
  const GOLD_DD = 90;   // nameplate shadow (bell darkest)
  const STONE_LT = 107; // pavement light (base)
  const STONE_MD = 108; // pavement mid
  const STONE_DK = 109; // pavement dark

  // === Stone base (rows 26-31) ===
  // Bottom slab
  for (let y = 28; y <= 30; y++) {
    for (let x = 2; x <= 13; x++) d[y][x] = STONE_MD;
    d[y][2] = O; d[y][13] = O;
    d[y][3] = STONE_LT; d[y][12] = STONE_DK;
  }
  for (let x = 2; x <= 13; x++) d[31][x] = O;
  for (let x = 2; x <= 13; x++) d[27][x] = O;
  // Upper slab (narrower)
  for (let y = 25; y <= 26; y++) {
    for (let x = 3; x <= 12; x++) d[y][x] = STONE_MD;
    d[y][3] = O; d[y][12] = O;
    d[y][4] = STONE_LT; d[y][11] = STONE_DK;
  }
  for (let x = 3; x <= 12; x++) d[24][x] = O;

  // === Left post (dark oak log) rows 5-24 ===
  for (let y = 5; y <= 24; y++) {
    d[y][3] = O;
    d[y][4] = WOOD_LT;
    d[y][5] = WOOD_DK;
  }

  // === Right post (dark oak log) rows 5-24 ===
  for (let y = 5; y <= 24; y++) {
    d[y][10] = WOOD_LT;
    d[y][11] = WOOD_DK;
    d[y][12] = O;
  }

  // === Crossbeam (top bar) rows 3-5 ===
  for (let x = 3; x <= 12; x++) {
    d[3][x] = O;
    d[4][x] = WOOD_TOP;
    d[5][x] = WOOD_LT;
  }
  // outline edges
  d[4][3] = O; d[4][12] = O;

  // === Post caps (decorative tops) ===
  d[4][4] = WOOD_LT; d[4][5] = WOOD_DK;
  d[4][10] = WOOD_LT; d[4][11] = WOOD_DK;

  // === Hanging chain (rows 6-8) ===
  d[6][7] = O; d[6][8] = O;
  d[7][7] = 48; d[7][8] = 49; // metal grey
  d[8][7] = 48; d[8][8] = 49;

  // === Bell (rows 9-21) - flared shape ===
  // Top cap (narrow, 4px wide)
  for (let x = 6; x <= 9; x++) { d[9][x] = O; }
  for (let x = 6; x <= 9; x++) { d[10][x] = GOLD_DK; }
  d[10][6] = O; d[10][9] = O;
  d[10][7] = GOLD_LT; d[10][8] = GOLD_MD;

  // Upper body (6px wide, rows 11-13)
  for (let y = 11; y <= 13; y++) {
    for (let x = 5; x <= 10; x++) d[y][x] = GOLD_MD;
    d[y][5] = O; d[y][10] = O;
    d[y][6] = GOLD_LT; d[y][9] = GOLD_DK;
  }
  // highlight stripe
  d[12][7] = GOLD_LT;

  // Mid body widens (8px wide, rows 14-17)
  for (let y = 14; y <= 17; y++) {
    for (let x = 4; x <= 11; x++) d[y][x] = GOLD_MD;
    d[y][4] = O; d[y][11] = O;
    d[y][5] = GOLD_LT; d[y][10] = GOLD_DK;
  }
  // highlight
  d[15][6] = GOLD_LT; d[16][6] = GOLD_LT;

  // Lower flare (10px wide, rows 18-20)
  for (let y = 18; y <= 20; y++) {
    for (let x = 3; x <= 12; x++) d[y][x] = GOLD_MD;
    d[y][3] = O; d[y][12] = O;
    d[y][4] = GOLD_LT; d[y][11] = GOLD_DK;
  }
  // Bottom rim outline
  for (let x = 3; x <= 12; x++) d[21][x] = O;

  // Lip rim (bright gold edge)
  d[20][4] = GOLD_LT; d[20][5] = GOLD_LT;
  d[20][10] = GOLD_DD; d[20][11] = GOLD_DD;

  // Clapper nub poking out below bell (centered at x=7,8)
  d[21][7] = 49; d[21][8] = 48;  // metal dark + grey
  d[22][7] = O;  d[22][8] = O;

  return d;
})()};

// Settings icon (gear) 12x12 - used by office character menu top-right button.
DECORATIONS["icon_settings"] = { width: 12, height: 12, pixels: (() => {
  const d = makeGrid(12, 12);
  const GEAR_LT = 81; // light gray
  const GEAR_MD = 48; // medium gray
  const GEAR_DK = 49; // dark gray

  // Teeth
  d[0][5] = O; d[0][6] = O;
  d[1][2] = O; d[1][9] = O;
  d[2][1] = O; d[2][10] = O;
  d[5][0] = O; d[5][11] = O;
  d[6][0] = O; d[6][11] = O;
  d[9][1] = O; d[9][10] = O;
  d[10][2] = O; d[10][9] = O;
  d[11][5] = O; d[11][6] = O;

  // Outer ring
  for (let x = 3; x <= 8; x++) {
    d[1][x] = O;
    d[10][x] = O;
  }
  for (let y = 3; y <= 8; y++) {
    d[y][1] = O;
    d[y][10] = O;
  }
  d[2][2] = O; d[2][9] = O;
  d[9][2] = O; d[9][9] = O;
  d[2][3] = GEAR_MD; d[2][8] = GEAR_MD;
  d[3][2] = GEAR_MD; d[3][9] = GEAR_MD;
  d[8][2] = GEAR_MD; d[8][9] = GEAR_MD;
  d[9][3] = GEAR_MD; d[9][8] = GEAR_MD;

  // Body fill
  for (let y = 3; y <= 8; y++) {
    for (let x = 3; x <= 8; x++) {
      d[y][x] = GEAR_LT;
    }
  }
  for (let x = 4; x <= 7; x++) {
    d[2][x] = GEAR_MD;
    d[9][x] = GEAR_MD;
  }
  for (let y = 4; y <= 7; y++) {
    d[y][2] = GEAR_MD;
    d[y][9] = GEAR_MD;
  }

  // Inner hole
  d[4][4] = O; d[4][5] = O; d[4][6] = O; d[4][7] = O;
  d[5][4] = O; d[5][7] = O;
  d[6][4] = O; d[6][7] = O;
  d[7][4] = O; d[7][5] = O; d[7][6] = O; d[7][7] = O;
  d[5][5] = GEAR_DK; d[5][6] = GEAR_DK;
  d[6][5] = GEAR_DK; d[6][6] = GEAR_DK;

  return d;
})()};

// Close icon (X) 12x12 - used by office character menu top-right close button.
DECORATIONS["icon_close"] = { width: 12, height: 12, pixels: (() => {
  const d = makeGrid(12, 12);
  const X_LT = 81; // light gray
  const X_MD = 48; // medium gray

  // Outer X shape (outline in O)
  // Top-left to bottom-right diagonal + top-right to bottom-left diagonal
  d[0][0] = O; d[0][1] = O; d[0][10] = O; d[0][11] = O;
  d[1][0] = O; d[1][1] = X_LT; d[1][2] = O; d[1][9] = O; d[1][10] = X_LT; d[1][11] = O;
  d[2][1] = O; d[2][2] = X_LT; d[2][3] = O; d[2][8] = O; d[2][9] = X_LT; d[2][10] = O;
  d[3][2] = O; d[3][3] = X_MD; d[3][4] = O; d[3][7] = O; d[3][8] = X_MD; d[3][9] = O;
  d[4][3] = O; d[4][4] = X_MD; d[4][5] = O; d[4][6] = O; d[4][7] = X_MD; d[4][8] = O;
  d[5][4] = O; d[5][5] = X_MD; d[5][6] = X_MD; d[5][7] = O;
  d[6][4] = O; d[6][5] = X_MD; d[6][6] = X_MD; d[6][7] = O;
  d[7][3] = O; d[7][4] = X_MD; d[7][5] = O; d[7][6] = O; d[7][7] = X_MD; d[7][8] = O;
  d[8][2] = O; d[8][3] = X_MD; d[8][4] = O; d[8][7] = O; d[8][8] = X_MD; d[8][9] = O;
  d[9][1] = O; d[9][2] = X_LT; d[9][3] = O; d[9][8] = O; d[9][9] = X_LT; d[9][10] = O;
  d[10][0] = O; d[10][1] = X_LT; d[10][2] = O; d[10][9] = O; d[10][10] = X_LT; d[10][11] = O;
  d[11][0] = O; d[11][1] = O; d[11][10] = O; d[11][11] = O;

  return d;
})()};

// Plant 1 - 16x24 (taller pot + leaves) - 3/4 perspective
DECORATIONS["plant_1"] = { width: 16, height: 24, pixels: (() => {
  const d = makeGrid(16, 24);

  // Foliage: round, layered canopy (y2-12)
  // Use concentric oval layers: bright center, darker edges
  const foliage: [number, number, number, number][] = [
    // [startX, endX, y, color]
    // Top tuft
    [6, 9, 2, 44],
    // Upper canopy (bright)
    [5, 10, 3, 44],
    [4, 11, 4, 44],
    [3, 12, 5, 77],
    [3, 12, 6, 44],
    [3, 12, 7, 77],
    [4, 11, 8, 45],
    [4, 11, 9, 45],
    [5, 10, 10, 45],
    [6, 9, 11, 78],
  ];
  for (const [sx, ex, fy, fc] of foliage) {
    for (let x = sx; x <= ex; x++) {
      // Add variation: edges darker, center brighter
      if (x === sx || x === ex) d[fy][x] = 78;       // darkest edge
      else if (x === sx + 1 || x === ex - 1) d[fy][x] = 45; // dark
      else d[fy][x] = fc;                              // main color
    }
  }
  // Highlight spots for volume
  d[4][7] = 44; d[4][8] = 44;
  d[5][6] = 44; d[5][7] = 44; d[5][8] = 44; d[5][9] = 44;
  d[6][6] = 44; d[6][7] = 77; d[6][8] = 77; d[6][9] = 44;

  // Stem (y11-14)
  for (let y = 11; y <= 14; y++) { d[y][7] = 45; d[y][8] = 78; }

  // Pot top surface y14-16
  for (let x = 4; x <= 11; x++) d[14][x] = O;
  for (let y = 15; y <= 16; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) d[y][x] = 79;
  }
  // Pot edge
  for (let x = 3; x <= 12; x++) d[17][x] = O;
  // Pot front y18-22
  for (let y = 18; y <= 22; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) d[y][x] = 47;
  }
  for (let x = 4; x <= 11; x++) d[23][x] = O;
  return d;
})()};

// Plant 2 (cactus) - 16x24
DECORATIONS["plant_2"] = { width: 16, height: 24, pixels: (() => {
  const d = makeGrid(16, 24);
  // Pot with 3/4 perspective
  for (let x = 5; x <= 10; x++) d[16][x] = O;
  for (let y = 17; y <= 18; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) d[y][x] = 79;
  }
  for (let x = 4; x <= 11; x++) d[19][x] = O;
  for (let y = 20; y <= 22; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) d[y][x] = (x === 5) ? 80 : 47;
  }
  for (let x = 4; x <= 11; x++) d[23][x] = O;
  // Cactus body x7-8, y2-15
  for (let y = 2; y <= 15; y++) {
    d[y][6] = O; d[y][9] = O;
    d[y][7] = 44; d[y][8] = 45;
  }
  d[1][7] = O; d[1][8] = O; d[16][7] = 45; d[16][8] = 45;
  // Left arm y5-8
  d[5][3] = O; d[5][4] = O;
  d[6][3] = O; d[6][4] = 44; d[6][5] = 44;
  d[7][3] = O; d[7][4] = 44; d[7][5] = 44;
  d[8][4] = O; d[8][5] = O;
  // Right arm y7-10
  d[7][10] = 45; d[7][11] = O;
  d[8][10] = 45; d[8][11] = 45; d[8][12] = O;
  d[9][10] = 45; d[9][11] = 45; d[9][12] = O;
  d[10][10] = O; d[10][11] = O;
  return d;
})()};

// Plant 3 (small bush/shrub) - 16x24, low wide foliage for outdoor/entrance
DECORATIONS["plant_3"] = { width: 16, height: 24, pixels: (() => {
  const d = makeGrid(16, 24);
  // Pot top surface y16-18 (wider, shallow planter)
  for (let x = 2; x <= 13; x++) d[16][x] = O;
  for (let y = 17; y <= 18; y++) {
    d[y][1] = O; d[y][14] = O;
    for (let x = 2; x <= 13; x++) d[y][x] = 79;
  }
  for (let x = 1; x <= 14; x++) d[19][x] = O;
  // Pot front y20-22
  for (let y = 20; y <= 22; y++) {
    d[y][2] = O; d[y][13] = O;
    for (let x = 3; x <= 12; x++) d[y][x] = (x === 3) ? 80 : 47;
  }
  for (let x = 2; x <= 13; x++) d[23][x] = O;
  // Bush foliage - wide and round, tree-foliage greens for variety
  const bush: [number, number, number][] = [
    [6,4,O],[7,4,O],[8,4,O],[9,4,O],
    [5,5,O],[6,5,114],[7,5,113],[8,5,113],[9,5,114],[10,5,O],
    [4,6,O],[5,6,114],[6,6,113],[7,6,113],[8,6,112],[9,6,113],[10,6,114],[11,6,O],
    [3,7,O],[4,7,114],[5,7,113],[6,7,112],[7,7,113],[8,7,112],[9,7,113],[10,7,112],[11,7,114],[12,7,O],
    [2,8,O],[3,8,114],[4,8,113],[5,8,112],[6,8,113],[7,8,112],[8,8,112],[9,8,113],[10,8,112],[11,8,113],[12,8,114],[13,8,O],
    [2,9,O],[3,9,113],[4,9,112],[5,9,113],[6,9,112],[7,9,112],[8,9,112],[9,9,112],[10,9,113],[11,9,112],[12,9,113],[13,9,O],
    [2,10,O],[3,10,113],[4,10,112],[5,10,112],[6,10,115],[7,10,112],[8,10,112],[9,10,115],[10,10,112],[11,10,112],[12,10,113],[13,10,O],
    [2,11,O],[3,11,112],[4,11,112],[5,11,115],[6,11,112],[7,11,112],[8,11,112],[9,11,112],[10,11,115],[11,11,112],[12,11,112],[13,11,O],
    [3,12,O],[4,12,112],[5,12,115],[6,12,112],[7,12,112],[8,12,112],[9,12,112],[10,12,115],[11,12,112],[12,12,O],
    [3,13,O],[4,13,115],[5,13,112],[6,13,112],[7,13,112],[8,13,112],[9,13,112],[10,13,115],[11,13,112],[12,13,O],
    [4,14,O],[5,14,112],[6,14,115],[7,14,112],[8,14,112],[9,14,115],[10,14,112],[11,14,O],
    [5,15,O],[6,15,112],[7,15,112],[8,15,112],[9,15,112],[10,15,O],
  ];
  for (const [bx, by, bc] of bush) d[by][bx] = bc;
  // Stems
  d[15][7] = 45; d[15][8] = 78; d[16][7] = 45; d[16][8] = 78;
  return d;
})()};

// Tree 16x24 - brown trunk 2px wide + green canopy circle, 3/4 perspective
DECORATIONS["tree"] = { width: 16, height: 24, pixels: (() => {
  const d = makeGrid(16, 24);
  // Trunk y16-23, centered (x7-8)
  for (let y = 16; y <= 23; y++) {
    d[y][7] = 111; d[y][8] = 111;
  }
  d[23][6] = O; d[23][7] = O; d[23][8] = O; d[23][9] = O; // base outline
  // Canopy - round green circle y0-15
  // Using tree foliage palette colors: 112 dark, 113 mid, 114 highlight, 115 darkest
  const canopy: [number, number, number][] = [
    // Row 0-1: top
    [6,0,O],[7,0,O],[8,0,O],[9,0,O],
    [5,1,O],[6,1,114],[7,1,114],[8,1,113],[9,1,113],[10,1,O],
    // Row 2-3
    [4,2,O],[5,2,114],[6,2,114],[7,2,113],[8,2,113],[9,2,113],[10,2,112],[11,2,O],
    [3,3,O],[4,3,114],[5,3,114],[6,3,113],[7,3,113],[8,3,113],[9,3,112],[10,3,112],[11,3,112],[12,3,O],
    // Row 4-7: widest part
    [2,4,O],[3,4,114],[4,4,114],[5,4,113],[6,4,113],[7,4,113],[8,4,113],[9,4,112],[10,4,112],[11,4,112],[12,4,115],[13,4,O],
    [2,5,O],[3,5,114],[4,5,113],[5,5,113],[6,5,113],[7,5,113],[8,5,112],[9,5,112],[10,5,112],[11,5,115],[12,5,115],[13,5,O],
    [2,6,O],[3,6,113],[4,6,113],[5,6,113],[6,6,113],[7,6,112],[8,6,112],[9,6,112],[10,6,112],[11,6,115],[12,6,115],[13,6,O],
    [2,7,O],[3,7,113],[4,7,113],[5,7,113],[6,7,112],[7,7,112],[8,7,112],[9,7,112],[10,7,115],[11,7,115],[12,7,115],[13,7,O],
    // Row 8-11: still wide
    [2,8,O],[3,8,113],[4,8,113],[5,8,112],[6,8,112],[7,8,112],[8,8,112],[9,8,115],[10,8,115],[11,8,115],[12,8,115],[13,8,O],
    [2,9,O],[3,9,113],[4,9,112],[5,9,112],[6,9,112],[7,9,112],[8,9,112],[9,9,115],[10,9,115],[11,9,115],[12,9,115],[13,9,O],
    [3,10,O],[4,10,112],[5,10,112],[6,10,112],[7,10,112],[8,10,115],[9,10,115],[10,10,115],[11,10,115],[12,10,O],
    [3,11,O],[4,11,112],[5,11,112],[6,11,112],[7,11,115],[8,11,115],[9,11,115],[10,11,115],[11,11,115],[12,11,O],
    // Row 12-15: tapering
    [4,12,O],[5,12,112],[6,12,112],[7,12,115],[8,12,115],[9,12,115],[10,12,115],[11,12,O],
    [4,13,O],[5,13,112],[6,13,115],[7,13,115],[8,13,115],[9,13,115],[10,13,115],[11,13,O],
    [5,14,O],[6,14,112],[7,14,115],[8,14,115],[9,14,115],[10,14,O],
    [6,15,O],[7,15,112],[8,15,112],[9,15,O],
  ];
  for (const [cx, cy, cc] of canopy) d[cy][cx] = cc;
  return d;
})()};

// Car 32x16 - small Kairosoft-style car, 3/4 side view
DECORATIONS["car"] = { width: 32, height: 16, pixels: (() => {
  const d = makeGrid(32, 16);
  // Car body - red, side view facing right
  // Roof/cabin y1-5
  for (let x = 10; x <= 21; x++) d[0][x] = O; // roof top
  for (let y = 1; y <= 4; y++) {
    d[y][9] = O; d[y][22] = O;
    for (let x = 10; x <= 21; x++) d[y][x] = 118; // body
  }
  // Windows y2-3 (inside cabin)
  for (let x = 11; x <= 14; x++) { d[2][x] = 120; d[3][x] = 120; } // rear window
  for (let x = 17; x <= 20; x++) { d[2][x] = 120; d[3][x] = 120; } // front window
  d[2][15] = 118; d[3][15] = 118; d[2][16] = 118; d[3][16] = 118; // pillar between windows
  // Window frame highlight
  d[1][11] = 122; d[1][12] = 122; d[1][17] = 122; d[1][18] = 122;
  // Cabin-to-body transition
  for (let x = 9; x <= 22; x++) d[5][x] = O;
  // Main body y6-10
  for (let x = 3; x <= 28; x++) d[5][x] = O; // body top outline
  for (let y = 6; y <= 10; y++) {
    d[y][2] = O; d[y][29] = O;
    for (let x = 3; x <= 28; x++) {
      if (y === 6) d[y][x] = 122; // highlight strip
      else if (y === 10) d[y][x] = 119; // shadow bottom
      else d[y][x] = 118;
    }
  }
  // Headlights and taillights
  d[7][28] = 30; d[8][28] = 30; // front headlight (yellow)
  d[7][3] = 12; d[8][3] = 12; // rear taillight (red)
  // Bumpers
  for (let x = 2; x <= 29; x++) d[11][x] = O;
  for (let x = 3; x <= 28; x++) d[11][x] = 49; // dark bumper
  // Wheels
  // Rear wheel at x6-9, y11-14
  d[11][6] = O; d[11][7] = O; d[11][8] = O; d[11][9] = O;
  d[12][5] = O; d[12][6] = 121; d[12][7] = 121; d[12][8] = 121; d[12][9] = 121; d[12][10] = O;
  d[13][5] = O; d[13][6] = 121; d[13][7] = 48; d[13][8] = 48; d[13][9] = 121; d[13][10] = O;
  d[14][6] = O; d[14][7] = 121; d[14][8] = 121; d[14][9] = O;
  d[15][7] = O; d[15][8] = O;
  // Front wheel at x22-25, y11-14
  d[11][22] = O; d[11][23] = O; d[11][24] = O; d[11][25] = O;
  d[12][21] = O; d[12][22] = 121; d[12][23] = 121; d[12][24] = 121; d[12][25] = 121; d[12][26] = O;
  d[13][21] = O; d[13][22] = 121; d[13][23] = 48; d[13][24] = 48; d[13][25] = 121; d[13][26] = O;
  d[14][22] = O; d[14][23] = 121; d[14][24] = 121; d[14][25] = O;
  d[15][23] = O; d[15][24] = O;
  return d;
})()};

// Whiteboard 76x36 (4.75 tiles wide, 2.25 tiles tall) - wall-mounted whiteboard with aluminum frame
DECORATIONS["whiteboard"] = { width: 76, height: 36, pixels: (() => {
  const d = makeGrid(76, 36);
  const W = 76;
  const H = 36;
  const FRAME = 81;    // silver/aluminum
  const FRAME_DK = 48; // grey shadow
  const SURFACE = 9;   // white
  const SURFACE_LT = 57; // light grey (subtle texture)

  // Top frame border (row 0-1)
  for (let x = 1; x <= W - 2; x++) d[0][x] = O;
  for (let x = 1; x <= W - 2; x++) d[1][x] = FRAME;
  d[1][0] = O; d[1][W - 1] = O;

  // Left/right frame + white surface (rows 2-29)
  for (let y = 2; y <= H - 7; y++) {
    d[y][0] = O; d[y][W - 1] = O;
    d[y][1] = FRAME; d[y][2] = FRAME;
    d[y][W - 3] = FRAME_DK; d[y][W - 2] = FRAME_DK;
    for (let x = 3; x <= W - 4; x++) {
      d[y][x] = (y % 7 === 0 || x % 10 === 3) ? SURFACE_LT : SURFACE;
    }
  }

  // Bottom frame / marker tray (rows 30-34)
  for (let x = 1; x <= W - 2; x++) d[H - 6][x] = FRAME;
  d[H - 6][0] = O; d[H - 6][W - 1] = O;
  // Tray shelf
  for (let x = 2; x <= W - 3; x++) d[H - 5][x] = FRAME;
  d[H - 5][1] = O; d[H - 5][W - 2] = O;
  // Tray front
  for (let x = 2; x <= W - 3; x++) d[H - 4][x] = FRAME_DK;
  d[H - 4][1] = O; d[H - 4][W - 2] = O;
  // Markers on the tray
  d[H - 5][14] = 12; d[H - 5][15] = 12; d[H - 5][16] = 12; // red marker
  d[H - 5][20] = 10; d[H - 5][21] = 10; d[H - 5][22] = 10; // blue marker
  d[H - 5][26] = 14; d[H - 5][27] = 14; d[H - 5][28] = 14; // green marker

  // Bottom outline
  for (let x = 1; x <= W - 2; x++) d[H - 3][x] = O;

  return d;
})()};

// Desk lamp 7x10 - connection status indicator for channel worker desks
// Three variants: on (green/connected), dim (orange/configured), off (grey/not configured)

// desk_lamp_on: green shade, bright glow
DECORATIONS["desk_lamp_on"] = { width: 7, height: 10, pixels: (() => {
  const d = makeGrid(7, 10);
  const SHADE_LT = 144;  // lamp green bright
  const SHADE_DK = 145;  // lamp green bright shadow
  const METAL = 48;      // metal grey
  const METAL_DK = 49;   // metal dark
  const GLOW = 146;      // lamp glow

  // Row 0: glow pixel above shade
  d[0][3] = GLOW;
  // Rows 1-4: trapezoid shade (wider at bottom)
  d[1][2] = O; d[1][3] = SHADE_LT; d[1][4] = O;
  d[2][1] = O; d[2][2] = SHADE_LT; d[2][3] = SHADE_LT; d[2][4] = SHADE_DK; d[2][5] = O;
  d[3][1] = O; d[3][2] = SHADE_LT; d[3][3] = SHADE_LT; d[3][4] = SHADE_DK; d[3][5] = O;
  d[4][0] = O; d[4][1] = SHADE_LT; d[4][2] = SHADE_LT; d[4][3] = SHADE_LT; d[4][4] = SHADE_DK; d[4][5] = SHADE_DK; d[4][6] = O;
  // Rows 5-7: neck
  d[5][3] = METAL; d[6][3] = METAL; d[7][3] = METAL_DK;
  // Rows 8-9: base
  d[8][1] = O; d[8][2] = METAL; d[8][3] = METAL; d[8][4] = METAL; d[8][5] = O;
  d[9][1] = O; d[9][2] = METAL_DK; d[9][3] = METAL_DK; d[9][4] = METAL_DK; d[9][5] = O;
  return d;
})()};

// desk_lamp_dim: orange/warm shade, dim glow
DECORATIONS["desk_lamp_dim"] = { width: 7, height: 10, pixels: (() => {
  const d = makeGrid(7, 10);
  const SHADE_LT = 52;  // coffee accent (orange)
  const SHADE_DK = 53;  // coffee shadow (dark orange)
  const METAL = 48;
  const METAL_DK = 49;
  const GLOW = 17;       // shirt yellow shadow (dim warm)

  // Row 0: dim glow pixel
  d[0][3] = GLOW;
  // Rows 1-4: trapezoid shade
  d[1][2] = O; d[1][3] = SHADE_LT; d[1][4] = O;
  d[2][1] = O; d[2][2] = SHADE_LT; d[2][3] = SHADE_LT; d[2][4] = SHADE_DK; d[2][5] = O;
  d[3][1] = O; d[3][2] = SHADE_LT; d[3][3] = SHADE_LT; d[3][4] = SHADE_DK; d[3][5] = O;
  d[4][0] = O; d[4][1] = SHADE_LT; d[4][2] = SHADE_LT; d[4][3] = SHADE_LT; d[4][4] = SHADE_DK; d[4][5] = SHADE_DK; d[4][6] = O;
  // Rows 5-7: neck
  d[5][3] = METAL; d[6][3] = METAL; d[7][3] = METAL_DK;
  // Rows 8-9: base
  d[8][1] = O; d[8][2] = METAL; d[8][3] = METAL; d[8][4] = METAL; d[8][5] = O;
  d[9][1] = O; d[9][2] = METAL_DK; d[9][3] = METAL_DK; d[9][4] = METAL_DK; d[9][5] = O;
  return d;
})()};

// desk_lamp_off: dark grey shade, no glow
DECORATIONS["desk_lamp_off"] = { width: 7, height: 10, pixels: (() => {
  const d = makeGrid(7, 10);
  const SHADE_LT = 49;  // metal dark
  const SHADE_DK = 82;  // metal darkest
  const METAL = 48;
  const METAL_DK = 49;

  // Row 0: no glow
  // Rows 1-4: trapezoid shade
  d[1][2] = O; d[1][3] = SHADE_LT; d[1][4] = O;
  d[2][1] = O; d[2][2] = SHADE_LT; d[2][3] = SHADE_LT; d[2][4] = SHADE_DK; d[2][5] = O;
  d[3][1] = O; d[3][2] = SHADE_LT; d[3][3] = SHADE_LT; d[3][4] = SHADE_DK; d[3][5] = O;
  d[4][0] = O; d[4][1] = SHADE_LT; d[4][2] = SHADE_LT; d[4][3] = SHADE_LT; d[4][4] = SHADE_DK; d[4][5] = SHADE_DK; d[4][6] = O;
  // Rows 5-7: neck
  d[5][3] = METAL; d[6][3] = METAL; d[7][3] = METAL_DK;
  // Rows 8-9: base
  d[8][1] = O; d[8][2] = METAL; d[8][3] = METAL; d[8][4] = METAL; d[8][5] = O;
  d[9][1] = O; d[9][2] = METAL_DK; d[9][3] = METAL_DK; d[9][4] = METAL_DK; d[9][5] = O;
  return d;
})()};


// Mailbox 14x24 - US-style rural post mailbox, 3/4 perspective
// Barrel-shaped body on a wooden post. Used as pair-request indicator.
DECORATIONS["mailbox"] = { width: 14, height: 24, pixels: (() => {
  const d = makeGrid(14, 24);
  const BODY_HI = 10;   // blue highlight (shirt blue / telegram)
  const BODY = 94;       // blue main (book spine blue)
  const BODY_DK = 11;    // blue shadow (shirt blue shadow)
  const TOP = 81;        // metal highlight (top surface)
  const METAL = 48;      // metal grey
  const METAL_DK = 49;   // metal dark
  const POST = 42;       // wood light (door brown)
  const POST_DK = 43;    // wood dark (door shadow)

  // === Barrel top (curved, rows 0-3) ===
  // Row 0: top curve outline
  for (let x = 4; x <= 9; x++) d[0][x] = O;
  // Row 1: top cap (narrow visible top)
  d[1][3] = O;
  for (let x = 4; x <= 9; x++) d[1][x] = TOP;
  d[1][10] = O;
  // Row 2: wider top surface (3/4 depth visible)
  d[2][2] = O;
  d[2][3] = BODY_HI;
  for (let x = 4; x <= 9; x++) d[2][x] = TOP;
  d[2][10] = BODY_DK;
  d[2][11] = O;
  // Row 3: transition to front face
  d[3][1] = O;
  d[3][2] = BODY_HI;
  for (let x = 3; x <= 10; x++) d[3][x] = BODY;
  d[3][3] = BODY_HI;
  d[3][10] = BODY_DK;
  d[3][11] = BODY_DK;
  d[3][12] = O;

  // === Front body (rows 4-11) ===
  for (let y = 4; y <= 11; y++) {
    d[y][1] = O;
    d[y][2] = BODY_HI;  // left highlight edge
    for (let x = 3; x <= 10; x++) d[y][x] = BODY;
    d[y][11] = BODY_DK;  // right shadow edge
    d[y][12] = O;
  }

  // Mail slot (recessed dark line, rows 7-8)
  for (let x = 4; x <= 9; x++) { d[7][x] = METAL_DK; }
  d[7][4] = METAL; d[7][9] = METAL;
  // Slot lip / shadow below
  for (let x = 4; x <= 9; x++) { d[8][x] = METAL; }

  // Handle/latch on front (small knob)
  d[5][6] = METAL; d[5][7] = METAL;

  // === Bottom of body (row 12) ===
  d[12][1] = O;
  for (let x = 2; x <= 11; x++) d[12][x] = BODY_DK;
  d[12][12] = O;
  // Bottom outline
  for (let x = 1; x <= 12; x++) d[13][x] = O;

  // === Wooden post (rows 14-22, 4px wide centered) ===
  for (let y = 14; y <= 22; y++) {
    d[y][5] = POST; d[y][6] = POST; d[y][7] = POST_DK; d[y][8] = POST_DK;
  }
  // Wood grain detail
  d[16][6] = POST_DK; d[19][6] = POST_DK;
  d[17][7] = POST;    d[20][7] = POST;
  // Post base outline
  d[23][4] = O; d[23][5] = O; d[23][6] = O; d[23][7] = O; d[23][8] = O; d[23][9] = O;

  return d;
})()};

// Mailbox with flag up + envelope peeking out — indicates pending pair requests
DECORATIONS["mailbox_flag"] = { width: 14, height: 24, pixels: (() => {
  const d = makeGrid(14, 24);
  const BODY_HI = 10;
  const BODY = 94;
  const BODY_DK = 11;
  const TOP = 81;
  const METAL = 48;
  const METAL_DK = 49;
  const POST = 42;
  const POST_DK = 43;
  const FLAG = 12;       // red (shirt red)
  const FLAG_DK = 13;    // red shadow (shirt red shadow)
  const ENVELOPE = 9;    // white
  const ENV_SHADOW = 57; // light grey

  // === Barrel top (curved, rows 0-3) — same as base ===
  for (let x = 4; x <= 9; x++) d[0][x] = O;
  d[1][3] = O;
  for (let x = 4; x <= 9; x++) d[1][x] = TOP;
  d[1][10] = O;
  d[2][2] = O;
  d[2][3] = BODY_HI;
  for (let x = 4; x <= 9; x++) d[2][x] = TOP;
  d[2][10] = BODY_DK;
  d[2][11] = O;
  d[3][1] = O;
  d[3][2] = BODY_HI;
  for (let x = 3; x <= 10; x++) d[3][x] = BODY;
  d[3][3] = BODY_HI;
  d[3][10] = BODY_DK;
  d[3][11] = BODY_DK;
  d[3][12] = O;

  // === Front body (rows 4-11) ===
  for (let y = 4; y <= 11; y++) {
    d[y][1] = O;
    d[y][2] = BODY_HI;
    for (let x = 3; x <= 10; x++) d[y][x] = BODY;
    d[y][11] = BODY_DK;
    d[y][12] = O;
  }

  // Mail slot (rows 7-8)
  for (let x = 4; x <= 9; x++) { d[7][x] = METAL_DK; }
  d[7][4] = METAL; d[7][9] = METAL;
  for (let x = 4; x <= 9; x++) { d[8][x] = METAL; }

  // Envelope peeking out of slot (sticking up above slot)
  d[6][5] = ENVELOPE; d[6][6] = ENVELOPE; d[6][7] = ENV_SHADOW; d[6][8] = ENVELOPE;
  // Envelope fold line
  d[5][6] = ENV_SHADOW; d[5][7] = ENV_SHADOW;

  // Handle/latch
  d[5][6] = METAL; d[5][7] = METAL;

  // === Red flag on right side (raised position) ===
  // Flag pole (vertical, attached to right side of body)
  d[4][12] = METAL_DK;
  d[3][12] = METAL_DK;
  d[2][12] = METAL_DK;
  d[1][12] = METAL_DK;
  // Flag cloth (waving right, rows 0-2)
  d[0][11] = O; d[0][12] = O; d[0][13] = O;
  d[1][11] = FLAG; d[1][12] = FLAG; d[1][13] = FLAG;
  d[2][12] = FLAG_DK; d[2][13] = FLAG_DK;

  // === Bottom of body (row 12) ===
  d[12][1] = O;
  for (let x = 2; x <= 11; x++) d[12][x] = BODY_DK;
  d[12][12] = O;
  for (let x = 1; x <= 12; x++) d[13][x] = O;

  // === Wooden post (rows 14-22) ===
  for (let y = 14; y <= 22; y++) {
    d[y][5] = POST; d[y][6] = POST; d[y][7] = POST_DK; d[y][8] = POST_DK;
  }
  d[16][6] = POST_DK; d[19][6] = POST_DK;
  d[17][7] = POST;    d[20][7] = POST;
  d[23][4] = O; d[23][5] = O; d[23][6] = O; d[23][7] = O; d[23][8] = O; d[23][9] = O;

  return d;
})()};

// Wall calendar 16x16 - tear-off wall calendar with red header, grid of days
DECORATIONS["wall_calendar"] = { width: 16, height: 16, pixels: (() => {
  const d = makeGrid(16, 16);
  const FRAME_LT = 48;  // metal grey (frame)
  const FRAME_DK = 49;  // metal dark
  const PAPER = 9;       // white
  const PAPER_LT = 57;  // light grey (grid lines)
  const RED = 12;        // red header

  // Top frame outline
  for (let x = 2; x <= 13; x++) d[0][x] = O;
  // Red header bar rows 1-3
  for (let y = 1; y <= 3; y++) {
    d[y][1] = O; d[y][14] = O;
    for (let x = 2; x <= 13; x++) d[y][x] = RED;
  }
  // Two ring holes in header
  d[1][5] = FRAME_LT; d[1][10] = FRAME_LT;
  // Frame sides + paper body rows 4-13
  for (let y = 4; y <= 13; y++) {
    d[y][1] = O; d[y][14] = O;
    d[y][2] = FRAME_LT; d[y][13] = FRAME_DK;
    for (let x = 3; x <= 12; x++) d[y][x] = PAPER;
  }
  // Grid lines (horizontal)
  for (let x = 3; x <= 12; x++) { d[6][x] = PAPER_LT; d[9][x] = PAPER_LT; d[12][x] = PAPER_LT; }
  // Grid lines (vertical)
  for (let y = 4; y <= 13; y++) { d[y][5] = PAPER_LT; d[y][8] = PAPER_LT; d[y][10] = PAPER_LT; }
  // Small day numbers hint (a few dark dots to suggest text)
  d[5][4] = O; d[5][6] = O; d[5][9] = O; d[5][11] = O;
  d[7][3] = O; d[7][7] = O; d[7][9] = O; d[7][12] = O;
  d[10][4] = O; d[10][6] = O; d[10][11] = O;
  // Bottom frame outline
  for (let x = 1; x <= 14; x++) d[14][x] = O;
  // Shadow line at bottom
  for (let x = 2; x <= 13; x++) d[15][x] = FRAME_DK;
  return d;
})()};

// Toolbox 16x16 - classic red metal toolbox, 3/4 perspective, prominent handle + latch
DECORATIONS["toolbox"] = { width: 16, height: 16, pixels: (() => {
  const d = makeGrid(16, 16);
  const R  = 12;   // red body
  const RD = 13;   // red shadow
  const RH = 52;   // orange-red highlight (top surface)
  const M  = 48;   // metal grey
  const MD = 49;   // metal dark
  const ML = 81;   // metal light (handle highlight)

  // === Handle arch (rows 0-3) — thick, prominent ===
  d[0][5] = O; d[0][6] = O; d[0][7] = O; d[0][8] = O; d[0][9] = O; d[0][10] = O;
  d[1][4] = O; d[1][5] = ML; d[1][6] = M; d[1][7] = M; d[1][8] = M; d[1][9] = M; d[1][10] = MD; d[1][11] = O;
  d[2][3] = O; d[2][4] = ML; d[2][5] = O; d[2][6] = O; d[2][7] = O; d[2][8] = O; d[2][9] = O; d[2][10] = O; d[2][11] = MD; d[2][12] = O;
  d[3][3] = O; d[3][4] = ML; d[3][12] = MD; d[3][11] = MD; d[3][12] = O;

  // === Lid top surface (rows 3-5) — 3/4 view ===
  for (let x = 3; x <= 12; x++) d[3][x] = O;
  for (let x = 2; x <= 13; x++) d[4][x] = RH;
  d[4][1] = O; d[4][14] = O;
  for (let x = 2; x <= 13; x++) d[5][x] = RH;
  d[5][1] = O; d[5][14] = O;
  // Handle base bolts on lid
  d[4][4] = M; d[4][5] = MD; d[4][10] = M; d[4][11] = MD;

  // === Seam line (row 6) ===
  for (let x = 1; x <= 14; x++) d[6][x] = O;

  // === Box body front (rows 7-12) ===
  for (let y = 7; y <= 12; y++) {
    d[y][1] = O; d[y][14] = O;
    d[y][2] = R;
    for (let x = 3; x <= 12; x++) d[y][x] = R;
    d[y][13] = RD;
  }
  // Latch (center, 2 rows)
  d[9][6] = M; d[9][7] = ML; d[9][8] = ML; d[9][9] = M;
  d[10][6] = MD; d[10][7] = M; d[10][8] = M; d[10][9] = MD;

  // === Bottom edge (row 13) ===
  for (let x = 1; x <= 14; x++) d[13][x] = O;

  // === Feet (row 14) ===
  d[14][3] = MD; d[14][4] = MD; d[14][11] = MD; d[14][12] = MD;

  return d;
})()};

// Bench 32x16 - outdoor park bench, 3/4 perspective
DECORATIONS["bench"] = { width: 32, height: 16, pixels: (() => {
  const d = makeGrid(32, 16);
  // Backrest top surface y0-1
  for (let x = 3; x <= 28; x++) d[0][x] = O;
  for (let x = 3; x <= 28; x++) d[1][x] = 123; // wood top
  d[1][2] = O; d[1][29] = O;
  // Backrest front y2-5
  for (let x = 2; x <= 29; x++) d[2][x] = O;
  for (let y = 3; y <= 5; y++) {
    d[y][2] = O; d[y][29] = O;
    for (let x = 3; x <= 28; x++) {
      d[y][x] = (y === 5) ? 124 : 123;
    }
  }
  // Slat gaps on backrest
  for (let y = 3; y <= 5; y++) { d[y][10] = O; d[y][20] = O; }
  // Seat top surface y6-8
  for (let x = 1; x <= 30; x++) d[6][x] = O;
  for (let y = 7; y <= 8; y++) {
    d[y][1] = O; d[y][30] = O;
    for (let x = 2; x <= 29; x++) d[y][x] = 123;
  }
  // Seat front y9-10
  for (let x = 1; x <= 30; x++) d[9][x] = O;
  for (let x = 2; x <= 29; x++) d[10][x] = 124;
  d[10][1] = O; d[10][30] = O;
  for (let x = 1; x <= 30; x++) d[11][x] = O;
  // Legs y12-15
  for (let y = 12; y <= 14; y++) {
    d[y][4] = 49; d[y][5] = 82;
    d[y][26] = 49; d[y][27] = 82;
  }
  d[15][4] = O; d[15][5] = O; d[15][26] = O; d[15][27] = O;
  return d;
})()};
