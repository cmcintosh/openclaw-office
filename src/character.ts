// Character state machine and animation (v1: basic idle + walking)

import {
  deskAssignments, waypointMap, getIdleWaypoints,
  behaviorConfig, tileToPixel, TILE_SIZE,
} from './world';
import { buildPath, buildPathFromPixel, lerpPosition, type PathSegment, type Direction } from './pathfinding';
import { getFrame, type Frame } from './sprite-sheet';

export type CharacterState = 'working' | 'walking' | 'idle';

// Track which idle waypoints are currently targeted/occupied by characters
const claimedWaypoints = new Set<string>();
const FOOSBALL_WAYPOINTS = new Set(['foosballLeft', 'foosballRight']);

const SPRITE_MAP: Record<string, string> = {
  boss: 'boss',
  assistant: 'assistant',
  subagent: 'worker_4',
  cron: 'worker_3',
  channel1: 'worker_1',
  channel2: 'worker_2',
  channel3: 'worker_5',
  channel4: 'worker_6',
};

export interface Character {
  id: string;
  spriteId: string;
  state: CharacterState;
  px: number;
  py: number;
  currentFrame: Frame | null;
  direction: Direction;
  currentWaypoint: string;

  // Walking state
  path: PathSegment[];
  pathIndex: number;
  segmentProgress: number;

  // Timer for state transitions
  stateTimer: number;
  animFrame: number;
  animTimer: number;

  // Session-driven activity flag: when true, character stays at desk working
  forceWork: boolean;

  // Temporary "return to desk now" boost (used by office clock interaction)
  rushUntilMs: number;
  // Brief reaction window before movement (for office clock "surprised" effect)
  startledUntilMs: number;

  // Whether character is visible (sub-agent hides when inactive)
  visible: boolean;

  // v2 hook: arbitrary metadata for session info
  metadata: Record<string, unknown>;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createCharacter(id: string): Character {
  const deskWp = deskAssignments[id];
  const wp = waypointMap[deskWp];
  const spriteId = SPRITE_MAP[id] || 'worker_4';

  // Sitting position: waist (row ~14 of 24px sprite) aligns with desk top edge
  const deskPy = (wp.y + 1) * TILE_SIZE;
  const sittingPx = wp.x * TILE_SIZE;
  const sittingPy = deskPy - 15;

  return {
    id,
    spriteId,
    state: 'working',
    px: sittingPx,
    py: sittingPy,
    currentFrame: null,
    direction: 'down',
    currentWaypoint: deskWp,
    path: [],
    pathIndex: 0,
    segmentProgress: 0,
    stateTimer: randRange(behaviorConfig.workingDurationMin, behaviorConfig.workingDurationMax),
    animFrame: 0,
    animTimer: 0,
    forceWork: false,
    rushUntilMs: 0,
    startledUntilMs: 0,
    visible: true,
    metadata: {},
  };
}

export function createAllCharacters(): Character[] {
  return Object.keys(deskAssignments).map(createCharacter);
}

export function updateCharacter(c: Character, dt: number): void {
  c.animTimer += dt;
  if (c.animTimer >= 0.5) {
    c.animTimer -= 0.5;
    c.animFrame = (c.animFrame + 1) % 2;
  }

  switch (c.state) {
    case 'working':
      updateWorking(c, dt);
      break;
    case 'walking':
      updateWalking(c, dt);
      break;
    case 'idle':
      updateIdle(c, dt);
      break;
  }

  c.currentFrame = resolveFrame(c);
}

function isForcedWorking(c: Character): boolean {
  return c.forceWork || c.rushUntilMs > Date.now();
}

function updateWorking(c: Character, dt: number): void {
  // forceWork suppresses idle transitions — character keeps working
  if (isForcedWorking(c)) return;

  c.stateTimer -= dt;
  if (c.stateTimer <= 0) {
    // Pick a random idle waypoint that isn't already claimed
    const idleWps = getIdleWaypoints().filter(wp => !claimedWaypoints.has(wp));
    if (idleWps.length === 0) return; // all spots taken, keep working
    const target = idleWps[Math.floor(Math.random() * idleWps.length)];
    startWalking(c, target);
  }
}

function updateWalking(c: Character, dt: number): void {
  // Short reaction pause before moving when a clock recall is triggered.
  if (c.startledUntilMs > Date.now()) return;

  if (c.pathIndex >= c.path.length) {
    arriveAtWaypoint(c);
    return;
  }

  // If forceWork set while walking away from desk, redirect back
  if (isForcedWorking(c)) {
    const deskWp = deskAssignments[c.id];
    if (c.currentWaypoint !== deskWp) {
      startWalking(c, deskWp);
      return;
    }
  }

  const seg = c.path[c.pathIndex];
  // Scale walk speed for larger 22-row portrait map (was tuned for 10-row)
  const baseSpeed = behaviorConfig.walkSpeed * TILE_SIZE * 2; // pixels per second
  const speed = isForcedWorking(c) ? baseSpeed * 2 : baseSpeed;     // rush back at 2x when called to work
  const segmentDuration = seg.distance / speed;

  if (segmentDuration <= 0) {
    c.pathIndex++;
    return;
  }

  c.segmentProgress += dt / segmentDuration;

  if (c.segmentProgress >= 1) {
    c.segmentProgress = 0;
    c.pathIndex++;
    if (c.pathIndex < c.path.length) {
      c.direction = c.path[c.pathIndex].direction;
    }
  } else {
    const pos = lerpPosition(seg, c.segmentProgress);
    c.px = pos.x;
    c.py = pos.y;
    c.direction = seg.direction;
  }
}

function updateIdle(c: Character, dt: number): void {
  // If forceWork was set while idle, walk back to desk immediately
  if (isForcedWorking(c)) {
    const deskWp = deskAssignments[c.id];
    startWalking(c, deskWp);
    return;
  }

  c.stateTimer -= dt;
  if (c.stateTimer <= 0) {
    // Walk back to desk
    const deskWp = deskAssignments[c.id];
    startWalking(c, deskWp);
  }
}

function startWalking(c: Character, targetWaypoint: string): void {
  const path = c.state === 'walking'
    ? buildPathFromPixel(c.px, c.py, targetWaypoint)
    : buildPath(c.currentWaypoint, targetWaypoint);
  if (path.length === 0) {
    // Can't path, just switch state
    c.state = 'idle';
    c.stateTimer = randRange(behaviorConfig.idleDurationMin, behaviorConfig.idleDurationMax);
    return;
  }
  // Release old idle claim, claim new target
  const deskWp = deskAssignments[c.id];
  if (c.currentWaypoint !== deskWp) claimedWaypoints.delete(c.currentWaypoint);
  if (targetWaypoint !== deskWp) claimedWaypoints.add(targetWaypoint);

  c.state = 'walking';
  c.path = path;
  c.pathIndex = 0;
  c.segmentProgress = 0;
  c.direction = path[0].direction;
  c.currentWaypoint = targetWaypoint;
}

function arriveAtWaypoint(c: Character): void {
  const deskWp = deskAssignments[c.id];
  if (c.currentWaypoint === deskWp) {
    // Snap to sitting position: waist aligns with desk top edge
    const wp = waypointMap[c.currentWaypoint];
    if (wp) {
      const deskPy = (wp.y + 1) * TILE_SIZE;
      c.px = wp.x * TILE_SIZE;
      c.py = deskPy - 15;
    }
    c.state = 'working';
    c.direction = 'down'; // Face viewer while working at desk
    c.stateTimer = randRange(behaviorConfig.workingDurationMin, behaviorConfig.workingDurationMax);
  } else {
    // Snap to waypoint pixel position
    const wp = waypointMap[c.currentWaypoint];
    if (wp) {
      const { x, y } = tileToPixel(wp.x, wp.y);
      c.px = x;
      c.py = y;
    }
    c.state = 'idle';
    c.stateTimer = randRange(behaviorConfig.idleDurationMin, behaviorConfig.idleDurationMax);

    // Face toward foosball table when standing beside it
    if (c.currentWaypoint === 'foosballLeft') c.direction = 'right';
    else if (c.currentWaypoint === 'foosballRight') c.direction = 'left';
  }
}

/** Update a character's activity state based on session data. */
export function setCharacterActivity(c: Character, isActive: boolean): void {
  if (isActive && !c.forceWork) {
    c.forceWork = true;
    // If idle or walking away, they'll be redirected back by the state machine
  } else if (!isActive && c.forceWork) {
    c.forceWork = false;
    // Allow natural idle/wander behavior to resume
  }
}

/** Trigger a temporary "return to desk now" boost for one character. */
export function triggerCharacterRushToDesk(c: Character, durationMs = 10_000): void {
  c.rushUntilMs = Math.max(c.rushUntilMs, Date.now() + Math.max(500, durationMs));
  c.startledUntilMs = Math.max(c.startledUntilMs, Date.now() + 200);
}

/** Set boss activity: works at desk when active, idles/wanders when not. */
export function setBossPresence(c: Character, isPresent: boolean): void {
  c.visible = true; // boss is always visible (no hiding)
  if (isPresent) {
    c.forceWork = true;
    // Snap to desk if not already there
    const deskWp = deskAssignments[c.id];
    const wp = waypointMap[deskWp];
    if (wp && c.state !== 'working') {
      const deskPy = (wp.y + 1) * TILE_SIZE;
      c.px = wp.x * TILE_SIZE;
      c.py = deskPy - 15;
      c.state = 'working';
      c.direction = 'down';
      c.currentWaypoint = deskWp;
    }
  } else {
    c.forceWork = false;
  }
}

function resolveFrame(c: Character): Frame | null {
  const sid = c.spriteId;

  switch (c.state) {
    case 'working': {
      // Alternate between sit and type
      const name = c.animFrame === 0 ? `${sid}_type` : `${sid}_sit`;
      return getFrame('characters', name);
    }
    case 'walking': {
      const name = `${sid}_walk_${c.direction}_${c.animFrame}`;
      return getFrame('characters', name);
    }
    case 'idle': {
      // Side-on idle beside foosball table: reuse side walk stances.
      if (FOOSBALL_WAYPOINTS.has(c.currentWaypoint) && (c.direction === 'left' || c.direction === 'right')) {
        const sideFrame = c.animFrame === 0 ? 0 : 2;
        const sideName = `${sid}_walk_${c.direction}_${sideFrame}`;
        const side = getFrame('characters', sideName);
        if (side) return side;
      }
      const name = `${sid}_idle_${c.animFrame}`;
      return getFrame('characters', name);
    }
  }
}
