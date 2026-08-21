// Female character pixel arrays - distinct silhouette from male

import { _, O } from './palette';
import type { CharColors } from './characters-male';
import type { SpriteData } from './tiles';

function makeGrid(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(_));
}

function mirror(data: number[][]): number[][] {
  return data.map(row => [...row].reverse());
}

// Female walk-down frame 0 - 16x24
// Differences from male: optional short bob or longer hair, narrower shoulders,
// slightly narrower torso, skirt option instead of pants
export function femaleWalkDown0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  // Hair top y0-2 — same round head as male
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  // Head y3-8 — same face as male
  d[3][3] = O; d[3][4] = c.hair; for (let x = 5; x <= 10; x++) d[3][x] = c.hairShd; d[3][11] = c.hair; d[3][12] = O;
  d[4][3] = O; d[4][4] = c.hair;
  d[4][5] = 2; d[4][6] = 2; d[4][7] = 2; d[4][8] = 2; d[4][9] = 2; d[4][10] = 2;
  d[4][11] = c.hair; d[4][12] = O;
  // Eyes y5
  const EYE = c.eyeColor ?? 8;
  d[5][3] = O; d[5][4] = 2;
  d[5][5] = 9; d[5][6] = EYE; d[5][7] = 2; d[5][8] = 2; d[5][9] = 9; d[5][10] = EYE;
  d[5][11] = 2; d[5][12] = O;
  // Cheeks y6
  d[6][3] = O; d[6][4] = 2;
  d[6][5] = 2; d[6][6] = 2; d[6][7] = 63; d[6][8] = 63; d[6][9] = 2; d[6][10] = 2;
  d[6][11] = 2; d[6][12] = O;
  // Mouth y7
  d[7][4] = O; d[7][5] = 2; d[7][6] = 2; d[7][7] = 3; d[7][8] = 3; d[7][9] = 2; d[7][10] = 2; d[7][11] = O;
  // Chin y8
  d[8][5] = O; d[8][6] = 2; d[8][7] = 2; d[8][8] = 2; d[8][9] = 2; d[8][10] = O;

  // FEMALE HAIR: longer drapes past chin to shoulders, or short (ear-length)
  if (c.isShortHair) {
    // Short hair: more volume — hair color replaces some outline pixels
    // Widen hair at y2-4 so silver is more visible
    d[2][3] = c.hair; d[2][12] = c.hair;  // replace outline with hair
    d[3][3] = c.hair; d[3][12] = c.hair;  // replace outline with hair
    d[4][3] = c.hair; d[4][12] = c.hair;  // replace outline with hair
    // Side tufts at y5-7 (ear-length)
    d[5][3] = c.hair; d[5][12] = c.hair;
    d[6][3] = c.hairShd; d[6][12] = c.hairShd;
    d[7][3] = c.hairShd; d[7][12] = c.hairShd;
  } else {
    d[7][3] = c.hair; d[7][12] = c.hair;
    d[8][3] = c.hair; d[8][4] = c.hairShd; d[8][11] = c.hairShd; d[8][12] = c.hair;
    d[9][3] = c.hair; d[9][4] = c.hairShd; d[9][11] = c.hairShd; d[9][12] = c.hair;
    d[10][3] = c.hairShd; d[10][12] = c.hairShd;
  }

  // Neck y9
  d[9][6] = O; d[9][7] = 3; d[9][8] = 3; d[9][9] = O;

  // Body y10-15 — narrower shoulders than male (no suit width extension)
  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;

  for (let y = 11; y <= 14; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) {
      d[y][x] = c.shirt;
    }
    d[y][5] = c.shirtShd; d[y][10] = c.shirtShd;
  }
  // Collar / trim
  const COLLAR = c.collarColor ?? 9;
  d[10][6] = COLLAR; d[10][7] = COLLAR; d[10][8] = COLLAR; d[10][9] = COLLAR;

  d[15][4] = O;
  for (let x = 5; x <= 10; x++) d[15][x] = c.shirt;
  d[15][11] = O;

  // Arms (skin) — same position as non-suit male
  d[11][3] = O; d[11][4] = 2;
  d[12][3] = O; d[12][4] = 2;
  d[13][3] = O; d[13][4] = 2;
  d[14][4] = O;
  d[11][11] = 2; d[11][12] = O;
  d[12][11] = 2; d[12][12] = O;
  d[13][11] = 2; d[13][12] = O;
  d[14][11] = O;

  if (c.isSkirt) {
    // Skirt y16-19 — flares out slightly for distinct female silhouette
    d[16][4] = O; d[16][5] = c.pants; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = c.pants; d[16][11] = O;
    d[17][3] = O; d[17][4] = c.pants; d[17][5] = c.pants; d[17][6] = c.pantsShd; d[17][7] = c.pants; d[17][8] = c.pants; d[17][9] = c.pantsShd; d[17][10] = c.pants; d[17][11] = c.pants; d[17][12] = O;
    d[18][3] = O; d[18][4] = c.pants; d[18][5] = c.pants; d[18][6] = c.pantsShd; d[18][7] = c.pants; d[18][8] = c.pants; d[18][9] = c.pantsShd; d[18][10] = c.pants; d[18][11] = c.pants; d[18][12] = O;
    d[19][4] = O; d[19][5] = c.pantsShd; d[19][6] = c.pantsShd; d[19][7] = c.pantsShd; d[19][8] = c.pantsShd; d[19][9] = c.pantsShd; d[19][10] = c.pantsShd; d[19][11] = O;
    // Legs below skirt y20
    d[20][5] = O; d[20][6] = 2; d[20][7] = O; d[20][8] = O; d[20][9] = 2; d[20][10] = O;
    // Shoes y21-23
    d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
    d[21][8] = O; d[21][9] = 56; d[21][10] = 56; d[21][11] = O;
    d[22][4] = O; d[22][5] = 56; d[22][6] = O;
    d[22][9] = O; d[22][10] = 56; d[22][11] = O;
    d[23][4] = O; d[23][5] = O; d[23][9] = O; d[23][10] = O;
  } else {
    // Pants (same as male)
    d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
    for (let y = 17; y <= 20; y++) {
      d[y][5] = O; d[y][10] = O;
      d[y][6] = c.pants; d[y][7] = (y >= 19) ? c.pantsShd : c.pants;
      d[y][8] = (y >= 19) ? c.pantsShd : c.pants; d[y][9] = c.pants;
    }
    d[19][7] = _; d[19][8] = _;
    d[20][7] = _; d[20][8] = _;
    d[19][5] = O; d[19][6] = c.pants; d[19][7] = O;
    d[19][8] = O; d[19][9] = c.pants; d[19][10] = O;
    d[20][5] = O; d[20][6] = c.pants; d[20][7] = O;
    d[20][8] = O; d[20][9] = c.pants; d[20][10] = O;
    // Shoes
    d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
    d[21][8] = O; d[21][9] = 56; d[21][10] = 56; d[21][11] = O;
    d[22][4] = O; d[22][5] = 56; d[22][6] = O;
    d[22][9] = O; d[22][10] = 56; d[22][11] = O;
    d[23][4] = O; d[23][5] = O; d[23][6] = O;
    d[23][9] = O; d[23][10] = O; d[23][11] = O;
  }

  return d;
}

function femaleWalkDown1(c: CharColors): number[][] {
  const d = femaleWalkDown0(c);
  if (c.isSkirt) {
    d[22][3] = O; d[22][4] = 56; d[22][5] = 56; d[22][6] = O;
    d[23][3] = O; d[23][4] = O; d[23][5] = O;
  } else {
    d[22][3] = O; d[22][4] = 56; d[22][5] = 56; d[22][6] = O;
    d[23][3] = O; d[23][4] = O; d[23][5] = O;
  }
  return d;
}

function femaleWalkDown2(c: CharColors): number[][] {
  const d = femaleWalkDown0(c);
  if (c.isSkirt) {
    d[22][9] = O; d[22][10] = 56; d[22][11] = 56; d[22][12] = O;
    d[23][9] = O; d[23][10] = O; d[23][11] = O;
  } else {
    d[22][9] = O; d[22][10] = 56; d[22][11] = 56; d[22][12] = O;
    d[23][9] = O; d[23][10] = O; d[23][11] = O;
  }
  return d;
}

// Walk-up (back view) — long hair visible from behind
function femaleWalkUp0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  // Hair — all hair visible from back, longer
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  for (let y = 3; y <= 7; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) d[y][x] = (y >= 6) ? c.hairShd : c.hair;
  }
  // Female: hair extends further down back (or short)
  if (c.isShortHair) {
    d[8][3] = O; d[8][12] = O;
    for (let x = 4; x <= 11; x++) d[8][x] = c.hairShd;
  } else {
    d[8][3] = O; d[8][12] = O;
    for (let x = 4; x <= 11; x++) d[8][x] = c.hairShd;
    d[9][3] = c.hair; d[9][4] = c.hairShd; d[9][11] = c.hairShd; d[9][12] = c.hair;
    d[10][3] = c.hairShd; d[10][12] = c.hairShd;
  }

  // Neck (partially hidden by hair)
  d[9][6] = O; d[9][7] = 3; d[9][8] = 3; d[9][9] = O;

  // Body — narrower
  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;
  for (let y = 11; y <= 14; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) d[y][x] = (x <= 5) ? c.shirtShd : c.shirt;
  }
  d[15][4] = O;
  for (let x = 5; x <= 10; x++) d[15][x] = c.shirt;
  d[15][11] = O;

  // Arms
  d[11][3] = O; d[11][4] = 2; d[12][3] = O; d[12][4] = 2; d[13][3] = O; d[13][4] = 2; d[14][4] = O;
  d[11][11] = 2; d[11][12] = O; d[12][11] = 2; d[12][12] = O; d[13][11] = 2; d[13][12] = O; d[14][11] = O;

  if (c.isSkirt) {
    d[16][4] = O; for (let x = 5; x <= 10; x++) d[16][x] = c.pants; d[16][11] = O;
    d[17][3] = O; for (let x = 4; x <= 11; x++) d[17][x] = c.pants; d[17][12] = O;
    d[18][3] = O; for (let x = 4; x <= 11; x++) d[18][x] = c.pantsShd; d[18][12] = O;
    d[19][4] = O; for (let x = 5; x <= 10; x++) d[19][x] = c.pantsShd; d[19][11] = O;
    d[20][5] = O; d[20][6] = 2; d[20][7] = O; d[20][8] = O; d[20][9] = 2; d[20][10] = O;
    d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
    d[21][8] = O; d[21][9] = 56; d[21][10] = 56; d[21][11] = O;
    d[22][4] = O; d[22][5] = 56; d[22][6] = O; d[22][9] = O; d[22][10] = 56; d[22][11] = O;
    d[23][4] = O; d[23][5] = O; d[23][9] = O; d[23][10] = O;
  } else {
    d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
    for (let y = 17; y <= 18; y++) {
      d[y][5] = O; d[y][10] = O;
      for (let x = 6; x <= 9; x++) d[y][x] = c.pants;
    }
    d[19][5] = O; d[19][6] = c.pants; d[19][7] = O; d[19][8] = O; d[19][9] = c.pants; d[19][10] = O;
    d[20][5] = O; d[20][6] = c.pants; d[20][7] = O; d[20][8] = O; d[20][9] = c.pants; d[20][10] = O;
    d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
    d[21][8] = O; d[21][9] = 56; d[21][10] = 56; d[21][11] = O;
    d[22][4] = O; d[22][5] = 56; d[22][6] = O; d[22][9] = O; d[22][10] = 56; d[22][11] = O;
    d[23][4] = O; d[23][5] = O; d[23][9] = O; d[23][10] = O;
  }
  return d;
}

function femaleWalkUp1(c: CharColors): number[][] {
  const d = femaleWalkUp0(c);
  d[22][3] = O; d[22][4] = 56; d[22][5] = 56; d[22][6] = O;
  d[23][3] = O; d[23][4] = O; d[23][5] = O;
  return d;
}

function femaleWalkUp2(c: CharColors): number[][] {
  const d = femaleWalkUp0(c);
  d[22][9] = O; d[22][10] = 56; d[22][11] = 56; d[22][12] = O;
  d[23][9] = O; d[23][10] = O; d[23][11] = O;
  return d;
}

// Walk-left (side view) — round head, hair draping down back
function femaleWalkLeft0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  // Hair top y0-2 — same round shape
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  // Head y3-8 — face shifted left, hair on right
  d[3][3] = O; d[3][4] = c.hair; for (let x = 5; x <= 10; x++) d[3][x] = c.hairShd; d[3][11] = c.hair; d[3][12] = O;
  d[4][3] = O; d[4][4] = c.hair; d[4][5] = 2; d[4][6] = 2; d[4][7] = 2; d[4][8] = 2; d[4][9] = 2; d[4][10] = c.hair; d[4][11] = c.hair; d[4][12] = O;
  d[5][3] = O; d[5][4] = 2; d[5][5] = 9; d[5][6] = 8; d[5][7] = 2; d[5][8] = 2; d[5][9] = 2; d[5][10] = c.hair; d[5][11] = c.hair; d[5][12] = O;
  d[6][3] = O; d[6][4] = 2; d[6][5] = 2; d[6][6] = 63; d[6][7] = 2; d[6][8] = 2; d[6][9] = 2; d[6][10] = c.hair; d[6][11] = c.hair; d[6][12] = O;
  d[7][4] = O; d[7][5] = 2; d[7][6] = 3; d[7][7] = 2; d[7][8] = 2; d[7][9] = 2; d[7][10] = c.hair; d[7][11] = O;
  d[8][5] = O; d[8][6] = 2; d[8][7] = 2; d[8][8] = 2; d[8][9] = 2; d[8][10] = O;

  // Female: hair drapes down back side (or short)
  if (c.isShortHair) {
    d[7][3] = c.hair;
    d[8][3] = c.hairShd;
  } else {
    d[7][3] = c.hair;
    d[8][3] = c.hair; d[8][4] = c.hairShd;
    d[9][3] = c.hair; d[9][4] = c.hairShd;
    d[10][3] = c.hairShd;
    d[8][11] = c.hair; d[8][12] = c.hair;
    d[9][11] = c.hair; d[9][12] = c.hairShd;
    d[10][11] = c.hairShd; d[10][12] = c.hairShd;
  }

  // Neck y9
  d[9][6] = O; d[9][7] = 3; d[9][8] = O;

  // Body y10-15 — narrower, no suit
  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;
  for (let y = 11; y <= 14; y++) {
    d[y][4] = O; d[y][11] = O;
    for (let x = 5; x <= 10; x++) d[y][x] = (x <= 5) ? c.shirtShd : c.shirt;
  }
  d[15][4] = O; for (let x = 5; x <= 10; x++) d[15][x] = c.shirt; d[15][11] = O;

  // Arm (front visible side)
  d[11][3] = O; d[11][4] = 2;
  d[12][3] = O; d[12][4] = 2;
  d[13][3] = O; d[13][4] = 3;
  d[14][4] = O;

  if (c.isSkirt) {
    d[16][4] = O; for (let x = 5; x <= 10; x++) d[16][x] = c.pants; d[16][11] = O;
    d[17][4] = O; for (let x = 5; x <= 10; x++) d[17][x] = c.pants; d[17][11] = O;
    d[18][4] = O; for (let x = 5; x <= 10; x++) d[18][x] = c.pantsShd; d[18][11] = O;
    d[19][5] = O; d[19][6] = c.pantsShd; d[19][7] = c.pantsShd; d[19][8] = c.pantsShd; d[19][9] = O;
    d[20][5] = O; d[20][6] = 2; d[20][7] = 2; d[20][8] = O;
    d[21][5] = O; d[21][6] = 56; d[21][7] = 56; d[21][8] = 56; d[21][9] = O;
    d[22][5] = O; d[22][6] = 56; d[22][7] = 56; d[22][8] = O;
    d[23][5] = O; d[23][6] = O; d[23][7] = O;
  } else {
    d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
    d[17][5] = O; d[17][6] = c.pants; d[17][7] = c.pants; d[17][8] = c.pants; d[17][9] = c.pants; d[17][10] = O;
    d[18][5] = O; d[18][6] = c.pants; d[18][7] = c.pantsShd; d[18][8] = c.pants; d[18][9] = c.pants; d[18][10] = O;
    d[19][5] = O; d[19][6] = c.pants; d[19][7] = c.pantsShd; d[19][8] = c.pants; d[19][9] = O;
    d[20][5] = O; d[20][6] = c.pants; d[20][7] = c.pants; d[20][8] = c.pants; d[20][9] = O;
    d[21][5] = O; d[21][6] = 56; d[21][7] = 56; d[21][8] = 56; d[21][9] = O;
    d[22][5] = O; d[22][6] = 56; d[22][7] = 56; d[22][8] = O;
    d[23][5] = O; d[23][6] = O; d[23][7] = O;
  }
  return d;
}

function femaleWalkLeft1(c: CharColors): number[][] {
  const d = femaleWalkLeft0(c);
  d[21][5] = _; d[21][6] = _; d[21][7] = _; d[21][8] = _; d[21][9] = _;
  d[22][5] = _; d[22][6] = _; d[22][7] = _; d[22][8] = _;
  d[23][5] = _; d[23][6] = _; d[23][7] = _;
  d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
  d[22][4] = O; d[22][5] = 56; d[22][6] = O;
  d[23][4] = O; d[23][5] = O;
  d[21][7] = O; d[21][8] = 56; d[21][9] = 56; d[21][10] = O;
  d[22][8] = O; d[22][9] = 56; d[22][10] = O;
  d[23][8] = O; d[23][9] = O;
  return d;
}

function femaleWalkLeft2(c: CharColors): number[][] {
  const d = femaleWalkLeft0(c);
  d[21][5] = _; d[21][6] = _; d[21][7] = _; d[21][8] = _; d[21][9] = _;
  d[22][5] = _; d[22][6] = _; d[22][7] = _; d[22][8] = _;
  d[23][5] = _; d[23][6] = _; d[23][7] = _;
  d[21][5] = O; d[21][6] = 56; d[21][7] = 56; d[21][8] = O;
  d[22][5] = O; d[22][6] = 56; d[22][7] = O;
  d[23][5] = O; d[23][6] = O;
  d[21][8] = O; d[21][9] = 56; d[21][10] = O;
  d[22][9] = O; d[22][10] = 56; d[22][11] = O;
  d[23][9] = O; d[23][10] = O;
  return d;
}

// Walk-right: mirror walk-left
function femaleWalkRight0(c: CharColors): number[][] { return mirror(femaleWalkLeft0(c)); }
function femaleWalkRight1(c: CharColors): number[][] { return mirror(femaleWalkLeft1(c)); }
function femaleWalkRight2(c: CharColors): number[][] { return mirror(femaleWalkLeft2(c)); }

// Sit frame (front view, legs bent)
function femaleSit(c: CharColors): number[][] {
  const d = femaleWalkDown0(c);
  if (c.isSkirt) {
    // Skirt spreads when sitting
    d[16][4] = O; for (let x = 5; x <= 10; x++) d[16][x] = c.pants; d[16][11] = O;
    d[17][3] = O; for (let x = 4; x <= 11; x++) d[17][x] = c.pants; d[17][12] = O;
    d[18][3] = O; d[18][4] = 56; d[18][5] = 56; d[18][6] = 56; d[18][7] = 56; d[18][8] = 56; d[18][9] = 56; d[18][10] = 56; d[18][11] = 56; d[18][12] = O;
    for (let y = 19; y <= 23; y++) d[y] = Array(16).fill(_);
  } else {
    d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
    d[17][4] = O; d[17][5] = c.pants; d[17][6] = c.pants; d[17][7] = c.pants; d[17][8] = c.pants; d[17][9] = c.pants; d[17][10] = c.pants; d[17][11] = O;
    d[18][4] = O; d[18][5] = 56; d[18][6] = 56; d[18][7] = 56; d[18][8] = 56; d[18][9] = 56; d[18][10] = 56; d[18][11] = O;
    for (let y = 19; y <= 23; y++) d[y] = Array(16).fill(_);
  }
  return d;
}

// Type frame (sit + arms forward)
function femaleType(c: CharColors): number[][] {
  const d = femaleSit(c);
  d[12][2] = O; d[12][3] = 2;
  d[13][2] = O; d[13][3] = 2;
  d[12][12] = 2; d[12][13] = O;
  d[13][12] = 2; d[13][13] = O;
  return d;
}

// Idle frames
function femaleIdle0(c: CharColors): number[][] { return femaleWalkDown0(c); }
function femaleIdle1(c: CharColors): number[][] {
  const base = femaleWalkDown0(c);
  const d = makeGrid(16, 24);
  for (let y = 1; y < 24; y++) d[y] = [...base[y - 1]];
  return d;
}

type FrameGen = (c: CharColors) => number[][];

export const FEMALE_CHAR_FRAMES: { name: string; gen: FrameGen }[] = [
  { name: "walk_down_0", gen: femaleWalkDown0 },
  { name: "walk_down_1", gen: femaleWalkDown1 },
  { name: "walk_down_2", gen: femaleWalkDown2 },
  { name: "walk_up_0", gen: femaleWalkUp0 },
  { name: "walk_up_1", gen: femaleWalkUp1 },
  { name: "walk_up_2", gen: femaleWalkUp2 },
  { name: "walk_left_0", gen: femaleWalkLeft0 },
  { name: "walk_left_1", gen: femaleWalkLeft1 },
  { name: "walk_left_2", gen: femaleWalkLeft2 },
  { name: "walk_right_0", gen: femaleWalkRight0 },
  { name: "walk_right_1", gen: femaleWalkRight1 },
  { name: "walk_right_2", gen: femaleWalkRight2 },
  { name: "sit", gen: femaleSit },
  { name: "type", gen: femaleType },
  { name: "idle_0", gen: femaleIdle0 },
  { name: "idle_1", gen: femaleIdle1 },
];

// Female character definitions
export const FEMALE_CHARACTERS: { name: string; colors: CharColors }[] = [
  // Assistant: common office look with a soft blouse, dark skirt, and brown bob.
  { name: "assistant", colors: {
    hair: 5, hairShd: 4, shirt: 50, shirtShd: 51, pants: 20, pantsShd: 21,
    isFemale: true, isShortHair: true, isSkirt: true, collarColor: 9,
  }},
  // Discord worker: purple bob cut hair, purple top, pants
  { name: "worker_2", colors: {
    hair: 116, hairShd: 117, shirt: 18, shirtShd: 19, pants: 22, pantsShd: 23,
    isFemale: true,
  }},
  // Slack worker: light brown shoulder-length hair, pink/magenta shirt, skirt
  { name: "worker_5", colors: {
    hair: 134, hairShd: 135, shirt: 130, shirtShd: 131, pants: 20, pantsShd: 21,
    isFemale: true, isSkirt: true,
  }},
];
