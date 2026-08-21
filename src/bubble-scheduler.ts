// Stateful bubble scheduler: one bubble at a time, cycling through characters.

import type { Character } from './character';
import { getBubbleContext } from './bridge';
import { getCharacterGroup, selectTemplate } from './bubbles';

export interface ActiveBubble {
  characterId: string;
  text: string;
}

type SchedulerState = 'waiting_first' | 'showing' | 'gap';

const FIRST_DELAY_S = 0.8;
const SHOW_DURATION_S = 4.5;
const GAP_DURATION_S = 2.0;

let state: SchedulerState = 'waiting_first';
let timer = 0;
let activeBubble: ActiveBubble | null = null;

// Per-template cooldown map shared across all character groups
const cooldowns = new Map<string, number>();

export function initBubbleScheduler(): void {
  state = 'waiting_first';
  timer = 0;
  activeBubble = null;
  cooldowns.clear();
}

export function getActiveBubble(): ActiveBubble | null {
  return activeBubble;
}

export function updateBubbleScheduler(dt: number, characters: Character[]): void {
  timer += dt;

  if (state === 'waiting_first') {
    if (timer >= FIRST_DELAY_S) {
      timer = 0;
      showNextBubble(characters);
    }
  } else if (state === 'showing') {
    if (timer >= SHOW_DURATION_S) {
      timer = 0;
      activeBubble = null;
      state = 'gap';
    }
  } else if (state === 'gap') {
    if (timer >= GAP_DURATION_S) {
      timer = 0;
      showNextBubble(characters);
    }
  }
}

/**
 * Dismiss the current bubble immediately (e.g. tapped).
 * Returns true when the bubble bounds contain the given canvas point.
 */
export function handleBubbleTap(x: number, y: number): boolean {
  if (!activeBubble || !bubbleBounds) return false;
  const { bx, by, bw, bh } = bubbleBounds;
  if (x < bx || x > bx + bw || y < by || y > by + bh) return false;
  activeBubble = null;
  state = 'gap';
  timer = 0;
  return true;
}

/** Called by the renderer to store the current bubble hit box after drawing. */
export function setBubbleBounds(bx: number, by: number, bw: number, bh: number): void {
  bubbleBounds = { bx, by, bw, bh };
}

export function clearBubbleBounds(): void {
  bubbleBounds = null;
}

let bubbleBounds: { bx: number; by: number; bw: number; bh: number } | null = null;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function weightedPickCharacter(characters: Character[]): Character | null {
  const candidates: Array<{ character: Character; weight: number }> = [];

  for (const c of characters) {
    if (!c.visible) continue;
    let weight: number;
    if (c.id === 'boss') {
      weight = 3;
    } else if (c.forceWork) {
      weight = 4;
    } else {
      weight = 2;
    }
    candidates.push({ character: c, weight });
  }

  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of candidates) {
    roll -= entry.weight;
    if (roll <= 0) return entry.character;
  }
  return candidates[candidates.length - 1].character;
}

function showNextBubble(characters: Character[]): void {
  const ctx = getBubbleContext();

  // Try up to 8 picks to find a character with eligible template
  for (let attempt = 0; attempt < 8; attempt++) {
    const c = weightedPickCharacter(characters);
    if (!c) break;

    const group = getCharacterGroup(c.id);
    const text = selectTemplate(group, ctx, cooldowns);
    if (text !== null) {
      activeBubble = { characterId: c.id, text };
      state = 'showing';
      return;
    }
  }

  // No eligible template found — try again after a short gap
  state = 'gap';
}
