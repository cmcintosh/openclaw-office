// Tile sprites (16x16) - floor, wall, outdoor tiles

import { _, O } from './palette';

export interface SpriteData {
  width: number;
  height: number;
  pixels: number[][];
}

export const TILES: Record<string, SpriteData> = {};

// Plain floor - warm beige with faint grid lines
TILES["floor_plain"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 0 || y === 0) return 33;
    if (x === 15 || y === 15) return 76;
    if ((x + y) % 8 === 0) return 75;
    if ((x * y) % 13 === 0) return 33;
    return 32;
  })
)};

// Carpet
TILES["carpet"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 0 || x === 15 || y === 0 || y === 15) return 35;
    if ((x + y) % 6 === 0) return 35;
    if ((x * y + 3) % 11 === 0) return 35;
    return 34;
  })
)};

// Kitchen tile (checkerboard)
TILES["kitchen_tile"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    const cx = Math.floor(x / 4) % 2;
    const cy = Math.floor(y / 4) % 2;
    return (cx ^ cy) ? 36 : 37;
  })
)};

// Wall (bottom): outline at bottom edge — for bottom walls (row 24)
TILES["wall"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (y === 15) return O; // bottom outline
    if (y >= 13) return 74; // baseboard dark
    if (y === 12) return 39; // shadow line between wall and baseboard
    if (x <= 1) return 39; // left edge darker strip for depth
    if (x >= 14) return 39; // right edge
    if (y <= 1) return 73; // top highlight
    return 38;
  })
)};

// Wall (top): outline at top edge — for top/back walls (row 3)
TILES["wall_top"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (y === 0) return O; // top outline
    if (y <= 2) return 74; // baseboard dark
    if (y === 3) return 39; // shadow line
    if (x <= 1) return 39; // left edge
    if (x >= 14) return 39; // right edge
    if (y >= 14) return 73; // bottom highlight
    return 38;
  })
)};

// Wall (left): outline at left edge — for left walls (col 0)
TILES["wall_left"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 0) return 74; // baseboard dark (narrow)
    if (x === 1) return 39; // shadow line
    if (y <= 1) return 39; // top edge
    if (y >= 14) return 39; // bottom edge
    if (x >= 14) return 73; // right highlight
    return 38;
  })
)};

// Wall (right): outline at right edge — for right walls (col 14)
TILES["wall_right"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 15) return 74; // baseboard dark (narrow)
    if (x === 14) return 39; // shadow line
    if (y <= 1) return 39; // top edge
    if (y >= 14) return 39; // bottom edge
    if (x <= 1) return 73; // left highlight
    return 38;
  })
)};

// Left wall window: outline on left, gradient light→dark (left to right)
TILES["wall_window"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 0) return 74; // baseboard (narrow)
    if (x === 1) return 39; // shadow
    // Window area (shifted right to accommodate left baseboard)
    if (x >= 3 && x <= 14 && y >= 2 && y <= 13) {
      if (x === 3 || x === 14 || y === 2 || y === 13) return O;
      if (x < 7) return 71;  // light
      if (x < 10) return 40; // mid
      return 41;             // dark
    }
    if (y <= 1) return 39;
    if (y >= 14) return 39;
    if (x >= 14) return 73;
    return 38;
  })
)};

// Right wall window: outline on right, gradient dark→light (left to right)
TILES["wall_window_right"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 15) return 74; // baseboard (narrow)
    if (x === 14) return 39; // shadow
    // Window area (shifted left to accommodate right baseboard)
    if (x >= 1 && x <= 12 && y >= 2 && y <= 13) {
      if (x === 1 || x === 12 || y === 2 || y === 13) return O;
      if (x < 5) return 41;  // dark
      if (x < 8) return 40;  // mid
      return 71;              // light
    }
    if (y <= 1) return 39;
    if (y >= 14) return 39;
    if (x <= 1) return 73;
    return 38;
  })
)};

// Top wall window: outline on top, gradient light→dark (top to bottom)
TILES["wall_window_top"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (y === 0) return O; // top outline
    if (y <= 2) return 74; // baseboard
    if (y === 3) return 39; // shadow
    // Window area (shifted down to accommodate top baseboard)
    if (x >= 2 && x <= 13 && y >= 5 && y <= 14) {
      if (x === 2 || x === 13 || y === 5 || y === 14) return O;
      if (y < 8) return 71;  // light
      if (y < 11) return 40; // mid
      return 41;             // dark
    }
    if (x <= 1) return 39;
    if (x >= 14) return 39;
    if (y >= 14) return 73;
    return 38;
  })
)};

// Bottom wall window: outline on bottom, gradient dark→light (top to bottom)
TILES["wall_window_bottom"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (y === 15) return O; // bottom outline
    if (y >= 13) return 74; // baseboard
    if (y === 12) return 39; // shadow
    // Window area (in upper portion, baseboard at bottom)
    if (x >= 2 && x <= 13 && y >= 1 && y <= 11) {
      if (x === 2 || x === 13 || y === 1 || y === 11) return O;
      if (y < 4) return 41;  // dark (inside, top)
      if (y < 7) return 40;  // mid
      return 71;             // light (outside, bottom)
    }
    if (x <= 1) return 39;
    if (x >= 14) return 39;
    if (y === 0) return 73;
    return 38;
  })
)};

// Wall + door with depth
TILES["wall_door"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (y === 15) return O;
    // door area: x 4-11, y 3-15
    if (x >= 4 && x <= 11 && y >= 3) {
      if (x === 4 || x === 11 || y === 3) return O; // door frame
      if (x === 9 && y === 10) return 16; // knob
      return (x <= 7) ? 42 : 43; // door panels
    }
    if (y >= 13) return 74;
    if (y === 12) return 39;
    if (x <= 1) return 39;
    if (x >= 14) return 39;
    if (y <= 1) return 73;
    return 38;
  })
)};

// Grass tile - green with subtle variation
TILES["grass"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if ((x + y * 3) % 7 === 0) return 105; // highlight blades
    if ((x * 2 + y) % 9 === 0) return 104; // dark patches
    if ((x + y) % 11 === 0) return 106; // darkest accent
    if (x === 0 || y === 0) return 104; // subtle grid edge
    return 103;
  })
)};

// Pavement tile - gray concrete with crack lines
TILES["pavement"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    if (x === 0 || y === 0) return 109; // grid lines
    if (x === 15 || y === 15) return 110; // darker edge
    // Crack pattern
    if (x === 8 && y >= 4 && y <= 12) return 110;
    if (y === 8 && x >= 2 && x <= 6) return 110;
    if ((x + y) % 12 === 0) return 109; // subtle texture
    if ((x * y) % 17 === 0) return 108; // mid variation
    return 107;
  })
)};

// Tree tile - round canopy top-down with trunk hint, non-walkable
TILES["tree"] = { width: 16, height: 16, pixels: Array.from({ length: 16 }, (__, y) =>
  Array.from({ length: 16 }, (__, x) => {
    // Circular canopy centered at (7.5, 7)
    const dx = x - 7.5;
    const dy = y - 7;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 7) return 103; // grass outside canopy
    if (dist > 6.2) return 115; // darkest edge ring
    if (dist > 5.5) return 112; // dark outer foliage
    // Trunk visible at bottom center
    if (y >= 12 && x >= 6 && x <= 9) return 111;
    // Highlight on top-left
    if (dy < -1 && dx < 0 && dist < 4) return 114;
    if (dist < 3) return 113; // mid foliage center
    return 112; // dark foliage fill
  })
)};
