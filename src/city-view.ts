/**
 * Pixel City View — overhead isometric-style map with doors for each department.
 * Clicking a door enters the office room for that department.
 * 
 * Renders a small pixel-art city scene with buildings. Each department gets
 * a building with a labeled door. Buildings are arranged in a grid.
 */

import type { Department } from './types';
import { pixelFont } from './pixel-font';

export interface CityViewConfig {
  departments: Department[];
  onSelectDepartment: (dept: Department) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

// Canvas dimensions
const CITY_W = 480;
const CITY_H = 320;
const TILE = 16;

// Building layout grid
const BUILDING_COLS = 4;
const BUILDING_ROWS = 3;
const BUILDING_W = 96;  // 6 tiles
const BUILDING_H = 80;  // 5 tiles
const BUILDING_GAP_X = 24;
const BUILDING_GAP_Y = 28;
const GRID_OFFSET_X = 24;
const GRID_OFFSET_Y = 24;

// Color palette per department (cycled)
const DEPT_COLORS = [
  { wall: '#4a90d9', roof: '#3a7bc8', door: '#f0a040', accent: '#5aa0e9' },
  { wall: '#d94a4a', roof: '#c83a3a', door: '#f0c040', accent: '#e95a5a' },
  { wall: '#4ad97a', roof: '#3ac86a', door: '#f08040', accent: '#5ae98a' },
  { wall: '#d9a04a', roof: '#c8903a', door: '#80c0f0', accent: '#e9b05a' },
  { wall: '#9a4ad9', roof: '#8a3ac8', door: '#f0e040', accent: '#aa5ae9' },
  { wall: '#4ad9d9', roof: '#3ac8c8', door: '#f040a0', accent: '#5ae9e9' },
  { wall: '#d94a9a', roof: '#c83a8a', door: '#40f0e0', accent: '#e95aaa' },
  { wall: '#7a7a7a', roof: '#6a6a6a', door: '#f0f040', accent: '#8a8a8a' },
  { wall: '#4a6ad9', roof: '#3a5ac8', door: '#f0a080', accent: '#5a7ae9' },
  { wall: '#d96a4a', roof: '#c85a3a', door: '#80f0c0', accent: '#e97a5a' },
  { wall: '#4ad96a', roof: '#3ac85a', door: '#c080f0', accent: '#5ae97a' },
  { wall: '#9a9a4a', roof: '#8a8a3a', door: '#40c0f0', accent: '#aaaa5a' },
];

export function renderCityView(canvas: HTMLCanvasElement, config: CityViewConfig): void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Set canvas size
  canvas.width = CITY_W;
  canvas.height = CITY_H;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';

  // Draw ground (grass + pavement)
  drawGround(ctx);

  // Draw buildings
  config.departments.forEach((dept, i) => {
    const col = i % BUILDING_COLS;
    const row = Math.floor(i / BUILDING_COLS) % BUILDING_ROWS;
    const x = GRID_OFFSET_X + col * (BUILDING_W + BUILDING_GAP_X);
    const y = GRID_OFFSET_Y + row * (BUILDING_H + BUILDING_GAP_Y);
    const colors = DEPT_COLORS[i % DEPT_COLORS.length];
    drawBuilding(ctx, x, y, dept, colors);
  });

  // Draw header
  drawHeader(ctx, config.departments.length);

  // Setup click handling
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CITY_W / rect.width;
    const scaleY = CITY_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    // Check building door hits
    config.departments.forEach((dept, i) => {
      const col = i % BUILDING_COLS;
      const row = Math.floor(i / BUILDING_COLS) % BUILDING_ROWS;
      const x = GRID_OFFSET_X + col * (BUILDING_W + BUILDING_GAP_X);
      const y = GRID_OFFSET_Y + row * (BUILDING_H + BUILDING_GAP_Y);
      // Door is at bottom center of building
      const doorX = x + BUILDING_W / 2 - 12;
      const doorY = y + BUILDING_H - 24;
      if (cx >= doorX && cx <= doorX + 24 && cy >= doorY && cy <= doorY + 24) {
        config.onSelectDepartment(dept);
        return;
      }
    });

    // Settings button (top-right corner)
    if (cx >= CITY_W - 40 && cx <= CITY_W - 8 && cy >= 8 && cy <= 32) {
      config.onOpenSettings();
    }

    // Logout button (top-right corner, left of settings)
    if (cx >= CITY_W - 80 && cx <= CITY_W - 48 && cy >= 8 && cy <= 32) {
      config.onLogout();
    }
  };
}

function drawGround(ctx: CanvasRenderingContext2D): void {
  // Grass background
  ctx.fillStyle = '#5a8a3a';
  ctx.fillRect(0, 0, CITY_W, CITY_H);

  // Pavement roads between buildings
  ctx.fillStyle = '#8a8a7a';
  // Horizontal roads
  for (let r = 0; r < BUILDING_ROWS; r++) {
    const y = GRID_OFFSET_Y + r * (BUILDING_H + BUILDING_GAP_Y) - BUILDING_GAP_Y / 2;
    ctx.fillRect(0, y, CITY_W, BUILDING_GAP_Y);
  }
  // Vertical roads
  ctx.fillStyle = '#7a7a6a';
  for (let c = 0; c < BUILDING_COLS; c++) {
    const x = GRID_OFFSET_X + c * (BUILDING_W + BUILDING_GAP_X) + BUILDING_W;
    if (c < BUILDING_COLS - 1) {
      ctx.fillRect(x, 0, BUILDING_GAP_X, CITY_H);
    }
  }

  // Road lane markings
  ctx.fillStyle = '#dada6a';
  for (let r = 0; r < BUILDING_ROWS; r++) {
    const y = GRID_OFFSET_Y + r * (BUILDING_H + BUILDING_GAP_Y) - BUILDING_GAP_Y / 2;
    for (let x = 0; x < CITY_W; x += 16) {
      ctx.fillRect(x, y - 1, 8, 2);
    }
  }
}

function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dept: Department,
  colors: { wall: string; roof: string; door: string; accent: string },
): void {
  const w = BUILDING_W;
  const h = BUILDING_H;

  // Building shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x + 4, y + 4, w, h);

  // Building body (wall)
  ctx.fillStyle = colors.wall;
  ctx.fillRect(x, y, w, h);

  // Roof
  ctx.fillStyle = colors.roof;
  ctx.fillRect(x, y, w, 12);
  ctx.fillRect(x, y, 4, h);
  ctx.fillRect(x + w - 4, y, 4, h);

  // Windows (grid pattern)
  ctx.fillStyle = colors.accent;
  const winW = 12;
  const winH = 10;
  const winGapX = 8;
  const winGapY = 6;
  const winStartX = x + 8;
  const winStartY = y + 20;
  const winCols = Math.floor((w - 16) / (winW + winGapX));
  const winRows = Math.floor((h - 32) / (winH + winGapY));
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < winCols; c++) {
      const wx = winStartX + c * (winW + winGapX);
      const wy = winStartY + r * (winH + winGapY);
      // Window frame
      ctx.fillStyle = colors.roof;
      ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);
      // Window glass
      ctx.fillStyle = '#a0d8f0';
      ctx.fillRect(wx, wy, winW, winH);
      // Window reflection
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(wx + 1, wy + 1, 4, 4);
    }
  }

  // Door (bottom center, 24x24px)
  const doorX = x + w / 2 - 12;
  const doorY = y + h - 24;
  // Door frame
  ctx.fillStyle = colors.roof;
  ctx.fillRect(doorX - 2, doorY - 2, 28, 28);
  // Door
  ctx.fillStyle = colors.door;
  ctx.fillRect(doorX, doorY, 24, 24);
  // Door handle
  ctx.fillStyle = '#333';
  ctx.fillRect(doorX + 16, doorY + 12, 3, 3);
  // "Enter" indicator (glowing effect on door)
  ctx.fillStyle = 'rgba(255,255,200,0.4)';
  ctx.fillRect(doorX + 2, doorY + 2, 20, 2);

  // Department name sign above door
  const signW = Math.min(w - 8, dept.name.length * 6 + 8);
  const signX = x + (w - signW) / 2;
  const signY = y + h - 40;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(signX, signY, signW, 12);
  ctx.fillStyle = '#fff';
  pixelFont.drawText(ctx, dept.name.toUpperCase(), signX + 4, signY + 2, 1);
}

function drawHeader(ctx: CanvasRenderingContext2D, deptCount: number): void {
  // Title bar
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CITY_W, 40);

  ctx.fillStyle = '#0f0';
  pixelFont.drawText(ctx, 'OPENCLAW OFFICE CITY', 8, 12, 1);
  pixelFont.drawText(ctx, `${deptCount} DEPARTMENTS`, 8, 24, 1);

  // Settings button (gear icon)
  ctx.fillStyle = 'rgba(0,40,0,0.8)';
  ctx.fillRect(CITY_W - 40, 8, 32, 24);
  ctx.fillStyle = '#0f0';
  pixelFont.drawText(ctx, '[S]', CITY_W - 32, 12, 1);
  pixelFont.drawText(ctx, 'CFG', CITY_W - 32, 22, 1);

  // Logout button
  ctx.fillStyle = 'rgba(40,0,0,0.8)';
  ctx.fillRect(CITY_W - 80, 8, 32, 24);
  ctx.fillStyle = '#f44';
  pixelFont.drawText(ctx, 'LOG', CITY_W - 72, 12, 1);
  pixelFont.drawText(ctx, 'OUT', CITY_W - 72, 22, 1);
}