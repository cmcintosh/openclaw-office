import { getFrame, type Frame } from './sprite-sheet';
import type { Character } from './character';
import { TILE_SIZE } from './world';

export function getFrameSafe(category: 'tiles' | 'furniture' | 'characters', name: string): Frame | null {
  try {
    return getFrame(category, name);
  } catch {
    return null;
  }
}

export function drawSpriteAt(
  ctx: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  frame: Frame,
  dx: number,
  dy: number,
): void {
  ctx.drawImage(sheet, frame.x, frame.y, frame.w, frame.h, dx, dy, frame.w, frame.h);
}

export function resolveDrawPosition(
  character: Character,
  frame: Frame,
  seatedOffset: number,
): { dx: number; dy: number } {
  const dx = Math.round(character.px + (TILE_SIZE - frame.w) / 2);
  if (character.state === 'working') {
    return { dx, dy: Math.round(character.py + seatedOffset) };
  }
  return { dx, dy: Math.round(character.py + TILE_SIZE - frame.h) };
}
