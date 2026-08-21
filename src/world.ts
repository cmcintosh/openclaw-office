// Office world definition: tile map, furniture, waypoints, desk assignments, behavior config
// Grid: 15 columns x 35 rows, each tile 16x16 px => 240x560 virtual pixels

// --- Tile types ---

export const enum TileType {
  Floor = 0,
  Carpet = 1,
  Wall = 2,            // bottom wall (outline at bottom)
  WindowWall = 3,      // left wall window
  DoorWall = 4,
  KitchenTile = 5,
  Grass = 6,
  Pavement = 7,
  Tree = 8,
  WindowWallRight = 9, // right wall window
  WindowWallTop = 10,  // back/top wall window (horizontal)
  WallTop = 11,        // top wall (outline at top)
  WallLeft = 12,       // left wall (outline at left)
  WallRight = 13,      // right wall (outline at right)
  WindowWallBottom = 14, // bottom wall window (outline at bottom)
}

// --- Tile map (35 rows x 15 cols) ---
// Row 3 = top wall, Row 24 = bottom wall with door at col 7
// Zone 1 (rows 3-10): Boss area
// Zone 2 (rows 11-20): Worker area (6 desks in 3×2 grid)
// Zone 3 (rows 21-24): Break / lounge area (compact)
// Zone 4 (rows 25-34): Outdoor entrance area

export const tileMap: number[][] = [
  // === TOP GRASS SAFE-AREA BUFFER (rows 0-2) ===
  // Row 0:
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  // Row 1:
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  // Row 2:
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],

  // === BOSS AREA (rows 3-10) — carpet floor, distinct Boss Zone ===
  // Row 3: top wall with 4 horizontal windows (symmetric)
  [11, 11, 10, 11, 11, 10, 11, 11, 11, 10, 11, 11, 10, 11, 11],
  // Row 4:
  [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13],
  // Row 5:
  [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13],
  // Row 6:  window
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9],
  // Row 7:
  [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13],
  // Row 8:
  [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13],
  // Row 9:  window
  [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9],
  // Row 10:
  [12, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 13],

  // === WORKER AREA (rows 11-20) — 6 desks in 3×2 grid ===
  // Row 11:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 12:  window
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
  // Row 13:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 14:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 15: window
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
  // Row 16:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 17:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 18: window
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
  // Row 19:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 20:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],

  // === BREAK / LOUNGE AREA (rows 21-24) ===
  // Row 21: window
  [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
  // Row 22:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 23:
  [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13],
  // Row 24: bottom wall with entrance + 2 windows near grass
  [2, 2, 2, 14, 2, 2, 0, 0, 0, 2, 2, 14, 2, 2, 2],

  // === OUTDOOR / ENTRANCE AREA (rows 25-28 visible, 29-34 under tab bar) ===
  // Row 25: entrance porch + bush on left
  [6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6],
  // Row 26: grass with bench
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  // Row 27: parking — tree, car, gap, car, tree
  [6, 6, 8, 7, 7, 7, 7, 6, 7, 7, 7, 7, 8, 6, 6],
  // Row 28: grass bottom
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  // Row 29-34: under tab bar (grass filler)
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
];

// --- Furniture ---

export interface FurnitureItem {
  type: string;
  x: number; // tile col
  y: number; // tile row
  tileWidth: number;
  tileHeight: number;
  offsetX?: number; // pixel offset within tile (default 0)
  offsetY?: number; // pixel offset within tile (default 0)
}

export const furnitureList: FurnitureItem[] = [
  // === BOSS AREA ===
  // Bookshelf against back wall behind boss (centered cols 5-7)
  { type: 'bookshelf', x: 5, y: 4, tileWidth: 3, tileHeight: 1 },

  // Plants flanking boss zone (plant_1: leafy potted plant)
  { type: 'plant_1',   x: 3, y: 3, tileWidth: 1, tileHeight: 1 },
  { type: 'plant_1',   x: 8, y: 3, tileWidth: 1, tileHeight: 1 },

  // Boss workstation: chair (row 3), desk (row 4), monitor on desk
  { type: 'chair',          x: 6, y: 6, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'boss_desk_only', x: 5, y: 7, tileWidth: 3, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',        x: 6, y: 7, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // Secretary workstation: chair (row 4), desk (row 5), monitor on desk — shifted right+5, up-2
  { type: 'chair',               x: 11, y: 7, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'secretary_desk_only', x: 10, y: 8, tileWidth: 2, tileHeight: 1, offsetY: 3 }, 
  { type: 'monitor',             x: 11, y: 8, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // Filing cabinet
  { type: 'filing_cabinet', x: 1, y: 7, tileWidth: 1, tileHeight: 1 },

  // Toolbox on right wall — tools indicator
  { type: 'toolbox', x: 13, y: 14, tileWidth: 1, tileHeight: 1 },

  // === WORKER AREA (6 desks in 3×2 grid) ===
  // W1: Sub-agent (left col, row 1)
  { type: 'chair',     x: 3,  y: 12,  tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'desk_only', x: 2,  y: 13, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 3,  y: 13, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // W2: Cron (right col, row 1)
  { type: 'chair',     x: 10, y: 12,  tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3},
  { type: 'desk_only', x: 9,  y: 13, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 10, y: 13, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // Wall calendar above filing cabinet — cron job indicator
  { type: 'wall_calendar', x: 1, y: 5, tileWidth: 1, tileHeight: 1 },

  // W3: Channel 1 (left col, row 2)
  { type: 'chair',     x: 3,  y: 15, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'desk_only', x: 2,  y: 16, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 3,  y: 16, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // W4: Channel 2 (right col, row 2)
  { type: 'chair',     x: 10, y: 15, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'desk_only', x: 9,  y: 16, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 10, y: 16, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // Time bell / office clock between channel desks
  { type: 'office_clock', x: 6, y: 15, tileWidth: 1, tileHeight: 2 },

  // W5: Channel 3 (left col, row 3)
  { type: 'chair',     x: 3,  y: 18, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'desk_only', x: 2,  y: 19, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 3,  y: 19, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // W6: Channel 4 (right col, row 3)
  { type: 'chair',     x: 10, y: 18, tileWidth: 1, tileHeight: 1, offsetY: 10, offsetX: -3 },
  { type: 'desk_only', x: 9,  y: 19, tileWidth: 2, tileHeight: 1, offsetY: 3 },
  { type: 'monitor',   x: 10, y: 19, tileWidth: 1, tileHeight: 1, offsetY: -5 },

  // === BREAK / LOUNGE AREA ===

  { type: 'foosball', x: 3, y: 22, tileWidth: 3, tileHeight: 1 },

  // Coffee machine
  { type: 'coffee_machine', x: 13, y: 21, tileWidth: 1, tileHeight: 1, offsetY: 2 },  // break area, right wall
  { type: 'coffee_machine', x: 13, y: 7,  tileWidth: 1, tileHeight: 1, offsetY: 2 },  // boss area, right wall
  { type: 'whiteboard',      x: 9,  y: 4,  tileWidth: 5, tileHeight: 2 },              // boss area, top-right wall

  // Plants
  { type: 'plant_1',  x: 1,  y: 22, tileWidth: 1, tileHeight: 1 },  // by window, lounge left
  { type: 'plant_1',  x: 11,  y: 22, tileWidth: 1, tileHeight: 1 },  // next to coffee machine
  { type: 'plant_2',  x: 1,  y: 9, tileWidth: 1, tileHeight: 1 },  // break area left
  { type: 'plant_2',  x: 13, y: 9, tileWidth: 1, tileHeight: 1 },  // break area right

  // === OUTDOOR AREA ===
  // Trees (decorative sprite overlays, placed on grass)
  { type: 'tree', x: 2,  y: 26, tileWidth: 1, tileHeight: 2 },
  { type: 'tree', x: 12, y: 26, tileWidth: 1, tileHeight: 2 },

  // Bush by entrance (plant_3: outdoor shrub)
  { type: 'plant_3',  x: 5,  y: 24, tileWidth: 1, tileHeight: 1 },  // left of entrance
  { type: 'plant_3',  x: 9,  y: 24, tileWidth: 1, tileHeight: 1 },  // right of entrance

  // Mailbox at entrance — pair request indicator
  { type: 'mailbox',  x: 10, y: 25, tileWidth: 1, tileHeight: 1 },

  // Bench (along path, left side)
  { type: 'bench', x: 0, y: 28, tileWidth: 2, tileHeight: 1 },
  { type: 'signal_tower', x: 13, y: 26, tileWidth: 2, tileHeight: 3 },

  // Cars in parking lot — 1 row, trees on sides (tile 8 in tileMap)
  { type: 'car', x: 3,  y: 27, tileWidth: 2, tileHeight: 1 },  // left car
  { type: 'car', x: 9,  y: 27, tileWidth: 2, tileHeight: 1 },  // right car
];

// --- Waypoints ---

export interface Waypoint {
  x: number; // tile col
  y: number; // tile row
}

export const waypointMap: Record<string, Waypoint> = {
  // Desk positions (where the character sits in the chair, facing down)
  bossDesk:      { x: 6,  y: 6 },
  assistantDesk: { x: 11,  y: 7 },
  subagentDesk:  { x: 3,  y: 12 },
  cronDesk:      { x: 10, y: 12 },
  channel1Desk:  { x: 3,  y: 15 },
  channel2Desk:  { x: 10, y: 15 },
  channel3Desk:  { x: 3,  y: 18 },
  channel4Desk:  { x: 10, y: 18 },

  // Leisure / utility waypoints
  coffeeMachine: { x: 13, y: 23 },
  foosballLeft:  { x: 2,  y: 22 },
  foosballRight: { x: 6,  y: 22 },

  waterCoolerBoss: { x: 13, y: 6 },
  windowLeft:    { x: 1,  y: 7 },
  windowRight:   { x: 1,  y: 9 },
  windowWorker:  { x: 1,  y: 15 },
  window4:       { x: 13, y: 18 },

  // Outdoor waypoints
  entrance:      { x: 7,  y: 25 },
  bench:         { x: 3,  y: 25 },
  parkingLot:    { x: 11, y: 27 },
};

// --- Desk assignments (character ID -> waypoint key) ---

export const deskAssignments: Record<string, string> = {
  boss:      'bossDesk',
  assistant: 'assistantDesk',
  subagent:  'subagentDesk',
  cron:      'cronDesk',
  channel1:  'channel1Desk',
  channel2:  'channel2Desk',
  channel3:  'channel3Desk',
  channel4:  'channel4Desk',
};

// --- Character behavior config ---

export interface BehaviorConfig {
  workingDurationMin: number; // seconds
  workingDurationMax: number;
  idleDurationMin: number;
  idleDurationMax: number;
  walkSpeed: number; // tiles per second
}

export const behaviorConfig: BehaviorConfig = {
  workingDurationMin: 10,
  workingDurationMax: 30,
  idleDurationMin: 5,
  idleDurationMax: 15,
  walkSpeed: 1,
};

// --- Helpers ---

export const TILE_SIZE = 16;
export const GRID_COLS = 15;
export const GRID_ROWS = 35;
export const WORLD_WIDTH = GRID_COLS * TILE_SIZE;  // 240
export const WORLD_HEIGHT = GRID_ROWS * TILE_SIZE; // 560

/** Convert tile coords to pixel coords (top-left of tile). */
export function tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
  return { x: tileX * TILE_SIZE, y: tileY * TILE_SIZE };
}

/** Check if a tile is walkable (floor, carpet, kitchen tile, or door). */
export function isWalkable(col: number, row: number): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  const tile = tileMap[row][col];
  return tile === TileType.Floor
      || tile === TileType.Carpet
      || tile === TileType.KitchenTile
      || tile === TileType.DoorWall
      || tile === TileType.Pavement
      || tile === TileType.Grass;
}

/** Get a list of idle waypoint keys (all waypoints except desk waypoints). */
export function getIdleWaypoints(): string[] {
  const deskWaypoints = new Set(Object.values(deskAssignments));
  return Object.keys(waypointMap).filter((k) => !deskWaypoints.has(k));
}

// --- Furniture occupancy grid (built once at load) ---

const furnitureOccupied = new Set<string>();

function buildFurnitureOccupancy(): void {
  for (const f of furnitureList) {
    for (let dy = 0; dy < f.tileHeight; dy++) {
      for (let dx = 0; dx < f.tileWidth; dx++) {
        furnitureOccupied.add(`${f.x + dx},${f.y + dy}`);
      }
    }
  }
}
buildFurnitureOccupancy();

/** Check if a tile is passable: walkable terrain AND no furniture on it. */
export function isPassable(col: number, row: number): boolean {
  if (!isWalkable(col, row)) return false;
  return !furnitureOccupied.has(`${col},${row}`);
}
