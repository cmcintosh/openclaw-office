// Tile-based A* pathfinding: 4 directions only, avoids furniture

import { waypointMap, tileToPixel, isPassable, TILE_SIZE, GRID_COLS, GRID_ROWS, type Waypoint } from './world';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PathSegment {
  fromPx: number;
  fromPy: number;
  toPx: number;
  toPy: number;
  direction: Direction;
  distance: number;
}

// 4-directional neighbors
const DIRS: { dx: number; dy: number; dir: Direction }[] = [
  { dx: 0, dy: -1, dir: 'up' },
  { dx: 0, dy: 1, dir: 'down' },
  { dx: -1, dy: 0, dir: 'left' },
  { dx: 1, dy: 0, dir: 'right' },
];

function heuristic(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by); // Manhattan distance
}

function key(x: number, y: number): number {
  return y * GRID_COLS + x;
}

/**
 * A* search from tile (sx,sy) to tile (gx,gy).
 * Returns array of {x,y} tile coords (including start and goal), or [] if no path.
 */
function astar(sx: number, sy: number, gx: number, gy: number): { x: number; y: number }[] {
  if (sx === gx && sy === gy) return [{ x: sx, y: sy }];

  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();

  const startKey = key(sx, sy);
  const goalKey = key(gx, gy);

  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(sx, sy, gx, gy));

  // Simple priority queue (array sorted by fScore)
  const open: number[] = [startKey];
  const openSet = new Set<number>([startKey]);
  const closed = new Set<number>();

  while (open.length > 0) {
    // Find node with lowest fScore
    let bestIdx = 0;
    let bestF = fScore.get(open[0]) ?? Infinity;
    for (let i = 1; i < open.length; i++) {
      const f = fScore.get(open[i]) ?? Infinity;
      if (f < bestF) { bestF = f; bestIdx = i; }
    }

    const currentKey = open[bestIdx];
    open.splice(bestIdx, 1);
    openSet.delete(currentKey);

    if (currentKey === goalKey) {
      // Reconstruct path
      const path: { x: number; y: number }[] = [];
      let k = goalKey;
      while (k !== undefined) {
        const cy = Math.floor(k / GRID_COLS);
        const cx = k % GRID_COLS;
        path.unshift({ x: cx, y: cy });
        const prev = cameFrom.get(k);
        if (prev === undefined) break;
        k = prev;
      }
      return path;
    }

    closed.add(currentKey);

    const cx = currentKey % GRID_COLS;
    const cy = Math.floor(currentKey / GRID_COLS);
    const currentG = gScore.get(currentKey) ?? Infinity;

    for (const { dx, dy } of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;

      const nk = key(nx, ny);
      if (closed.has(nk)) continue;

      // Goal tile is always passable (it's a waypoint), other tiles must be passable
      if (nk !== goalKey && !isPassable(nx, ny)) continue;
      // Start tile is also always passable (character is already there)
      // (handled by not checking isPassable for start — start is in closed after first iteration)

      const tentativeG = currentG + 1;

      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic(nx, ny, gx, gy));

        if (!openSet.has(nk)) {
          open.push(nk);
          openSet.add(nk);
        }
      }
    }
  }

  return []; // No path found
}

/**
 * Build path segments from one waypoint to another.
 * Merges consecutive same-direction tiles into single segments.
 */
export function buildPath(fromWaypoint: string, toWaypoint: string): PathSegment[] {
  const from = waypointMap[fromWaypoint];
  const to = waypointMap[toWaypoint];
  if (!from || !to) return [];

  const tilePath = astar(from.x, from.y, to.x, to.y);
  if (tilePath.length < 2) return [];

  // Merge consecutive same-direction steps into segments
  const segments: PathSegment[] = [];
  let segStart = tilePath[0];
  let prevDir: Direction | null = null;

  for (let i = 1; i < tilePath.length; i++) {
    const prev = tilePath[i - 1];
    const curr = tilePath[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dir: Direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';

    if (dir !== prevDir && prevDir !== null) {
      // Direction changed — emit previous segment
      const fromPx = tileToPixel(segStart.x, segStart.y);
      const toPx = tileToPixel(prev.x, prev.y);
      const ddx = toPx.x - fromPx.x;
      const ddy = toPx.y - fromPx.y;
      segments.push({
        fromPx: fromPx.x, fromPy: fromPx.y,
        toPx: toPx.x, toPy: toPx.y,
        direction: prevDir,
        distance: Math.abs(ddx) + Math.abs(ddy),
      });
      segStart = prev;
    }
    prevDir = dir;
  }

  // Emit final segment
  if (prevDir !== null) {
    const fromPx = tileToPixel(segStart.x, segStart.y);
    const toPx = tileToPixel(tilePath[tilePath.length - 1].x, tilePath[tilePath.length - 1].y);
    const ddx = toPx.x - fromPx.x;
    const ddy = toPx.y - fromPx.y;
    segments.push({
      fromPx: fromPx.x, fromPy: fromPx.y,
      toPx: toPx.x, toPy: toPx.y,
      direction: prevDir,
      distance: Math.abs(ddx) + Math.abs(ddy),
    });
  }

  return segments;
}

/**
 * Build path segments from the character's current pixel position to a waypoint.
 * This avoids visual snapping when a walking character gets redirected mid-segment.
 */
export function buildPathFromPixel(fromPx: number, fromPy: number, toWaypoint: string): PathSegment[] {
  const to = waypointMap[toWaypoint];
  if (!to) return [];

  const sx = Math.round(fromPx / TILE_SIZE);
  const sy = Math.round(fromPy / TILE_SIZE);
  const tilePath = astar(sx, sy, to.x, to.y);
  if (tilePath.length < 2) return [];

  const segments: PathSegment[] = [];
  let segStart = tilePath[0];
  let prevDir: Direction | null = null;

  for (let i = 1; i < tilePath.length; i++) {
    const prev = tilePath[i - 1];
    const curr = tilePath[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dir: Direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';

    if (dir !== prevDir && prevDir !== null) {
      const from = tileToPixel(segStart.x, segStart.y);
      const toPx = tileToPixel(prev.x, prev.y);
      segments.push({
        fromPx: from.x,
        fromPy: from.y,
        toPx: toPx.x,
        toPy: toPx.y,
        direction: prevDir,
        distance: Math.abs(toPx.x - from.x) + Math.abs(toPx.y - from.y),
      });
      segStart = prev;
    }
    prevDir = dir;
  }

  if (prevDir !== null) {
    const from = tileToPixel(segStart.x, segStart.y);
    const end = tileToPixel(tilePath[tilePath.length - 1].x, tilePath[tilePath.length - 1].y);
    segments.push({
      fromPx: from.x,
      fromPy: from.y,
      toPx: end.x,
      toPy: end.y,
      direction: prevDir,
      distance: Math.abs(end.x - from.x) + Math.abs(end.y - from.y),
    });
  }

  const first = segments[0];
  if (first) {
    first.fromPx = fromPx;
    first.fromPy = fromPy;
    first.distance = Math.abs(first.toPx - first.fromPx) + Math.abs(first.toPy - first.fromPy);
  }

  return segments;
}

export function lerpPosition(
  segment: PathSegment,
  progress: number, // 0..1
): { x: number; y: number } {
  return {
    x: segment.fromPx + (segment.toPx - segment.fromPx) * progress,
    y: segment.fromPy + (segment.toPy - segment.fromPy) * progress,
  };
}
