// Spontaneous visual-only interactions between characters.
// These are cosmetic overlays only — they never modify character state.

import type { Character } from './character';
import { resolveDrawPosition } from './renderer-shared';

export type InteractionType = 'paper_toss' | 'sparkle';

interface Interaction {
  id: number;
  type: InteractionType;
  primaryId: string;
  secondaryId?: string;
  startedAt: number;
  durationMs: number;
  // paper_toss arc endpoints (pixel coords of character centers)
  fromPx?: number;
  fromPy?: number;
  toPx?: number;
  toPy?: number;
}

let nextId = 1;
const active: Interaction[] = [];

// Per-pair cooldown prevents the same pair from repeating too soon
const pairCooldowns = new Map<string, number>();
// Per-character cooldown prevents sparkles from firing repeatedly
const charCooldowns = new Map<string, number>();
// Track previous forceWork state for sparkle detection
const prevForceWork = new Map<string, boolean>();

const PAIR_COOLDOWN_MS = 45_000;
const SPARKLE_CHAR_COOLDOWN_MS = 30_000;
const MAX_ACTIVE = 2;

// Paper toss: fire every 5–9s; first one after 3s
let paperTossTimer = 3;
const PAPER_TOSS_BASE_S = 7;
const PAPER_TOSS_JITTER_S = 2;

// Max desk-to-desk distance to consider for paper toss.
// Worker left-col ↔ right-col desks are ~112 px apart; boss ↔ worker can be ~150 px.
// Allow up to 200 px so most desk pairs qualify.
const PAPER_TOSS_MAX_DIST_PX = 200;
const PAPER_TOSS_MIN_DIST_PX = 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function updateInteractions(characters: Character[], dt: number): void {
  const now = Date.now();

  // Expire finished interactions
  for (let i = active.length - 1; i >= 0; i--) {
    if (now >= active[i].startedAt + active[i].durationMs) {
      active.splice(i, 1);
    }
  }

  // Sparkle: detect forceWork true→false (session just went inactive)
  detectTaskDone(characters, now);

  // Paper toss: periodic between any two visible characters
  paperTossTimer -= dt;
  if (paperTossTimer <= 0) {
    paperTossTimer = PAPER_TOSS_BASE_S + (Math.random() - 0.5) * PAPER_TOSS_JITTER_S;
    if (active.length < MAX_ACTIVE) {
      tryPaperToss(characters, now);
    }
  }
}

// ---------------------------------------------------------------------------
// Trigger helpers
// ---------------------------------------------------------------------------

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function isPairCooled(a: string, b: string, now: number): boolean {
  return (pairCooldowns.get(pairKey(a, b)) ?? 0) > now;
}

function pixelDist(a: Character, b: Character): number {
  return Math.hypot(a.px - b.px, a.py - b.py);
}

function addInteraction(
  params: Omit<Interaction, 'id' | 'startedAt'> & { now: number },
): void {
  const { now, ...rest } = params;
  active.push({ id: nextId++, startedAt: now, ...rest });
}

/** Detect forceWork true→false: show a brief sparkle above the character. */
function detectTaskDone(characters: Character[], now: number): void {
  for (const c of characters) {
    if (!c.visible) {
      prevForceWork.set(c.id, c.forceWork);
      continue;
    }
    const prev = prevForceWork.get(c.id);
    if (prev === true && !c.forceWork && active.length < MAX_ACTIVE) {
      const cooledUntil = charCooldowns.get(c.id) ?? 0;
      if (now > cooledUntil) {
        addInteraction({ type: 'sparkle', primaryId: c.id, durationMs: 1100, now });
        charCooldowns.set(c.id, now + SPARKLE_CHAR_COOLDOWN_MS);
      }
    }
    prevForceWork.set(c.id, c.forceWork);
  }
}

/**
 * Paper toss: any two visible characters within range.
 * Includes forceWork characters — busy people can still sneak a paper toss.
 */
function tryPaperToss(characters: Character[], now: number): void {
  const candidates = characters.filter(c => c.visible);
  if (candidates.length < 2) return;

  // Shuffle so picks are varied across calls
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    for (let j = i + 1; j < shuffled.length; j++) {
      const a = shuffled[i];
      const b = shuffled[j];
      if (isPairCooled(a.id, b.id, now)) continue;

      const d = pixelDist(a, b);
      if (d >= PAPER_TOSS_MIN_DIST_PX && d <= PAPER_TOSS_MAX_DIST_PX) {
        // Center of sprite: px+8 horizontal, py+4 vertical
        addInteraction({
          type: 'paper_toss',
          primaryId: a.id,
          secondaryId: b.id,
          durationMs: 1200,
          now,
          fromPx: a.px + 8,
          fromPy: a.py + 4,
          toPx: b.px + 8,
          toPy: b.py + 4,
        });
        pairCooldowns.set(pairKey(a.id, b.id), now + PAIR_COOLDOWN_MS);
        return;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

export function drawInteractionOverlays(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  seatedOffsetForCharacter: (id: string) => number,
): void {
  const now = Date.now();
  for (const ia of active) {
    const age = now - ia.startedAt;
    const progress = Math.min(1, age / ia.durationMs);

    // Fade in over first 10%, fade out over last 25%
    let alpha = 1;
    if (progress < 0.1) alpha = progress / 0.1;
    else if (progress > 0.75) alpha = 1 - (progress - 0.75) / 0.25;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;

    switch (ia.type) {
      case 'paper_toss':
        drawPaperToss(ctx, ia, progress);
        break;
      case 'sparkle':
        drawSparkle(ctx, ia.primaryId, characters, seatedOffsetForCharacter, progress);
        break;
    }

    ctx.restore();
  }
}

/** Get the top-center pixel of a character's current sprite. */
function getCharHeadCenter(
  id: string,
  characters: Character[],
  seatedOffsetForCharacter: (id: string) => number,
): { cx: number; topY: number } | null {
  const c = characters.find(ch => ch.id === id);
  if (!c || !c.visible || !c.currentFrame) return null;
  const { dx, dy } = resolveDrawPosition(c, c.currentFrame, seatedOffsetForCharacter(c.id));
  return {
    cx: Math.round(dx + c.currentFrame.w / 2),
    topY: dy,
  };
}

/**
 * Paper toss: a 2×2 off-white square on a parabolic arc.
 *
 * Arc height scales with horizontal distance so short tosses stay compact
 * and long cross-office tosses have a dramatic loft.
 */
function drawPaperToss(
  ctx: CanvasRenderingContext2D,
  ia: Interaction,
  progress: number,
): void {
  if (
    ia.fromPx === undefined || ia.toPx === undefined ||
    ia.fromPy === undefined || ia.toPy === undefined
  ) return;

  const dx = ia.toPx - ia.fromPx;
  const dy = ia.toPy - ia.fromPy;
  const dist = Math.hypot(dx, dy);

  // Arc height: taller for longer throws, capped so it stays on screen
  const arcHeight = Math.min(8 + dist * 0.18, 28);

  const x = Math.round(ia.fromPx + dx * progress);
  const linearY = ia.fromPy + dy * progress;
  const y = Math.round(linearY - arcHeight * Math.sin(progress * Math.PI));

  // Crumpled paper: off-white 2×2 with a tiny shadow
  ctx.fillStyle = '#fffde8';
  ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = '#c8c8a0';
  ctx.fillRect(x + 1, y + 2, 1, 1);
}

/**
 * Sparkle burst: bright center cross fading into 4 expanding corner pixels.
 * Shown when a character's session just went inactive (wrapped up their task).
 */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  characters: Character[],
  seatedOffsetForCharacter: (id: string) => number,
  progress: number,
): void {
  const head = getCharHeadCenter(characterId, characters, seatedOffsetForCharacter);
  if (!head) return;

  const cx = head.cx;
  const baseY = head.topY - 6;
  const d = Math.round(1 + progress * 5);

  // 4 corner pixels expanding outward
  ctx.fillStyle = '#f8e060';
  ctx.fillRect(cx - d,     baseY - d,     1, 1);
  ctx.fillRect(cx + d - 1, baseY - d,     1, 1);
  ctx.fillRect(cx - d,     baseY + d - 1, 1, 1);
  ctx.fillRect(cx + d - 1, baseY + d - 1, 1, 1);

  // Center cross: only in first 40% of animation
  if (progress < 0.4) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx,     baseY - 1, 1, 3);
    ctx.fillRect(cx - 1, baseY,     3, 1);
  }
}
