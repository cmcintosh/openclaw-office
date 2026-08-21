// Sprite sheet loader: loads PNG sprite sheets and provides frame lookup

import spritesJson from '../sprites/sprites.json';
import tilesUrl from '../sprites/tiles.png';
import furnitureUrl from '../sprites/furniture.png';
import charactersUrl from '../sprites/characters.png';

export interface Frame {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Category = 'tiles' | 'furniture' | 'characters';

const sheets: Record<Category, HTMLImageElement> = {} as any;
const frames: Record<Category, Record<string, Frame>> = spritesJson as any;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function loadSpriteSheets(): Promise<void> {
  const [tiles, furniture, characters] = await Promise.all([
    loadImage(tilesUrl),
    loadImage(furnitureUrl),
    loadImage(charactersUrl),
  ]);
  sheets.tiles = tiles;
  sheets.furniture = furniture;
  sheets.characters = characters;
}

export function getSheet(category: Category): HTMLImageElement {
  return sheets[category];
}

export function getFrame(category: Category, name: string): Frame {
  return frames[category][name];
}

export function getCharacterFrame(characterId: string, action: string, frameIndex: number): Frame {
  const key = `${characterId}_${action}_${frameIndex}`;
  return frames.characters[key];
}
