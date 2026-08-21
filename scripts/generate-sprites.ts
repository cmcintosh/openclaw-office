/**
 * generate-sprites.ts  (V2)
 * Kairosoft-style sprites with 3/4 perspective.
 * Larger sizes, visible depth (top surface + front face), expanded palette.
 *
 * Entry point: imports modules, assembles sheets, writes PNGs.
 */

import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

import { PALETTE } from './sprites/palette';
import { TILES } from './sprites/tiles';
import { FURNITURE } from './sprites/furniture';
import { DECORATIONS } from './sprites/decorations';
import { CHARACTERS, CHAR_FRAMES } from './sprites/characters-male';
import { FEMALE_CHARACTERS, FEMALE_CHAR_FRAMES } from './sprites/characters-female';

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function hexToRGBA(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

function renderSprite(
  ctx: CanvasRenderingContext2D,
  data: number[][],
  ox: number,
  oy: number,
) {
  for (let y = 0; y < data.length; y++) {
    for (let x = 0; x < data[y].length; x++) {
      const idx = data[y][x];
      if (idx === 0) continue;
      const [r, g, b, a] = hexToRGBA(PALETTE[idx]);
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

// ---------------------------------------------------------------------------
// Generate sprite sheets
// ---------------------------------------------------------------------------

interface FrameInfo {
  x: number;
  y: number;
  w: number;
  h: number;
}

const spritesJson: Record<string, Record<string, FrameInfo>> = {
  tiles: {},
  furniture: {},
  characters: {},
};

const SPRITES_DIR = join(__dirname, "..", "sprites");
mkdirSync(SPRITES_DIR, { recursive: true });

// --- TILES sheet ---
{
  const tileNames = Object.keys(TILES);
  const cols = tileNames.length;
  const sheetW = cols * 16;
  const sheetH = 16;
  const canvas = createCanvas(sheetW, sheetH);
  const ctx = canvas.getContext("2d");

  tileNames.forEach((name, i) => {
    const tile = TILES[name];
    renderSprite(ctx as unknown as CanvasRenderingContext2D, tile.pixels, i * 16, 0);
    spritesJson.tiles[name] = { x: i * 16, y: 0, w: 16, h: 16 };
  });

  writeFileSync(join(SPRITES_DIR, "tiles.png"), canvas.toBuffer("image/png"));
  console.log(`tiles.png: ${sheetW}x${sheetH}, ${tileNames.length} tiles`);
}

// --- FURNITURE sheet ---
// Merge furniture and decorations preserving original insertion order:
// desk, monitors, chairs, couch, [decorations], boss_desk variants, ..., bookshelf, filing_cabinet
const ALL_FURNITURE: Record<string, { width: number; height: number; pixels: number[][] }> = {};
{
  for (const [k, v] of Object.entries(FURNITURE)) ALL_FURNITURE[k] = v;
  for (const [k, v] of Object.entries(DECORATIONS)) ALL_FURNITURE[k] = v;
}

{
  const furnitureNames = Object.keys(ALL_FURNITURE);
  let totalW = 0;
  let maxH = 0;
  for (const name of furnitureNames) {
    totalW += ALL_FURNITURE[name].width;
    maxH = Math.max(maxH, ALL_FURNITURE[name].height);
  }
  const canvas = createCanvas(totalW, maxH);
  const ctx = canvas.getContext("2d");

  let ox = 0;
  for (const name of furnitureNames) {
    const spr = ALL_FURNITURE[name];
    renderSprite(ctx as unknown as CanvasRenderingContext2D, spr.pixels, ox, 0);
    spritesJson.furniture[name] = { x: ox, y: 0, w: spr.width, h: spr.height };
    ox += spr.width;
  }

  writeFileSync(join(SPRITES_DIR, "furniture.png"), canvas.toBuffer("image/png"));
  console.log(`furniture.png: ${totalW}x${maxH}, ${furnitureNames.length} sprites`);
}

// --- CHARACTERS sheet (male + female) ---
{
  const frameW = 16;
  const frameH = 24;
  const framesPerChar = CHAR_FRAMES.length; // male and female have same frame count
  const totalChars = CHARACTERS.length + FEMALE_CHARACTERS.length;
  const sheetW = framesPerChar * frameW;
  const sheetH = totalChars * frameH;
  const canvas = createCanvas(sheetW, sheetH);
  const ctx = canvas.getContext("2d");

  let row = 0;
  // Male characters
  CHARACTERS.forEach((char) => {
    CHAR_FRAMES.forEach((frame, col) => {
      const data = frame.gen(char.colors);
      const ox = col * frameW;
      const oy = row * frameH;
      renderSprite(ctx as unknown as CanvasRenderingContext2D, data, ox, oy);
      spritesJson.characters[`${char.name}_${frame.name}`] = {
        x: ox, y: oy, w: frameW, h: frameH,
      };
    });
    row++;
  });
  // Female characters
  FEMALE_CHARACTERS.forEach((char) => {
    FEMALE_CHAR_FRAMES.forEach((frame, col) => {
      const data = frame.gen(char.colors);
      const ox = col * frameW;
      const oy = row * frameH;
      renderSprite(ctx as unknown as CanvasRenderingContext2D, data, ox, oy);
      spritesJson.characters[`${char.name}_${frame.name}`] = {
        x: ox, y: oy, w: frameW, h: frameH,
      };
    });
    row++;
  });

  writeFileSync(join(SPRITES_DIR, "characters.png"), canvas.toBuffer("image/png"));
  console.log(`characters.png: ${sheetW}x${sheetH}, ${totalChars} characters (${CHARACTERS.length} male + ${FEMALE_CHARACTERS.length} female) x ${framesPerChar} frames`);
}

// --- sprites.json ---
writeFileSync(join(SPRITES_DIR, "sprites.json"), JSON.stringify(spritesJson, null, 2));
console.log("sprites.json written");
