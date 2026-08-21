// Male character pixel arrays

import { _, O } from './palette';
import type { SpriteData } from './tiles';

export interface CharColors {
  hair: number;
  hairShd: number;
  shirt: number;
  shirtShd: number;
  pants: number;
  pantsShd: number;
  isSuit?: boolean;
  isSecretary?: boolean;
  isFemale?: boolean;
  isSkirt?: boolean;
  isVest?: boolean;
  vestColor?: number;
  vestShd?: number;
  underShirt?: number;
  eyeColor?: number;    // custom eye color (default: 8 black)
  collarColor?: number; // custom collar/trim color (default: 9 white)
  isShortHair?: boolean; // short hair (ear-length, no draping past chin)
}

function makeGrid(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array(w).fill(_));
}

// Walk-down frame 0 (neutral stance) - 16w x 24h
export function charWalkDown0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  // Hair top y0-2
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  // Head y3-8
  d[3][3] = O; d[3][4] = c.hair; for (let x = 5; x <= 10; x++) d[3][x] = c.hairShd; d[3][11] = c.hair; d[3][12] = O;
  d[4][3] = O; d[4][4] = c.hair;
  d[4][5] = 2; d[4][6] = 2; d[4][7] = 2; d[4][8] = 2; d[4][9] = 2; d[4][10] = 2;
  d[4][11] = c.hair; d[4][12] = O;
  // Eyes y5
  d[5][3] = O; d[5][4] = 2;
  d[5][5] = 9; d[5][6] = 8; d[5][7] = 2; d[5][8] = 2; d[5][9] = 9; d[5][10] = 8;
  d[5][11] = 2; d[5][12] = O;
  // Cheeks + nose y6
  d[6][3] = O; d[6][4] = 2;
  d[6][5] = 2; d[6][6] = 2; d[6][7] = 63; d[6][8] = 63; d[6][9] = 2; d[6][10] = 2;
  d[6][11] = 2; d[6][12] = O;
  // Mouth y7
  d[7][4] = O; d[7][5] = 2; d[7][6] = 2; d[7][7] = 3; d[7][8] = 3; d[7][9] = 2; d[7][10] = 2; d[7][11] = O;
  // Chin y8
  d[8][5] = O; d[8][6] = 2; d[8][7] = 2; d[8][8] = 2; d[8][9] = 2; d[8][10] = O;
  // Neck y9
  d[9][6] = O; d[9][7] = 3; d[9][8] = 3; d[9][9] = O;

  // Body y10-16
  const shirtMain = c.isVest ? (c.underShirt || 9) : c.shirt;
  const shirtShadow = c.isVest ? (c.underShirt || 9) : c.shirtShd;

  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;

  // Boss: wider shoulders
  if (c.isSuit) {
    d[10][3] = O; d[10][4] = c.shirtShd; d[10][11] = c.shirtShd; d[10][12] = O;
  }

  for (let y = 11; y <= 14; y++) {
    d[y][3] = O;
    d[y][12] = O;
    for (let x = 4; x <= 11; x++) {
      if (x === 4) d[y][x] = c.shirtShd;
      else if (x === 11) d[y][x] = c.shirtShd;
      else d[y][x] = c.shirt;
    }
    // Boss: wider body
    if (c.isSuit) {
      d[y][2] = O; d[y][3] = c.shirtShd; d[y][12] = c.shirtShd; d[y][13] = O;
    }
    // Vest overlay
    if (c.isVest && c.vestColor) {
      d[y][5] = c.vestColor;
      d[y][6] = c.vestColor;
      d[y][9] = c.vestColor;
      d[y][10] = c.vestColor;
    }
    // Shirt shadow fold
    d[y][6] = shirtShadow;
    d[y][9] = shirtShadow;
  }
  // Collar
  d[10][6] = 9; d[10][7] = 9; d[10][8] = 9; d[10][9] = 9;
  if (c.isSuit) {
    d[10][6] = c.shirt; d[10][9] = c.shirt;
    // Suit lapels - V-shape
    d[11][5] = c.shirtShd; d[11][10] = c.shirtShd;
    d[12][6] = c.shirtShd; d[12][9] = c.shirtShd;
    // Tie
    d[10][7] = 12; d[10][8] = 12;
    d[11][7] = 12; d[11][8] = 13;
    d[12][7] = 12; d[12][8] = 13;
    d[13][7] = 12; d[13][8] = 13;
    d[14][7] = 13; d[14][8] = 13;
  }

  d[15][4] = O;
  for (let x = 5; x <= 10; x++) d[15][x] = c.shirt;
  d[15][11] = O;
  if (c.isSuit) {
    d[15][3] = O; d[15][4] = c.shirtShd; d[15][11] = c.shirtShd; d[15][12] = O;
  }

  // Arms (skin) at sides
  if (c.isSuit) {
    d[11][1] = O; d[11][2] = 2;
    d[12][1] = O; d[12][2] = 2;
    d[13][1] = O; d[13][2] = 2;
    d[14][2] = O; d[14][3] = 3;
    d[11][13] = 2; d[11][14] = O;
    d[12][13] = 2; d[12][14] = O;
    d[13][13] = 2; d[13][14] = O;
    d[14][12] = 3; d[14][13] = O;
  } else {
    d[11][2] = O; d[11][3] = 2;
    d[12][2] = O; d[12][3] = 2;
    d[13][2] = O; d[13][3] = 2;
    d[14][3] = O; d[14][4] = 3;
    d[11][12] = 2; d[11][13] = O;
    d[12][12] = 2; d[12][13] = O;
    d[13][12] = 2; d[13][13] = O;
    d[14][11] = 3; d[14][12] = O;
  }

  // Belt/waist y16
  d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;

  // Pants y17-20
  for (let y = 17; y <= 20; y++) {
    d[y][5] = O; d[y][10] = O;
    d[y][6] = c.pants; d[y][7] = (y >= 19) ? c.pantsShd : c.pants;
    d[y][8] = (y >= 19) ? c.pantsShd : c.pants; d[y][9] = c.pants;
  }
  // Leg separation
  d[19][7] = _; d[19][8] = _;
  d[20][7] = _; d[20][8] = _;
  d[19][5] = O; d[19][6] = c.pants; d[19][7] = O;
  d[19][8] = O; d[19][9] = c.pants; d[19][10] = O;
  d[20][5] = O; d[20][6] = c.pants; d[20][7] = O;
  d[20][8] = O; d[20][9] = c.pants; d[20][10] = O;

  // Shoes y21-23
  d[21][4] = O; d[21][5] = 56; d[21][6] = 56; d[21][7] = O;
  d[21][8] = O; d[21][9] = 56; d[21][10] = 56; d[21][11] = O;
  d[22][4] = O; d[22][5] = 56; d[22][6] = O;
  d[22][9] = O; d[22][10] = 56; d[22][11] = O;
  d[23][4] = O; d[23][5] = O; d[23][6] = O;
  d[23][9] = O; d[23][10] = O; d[23][11] = O;
  return d;
}

function charWalkDown1(c: CharColors): number[][] {
  const d = charWalkDown0(c);
  d[22][3] = O; d[22][4] = 56; d[22][5] = 56; d[22][6] = O;
  d[23][3] = O; d[23][4] = O; d[23][5] = O;
  return d;
}

function charWalkDown2(c: CharColors): number[][] {
  const d = charWalkDown0(c);
  d[22][9] = O; d[22][10] = 56; d[22][11] = 56; d[22][12] = O;
  d[23][9] = O; d[23][10] = O; d[23][11] = O;
  return d;
}

// Walk-up (back view)
function charWalkUp0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  for (let y = 3; y <= 7; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) d[y][x] = (y >= 6) ? c.hairShd : c.hair;
  }
  d[8][4] = O; for (let x = 5; x <= 10; x++) d[8][x] = c.hairShd; d[8][11] = O;
  d[9][6] = O; d[9][7] = 3; d[9][8] = 3; d[9][9] = O;
  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;
  if (c.isSuit) {
    d[10][3] = O; d[10][4] = c.shirtShd; d[10][11] = c.shirtShd; d[10][12] = O;
  }
  for (let y = 11; y <= 14; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) d[y][x] = (x <= 5) ? c.shirtShd : c.shirt;
    if (c.isSuit) {
      d[y][2] = O; d[y][3] = c.shirtShd; d[y][12] = c.shirtShd; d[y][13] = O;
    }
  }
  d[15][4] = O;
  for (let x = 5; x <= 10; x++) d[15][x] = c.shirt;
  d[15][11] = O;
  if (c.isSuit) {
    d[15][3] = O; d[15][4] = c.shirtShd; d[15][11] = c.shirtShd; d[15][12] = O;
  }
  if (c.isSuit) {
    d[11][1] = O; d[11][2] = 2; d[12][1] = O; d[12][2] = 2; d[13][1] = O; d[13][2] = 2; d[14][2] = O;
    d[11][13] = 2; d[11][14] = O; d[12][13] = 2; d[12][14] = O; d[13][13] = 2; d[13][14] = O; d[14][13] = O;
  } else {
    d[11][2] = O; d[11][3] = 2; d[12][2] = O; d[12][3] = 2; d[13][2] = O; d[13][3] = 2; d[14][3] = O;
    d[11][12] = 2; d[11][13] = O; d[12][12] = 2; d[12][13] = O; d[13][12] = 2; d[13][13] = O; d[14][12] = O;
  }
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
  return d;
}

function charWalkUp1(c: CharColors): number[][] {
  const d = charWalkUp0(c);
  d[22][3] = O; d[22][4] = 56; d[22][5] = 56; d[22][6] = O;
  d[23][3] = O; d[23][4] = O; d[23][5] = O;
  return d;
}

function charWalkUp2(c: CharColors): number[][] {
  const d = charWalkUp0(c);
  d[22][9] = O; d[22][10] = 56; d[22][11] = 56; d[22][12] = O;
  d[23][9] = O; d[23][10] = O; d[23][11] = O;
  return d;
}

// Walk-left (side view)
function charWalkLeft0(c: CharColors): number[][] {
  const d = makeGrid(16, 24);
  for (let x = 5; x <= 10; x++) d[0][x] = O;
  d[1][4] = O; for (let x = 5; x <= 10; x++) d[1][x] = c.hair; d[1][11] = O;
  d[2][3] = O; for (let x = 4; x <= 11; x++) d[2][x] = c.hair; d[2][12] = O;
  d[3][3] = O; d[3][4] = c.hair; for (let x = 5; x <= 10; x++) d[3][x] = c.hairShd; d[3][11] = c.hair; d[3][12] = O;
  d[4][3] = O; d[4][4] = c.hair; d[4][5] = 2; d[4][6] = 2; d[4][7] = 2; d[4][8] = 2; d[4][9] = 2; d[4][10] = c.hair; d[4][11] = c.hair; d[4][12] = O;
  d[5][3] = O; d[5][4] = 2; d[5][5] = 9; d[5][6] = 8; d[5][7] = 2; d[5][8] = 2; d[5][9] = 2; d[5][10] = c.hair; d[5][11] = c.hair; d[5][12] = O;
  d[6][3] = O; d[6][4] = 2; d[6][5] = 2; d[6][6] = 63; d[6][7] = 2; d[6][8] = 2; d[6][9] = 2; d[6][10] = c.hair; d[6][11] = c.hair; d[6][12] = O;
  d[7][4] = O; d[7][5] = 2; d[7][6] = 3; d[7][7] = 2; d[7][8] = 2; d[7][9] = 2; d[7][10] = c.hair; d[7][11] = O;
  d[8][5] = O; d[8][6] = 2; d[8][7] = 2; d[8][8] = 2; d[8][9] = 2; d[8][10] = O;
  d[9][6] = O; d[9][7] = 3; d[9][8] = O;
  d[10][4] = O;
  for (let x = 5; x <= 10; x++) d[10][x] = c.shirt;
  d[10][11] = O;
  if (c.isSuit) {
    d[10][3] = O; d[10][4] = c.shirtShd; d[10][11] = c.shirtShd; d[10][12] = O;
  }
  for (let y = 11; y <= 14; y++) {
    d[y][3] = O; d[y][12] = O;
    for (let x = 4; x <= 11; x++) {
      d[y][x] = (x <= 5) ? c.shirtShd : c.shirt;
    }
    if (c.isSuit) {
      d[y][2] = O; d[y][3] = c.shirtShd; d[y][12] = c.shirtShd; d[y][13] = O;
      d[y][6] = 12;
    }
  }
  d[15][4] = O; d[15][5] = c.shirt; d[15][6] = c.shirt; d[15][7] = c.shirt; d[15][8] = c.shirt; d[15][9] = c.shirt; d[15][10] = c.shirt; d[15][11] = O;
  if (c.isSuit) {
    d[15][3] = O; d[15][4] = c.shirtShd; d[15][11] = c.shirtShd; d[15][12] = O;
  }
  if (c.isSuit) {
    d[11][1] = O; d[11][2] = 2;
    d[12][1] = O; d[12][2] = 2;
    d[13][1] = O; d[13][2] = 3;
    d[14][2] = O;
  } else {
    d[11][2] = O; d[11][3] = 2;
    d[12][2] = O; d[12][3] = 2;
    d[13][2] = O; d[13][3] = 3;
    d[14][3] = O;
  }
  d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
  d[17][5] = O; d[17][6] = c.pants; d[17][7] = c.pants; d[17][8] = c.pants; d[17][9] = c.pants; d[17][10] = O;
  d[18][5] = O; d[18][6] = c.pants; d[18][7] = c.pantsShd; d[18][8] = c.pants; d[18][9] = c.pants; d[18][10] = O;
  d[19][5] = O; d[19][6] = c.pants; d[19][7] = c.pantsShd; d[19][8] = c.pants; d[19][9] = O;
  d[20][5] = O; d[20][6] = c.pants; d[20][7] = c.pants; d[20][8] = c.pants; d[20][9] = O;
  d[21][5] = O; d[21][6] = 56; d[21][7] = 56; d[21][8] = 56; d[21][9] = O;
  d[22][5] = O; d[22][6] = 56; d[22][7] = 56; d[22][8] = O;
  d[23][5] = O; d[23][6] = O; d[23][7] = O;
  return d;
}

function charWalkLeft1(c: CharColors): number[][] {
  const d = charWalkLeft0(c);
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

function charWalkLeft2(c: CharColors): number[][] {
  const d = charWalkLeft0(c);
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
function mirror(data: number[][]): number[][] {
  return data.map(row => [...row].reverse());
}

function charWalkRight0(c: CharColors): number[][] { return mirror(charWalkLeft0(c)); }
function charWalkRight1(c: CharColors): number[][] { return mirror(charWalkLeft1(c)); }
function charWalkRight2(c: CharColors): number[][] { return mirror(charWalkLeft2(c)); }

// Sit frame (front view, legs bent)
function charSit(c: CharColors): number[][] {
  const d = charWalkDown0(c);
  d[16][5] = O; d[16][6] = c.pants; d[16][7] = c.pants; d[16][8] = c.pants; d[16][9] = c.pants; d[16][10] = O;
  d[17][4] = O; d[17][5] = c.pants; d[17][6] = c.pants; d[17][7] = c.pants; d[17][8] = c.pants; d[17][9] = c.pants; d[17][10] = c.pants; d[17][11] = O;
  d[18][4] = O; d[18][5] = 56; d[18][6] = 56; d[18][7] = 56; d[18][8] = 56; d[18][9] = 56; d[18][10] = 56; d[18][11] = O;
  for (let y = 19; y <= 23; y++) d[y] = Array(16).fill(_);
  return d;
}

// Type frame (sit + arms forward)
function charType(c: CharColors): number[][] {
  const d = charSit(c);
  d[12][1] = O; d[12][2] = 2;
  d[13][1] = O; d[13][2] = 2;
  d[12][13] = 2; d[12][14] = O;
  d[13][13] = 2; d[13][14] = O;
  return d;
}

// Idle frames
function charIdle0(c: CharColors): number[][] { return charWalkDown0(c); }
function charIdle1(c: CharColors): number[][] {
  const base = charWalkDown0(c);
  const d = makeGrid(16, 24);
  for (let y = 1; y < 24; y++) d[y] = [...base[y - 1]];
  return d;
}

type FrameGen = (c: CharColors) => number[][];

export const CHAR_FRAMES: { name: string; gen: FrameGen }[] = [
  { name: "walk_down_0", gen: charWalkDown0 },
  { name: "walk_down_1", gen: charWalkDown1 },
  { name: "walk_down_2", gen: charWalkDown2 },
  { name: "walk_up_0", gen: charWalkUp0 },
  { name: "walk_up_1", gen: charWalkUp1 },
  { name: "walk_up_2", gen: charWalkUp2 },
  { name: "walk_left_0", gen: charWalkLeft0 },
  { name: "walk_left_1", gen: charWalkLeft1 },
  { name: "walk_left_2", gen: charWalkLeft2 },
  { name: "walk_right_0", gen: charWalkRight0 },
  { name: "walk_right_1", gen: charWalkRight1 },
  { name: "walk_right_2", gen: charWalkRight2 },
  { name: "sit", gen: charSit },
  { name: "type", gen: charType },
  { name: "idle_0", gen: charIdle0 },
  { name: "idle_1", gen: charIdle1 },
];

// Male character definitions (female chars in characters-female.ts)
export const CHARACTERS: { name: string; colors: CharColors }[] = [
  // Boss: dark suit + tie, dark brown neat hair
  { name: "boss", colors: {
    hair: 4, hairShd: 4, shirt: 58, shirtShd: 59, pants: 20, pantsShd: 21, isSuit: true,
  }},
  // Telegram worker: blue shirt, black short hair
  { name: "worker_1", colors: {
    hair: 8, hairShd: 1, shirt: 10, shirtShd: 11, pants: 20, pantsShd: 21,
  }},
  // Cron worker: green shirt, red/auburn hair
  { name: "worker_3", colors: {
    hair: 7, hairShd: 5, shirt: 14, shirtShd: 15, pants: 20, pantsShd: 21,
  }},
  // Temp worker: orange vest over white shirt, blonde hair
  { name: "worker_4", colors: {
    hair: 6, hairShd: 5, shirt: 61, shirtShd: 62, pants: 22, pantsShd: 23,
    isVest: true, vestColor: 61, vestShd: 62, underShirt: 9,
  }},
  // Feishu worker: black hair, teal shirt, dark pants
  { name: "worker_6", colors: {
    hair: 136, hairShd: 137, shirt: 132, shirtShd: 133, pants: 20, pantsShd: 21,
  }},
];
