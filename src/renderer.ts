// Canvas 2D renderer: owns canvas lifecycle, input handling, and render pipeline orchestration.
// Browser version with pan/zoom camera controls.

import { getSheet } from "./sprite-sheet";
import type { Character } from "./character";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  TILE_SIZE,
  furnitureList,
  tileToPixel,
} from "./world";
import {
  getGatewayState,
  isOfficeActionDisabled,
  isOfficeCharacterDisabled,
  postToRN,
  triggerOfficeClockRecall,
  EVENING_START_HOUR,
  EVENING_END_HOUR,
} from "./bridge";
import {
  isMenuOpen,
  openCharacterMenu,
  handleMenuTap,
  handleMenuTouchStart,
  handleMenuTouchMove,
  handleMenuTouchEnd,
  drawMenu,
} from "./menu";
import { getActiveBubble, handleBubbleTap } from "./bubble-scheduler";
import { getFrameSafe, resolveDrawPosition } from "./renderer-shared";
import { drawScene, resolveDeskHitCharacter } from "./renderer-scene";
import { drawOverlays } from "./renderer-overlays";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let latestCharacters: Character[] = [];
let lastTapAtMs = 0;
let seatedBobFrame = 0;
let seatedBobTimer = 0;
let screenAnimIndex = 0;
let screenAnimTimer = 0;
let sweatAnimFrame = 0;
let sweatAnimTimer = 0;

const VIRTUAL_WIDTH = WORLD_WIDTH;   // 240
const VIRTUAL_HEIGHT = WORLD_HEIGHT; // 560
const TOP_GRASS_CROP_PX = 0;

// === Camera state ===
let camX = 0;        // pan offset in world pixels
let camY = 0;        // pan offset in world pixels
let camZoom = 1;     // zoom factor
let minZoom = 0.5;
let maxZoom = 4;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCamX = 0;
let dragStartCamY = 0;
let dragMoved = false;
let pinchDist = 0;
let pinchStartZoom = 1;

// HUD element
let hudEl: HTMLDivElement | null = null;

export function initRenderer(canvasEl: HTMLCanvasElement): void {
  canvas = canvasEl;
  ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  canvas.style.imageRendering = "pixelated";
  canvas.style.imageRendering = "crisp-edges";
  canvas.style.touchAction = "none";
  canvas.style.display = "block";
  canvas.style.cursor = "grab";

  // Create HUD for controls
  hudEl = document.createElement("div");
  hudEl.id = "office-hud";
  hudEl.innerHTML = `
    <div class="hud-btn" id="hud-zoom-in" title="Zoom In">+</div>
    <div class="hud-btn" id="hud-zoom-out" title="Zoom Out">−</div>
    <div class="hud-btn" id="hud-fit" title="Fit to Screen">⛶</div>
    <div class="hud-btn" id="hud-reset" title="Reset View">⟲</div>
  `;
  Object.assign(hudEl.style, {
    position: "fixed" as const,
    bottom: "16px",
    left: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    zIndex: "100",
    pointerEvents: "none" as const,
  });
  document.body.appendChild(hudEl);

  // Style the buttons
  for (const btn of hudEl.querySelectorAll(".hud-btn")) {
    Object.assign((btn as HTMLElement).style, {
      width: "36px",
      height: "36px",
      background: "rgba(0,0,0,0.6)",
      color: "#0f0",
      border: "1px solid #030",
      borderRadius: "6px",
      fontSize: "18px",
      fontWeight: "bold" as const,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      pointerEvents: "auto" as const,
      userSelect: "none" as const,
      fontFamily: "monospace",
      transition: "background 0.15s",
    });
    (btn as HTMLElement).onmouseenter = () => {
      (btn as HTMLElement).style.background = "rgba(0,40,0,0.8)";
    };
    (btn as HTMLElement).onmouseleave = () => {
      (btn as HTMLElement).style.background = "rgba(0,0,0,0.6)";
    };
  }

  document.getElementById("hud-zoom-in")?.addEventListener("click", () => zoomBy(1.3));
  document.getElementById("hud-zoom-out")?.addEventListener("click", () => zoomBy(1 / 1.3));
  document.getElementById("hud-fit")?.addEventListener("click", fitToScreen);
  document.getElementById("hud-reset")?.addEventListener("click", resetView);

  resizeCanvasForViewport();
  fitToScreen();

  const handleResize = () => {
    resizeCanvasForViewport();
    clampCamera();
  };
  window.addEventListener("resize", handleResize);
  const visualViewport = window.visualViewport;
  visualViewport?.addEventListener("resize", handleResize);

  // === Mouse input ===
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (e.pointerType === "touch" && e.isPrimary === false) return; // handled by pinch

    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartCamX = camX;
    dragStartCamY = camY;
    canvas.style.cursor = "grabbing";

    const p = toCanvasPoint(e.clientX, e.clientY);
    handleMenuTouchStart(p.x, p.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;

      if (dragMoved) {
        const scale = getDisplayScale();
        camX = dragStartCamX - dx / scale;
        camY = dragStartCamY - dy / scale;
        clampCamera();
      }
    }

    const p = toCanvasPoint(e.clientX, e.clientY);
    handleMenuTouchMove(p.x, p.y);
  });

  canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    isDragging = false;
    canvas.style.cursor = "grab";
    handleMenuTouchEnd();

    if (!dragMoved) {
      handleTap(e.clientX, e.clientY);
    }
  });

  canvas.addEventListener("pointercancel", () => {
    isDragging = false;
    canvas.style.cursor = "grab";
    handleMenuTouchEnd();
  });

  // === Wheel zoom ===
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    zoomAt(e.clientX, e.clientY, factor);
  }, { passive: false });

  // === Touch pinch zoom ===
  let touches: Map<number, { x: number; y: number }> = new Map();
  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartZoom = camZoom;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (pinchDist > 0) {
        const factor = dist / pinchDist;
        const cx = (t1.clientX + t2.clientX) / 2;
        const cy = (t1.clientY + t2.clientY) / 2;
        camZoom = Math.max(minZoom, Math.min(maxZoom, pinchStartZoom * factor));
        clampCamera();
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) {
      pinchDist = 0;
    }
  });

  // === Keyboard controls ===
  document.addEventListener("keydown", (e) => {
    if (isMenuOpen()) return; // don't pan when menu is open
    const panSpeed = 20 / camZoom;
    switch (e.key) {
      case "ArrowLeft":  camX -= panSpeed; clampCamera(); break;
      case "ArrowRight": camX += panSpeed; clampCamera(); break;
      case "ArrowUp":    camY -= panSpeed; clampCamera(); break;
      case "ArrowDown":  camY += panSpeed; clampCamera(); break;
      case "+": case "=": zoomBy(1.3); break;
      case "-": case "_": zoomBy(1 / 1.3); break;
      case "0": fitToScreen(); break;
      case "r": case "R": resetView(); break;
    }
  });
}

function getDisplayScale(): number {
  const vw = window.innerWidth || VIRTUAL_WIDTH;
  const vh = window.innerHeight || VIRTUAL_HEIGHT;
  // Scale to fit world in viewport at zoom=1
  return Math.min(vw / VIRTUAL_WIDTH, vh / VIRTUAL_HEIGHT) * camZoom;
}

function resizeCanvasForViewport(): void {
  if (!canvas) return;
  const vw = window.innerWidth || VIRTUAL_WIDTH;
  const vh = window.innerHeight || VIRTUAL_HEIGHT;
  // Set canvas resolution to viewport size for crisp rendering
  canvas.width = vw;
  canvas.height = vh;
  canvas.style.width = `${vw}px`;
  canvas.style.height = `${vh}px`;
  ctx.imageSmoothingEnabled = false;
}

function clampCamera(): void {
  const scale = getDisplayScale();
  const vw = canvas.width;
  const vh = canvas.height;

  // World dimensions in screen pixels at current zoom
  const worldW = VIRTUAL_WIDTH * scale;
  const worldH = VIRTUAL_HEIGHT * scale;

  if (worldW <= vw) {
    // Center horizontally if world is smaller than viewport
    camX = (VIRTUAL_WIDTH - vw / scale) / 2;
  } else {
    const maxX = VIRTUAL_WIDTH - vw / scale;
    camX = Math.max(0, Math.min(maxX, camX));
  }

  if (worldH <= vh) {
    camY = (VIRTUAL_HEIGHT - vh / scale) / 2;
  } else {
    const maxY = VIRTUAL_HEIGHT - vh / scale;
    camY = Math.max(0, Math.min(maxY, camY));
  }
}

function zoomBy(factor: number): void {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  zoomAt(cx, cy, factor);
}

function zoomAt(screenX: number, screenY: number, factor: number): void {
  const scale = getDisplayScale();
  // World point under cursor before zoom
  const worldX = camX + screenX / scale;
  const worldY = camY + screenY / scale;

  camZoom = Math.max(minZoom, Math.min(maxZoom, camZoom * factor));

  // Adjust cam so the world point stays under the cursor
  const newScale = getDisplayScale();
  camX = worldX - screenX / newScale;
  camY = worldY - screenY / newScale;
  clampCamera();
}

function fitToScreen(): void {
  const vw = window.innerWidth || VIRTUAL_WIDTH;
  const vh = window.innerHeight || VIRTUAL_HEIGHT;
  camZoom = Math.min(vw / VIRTUAL_WIDTH, vh / VIRTUAL_HEIGHT) / Math.min(vw / VIRTUAL_WIDTH, vh / VIRTUAL_HEIGHT);
  // Actually just set zoom so world fits in viewport
  camZoom = Math.min(vw / VIRTUAL_WIDTH, vh / (VIRTUAL_HEIGHT * 0.8));
  camX = 0;
  camY = 0;
  clampCamera();
}

function resetView(): void {
  camZoom = 1;
  camX = 0;
  camY = 0;
  fitToScreen();
}

export function render(characters: Character[]): void {
  latestCharacters = characters;
  advanceEffects();

  const vw = canvas.width;
  const vh = canvas.height;
  const scale = getDisplayScale();

  // Clear full viewport
  ctx.fillStyle = "#58a838";
  ctx.fillRect(0, 0, vw, vh);

  // Apply camera transform
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  // Draw the world (crop top grass)
  ctx.save();
  ctx.translate(0, -TOP_GRASS_CROP_PX);
  drawScene(ctx, characters, screenAnimIndex, getSeatedBobOffset);
  drawOverlays(
    ctx,
    characters,
    VIRTUAL_WIDTH,
    getSeatedBobOffset,
    sweatAnimFrame,
  );
  ctx.restore();

  // Evening overlay in world space
  drawEveningOverlay(ctx, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  // Menu in world space (so it scales with zoom)
  drawMenu(ctx, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

  ctx.restore();
}

/**
 * Warm amber overlay for evening hours (18:00–22:00).
 */
function drawEveningOverlay(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const date = new Date();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const minuteOfDay = hour * 60 + minute;

  const FADE_IN_START  = EVENING_START_HOUR * 60;
  const FADE_IN_END    = EVENING_START_HOUR * 60 + 30;
  const FADE_OUT_START = (EVENING_END_HOUR - 1) * 60 + 30;
  const FADE_OUT_END   = EVENING_END_HOUR * 60;
  const MAX_ALPHA = 0.1;

  let alpha = 0;
  if (minuteOfDay >= FADE_IN_START && minuteOfDay < FADE_IN_END) {
    alpha =
      ((minuteOfDay - FADE_IN_START) / (FADE_IN_END - FADE_IN_START)) *
      MAX_ALPHA;
  } else if (minuteOfDay >= FADE_IN_END && minuteOfDay < FADE_OUT_START) {
    alpha = MAX_ALPHA;
  } else if (minuteOfDay >= FADE_OUT_START && minuteOfDay < FADE_OUT_END) {
    alpha =
      ((FADE_OUT_END - minuteOfDay) / (FADE_OUT_END - FADE_OUT_START)) *
      MAX_ALPHA;
  }

  if (alpha <= 0) return;
  c.save();
  c.globalAlpha = alpha;
  c.fillStyle = "#ff8c40";
  c.fillRect(0, 0, w, h);
  c.restore();
}

function advanceEffects(): void {
  screenAnimTimer++;
  if (screenAnimTimer >= 15) {
    screenAnimTimer = 0;
    screenAnimIndex = (screenAnimIndex + 1) % 3;
  }

  seatedBobTimer++;
  if (seatedBobTimer >= 6) {
    seatedBobTimer = 0;
    seatedBobFrame = (seatedBobFrame + 1) % 2;
  }

  sweatAnimTimer++;
  if (sweatAnimTimer >= 3) {
    sweatAnimTimer = 0;
    sweatAnimFrame = (sweatAnimFrame + 1) % 3;
  }
}

function getSeatedBobOffset(characterId: string): number {
  const phase = (characterId.length + characterId.charCodeAt(0)) % 2;
  return (seatedBobFrame + phase) % 2 === 0 ? 0 : -1;
}

function toCanvasPoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scale = getDisplayScale();
  return {
    x: camX + (clientX - rect.left) / scale,
    y: camY + (clientY - rect.top) / scale,
  };
}

function handleTap(clientX: number, clientY: number): void {
  const now = Date.now();
  if (now - lastTapAtMs < 180) return;
  lastTapAtMs = now;

  const point = toCanvasPoint(clientX, clientY);
  if (handleBubbleTap(point.x, point.y)) return;
  if (isMenuOpen()) {
    handleMenuTap(point.x, point.y);
    return;
  }

  const scenePoint = {
    x: point.x,
    y: point.y + TOP_GRASS_CROP_PX,
  };

  if (hitTestOfficeClock(scenePoint)) {
    postToRN({ type: "HAPTIC" });
    triggerOfficeClockRecall();
    return;
  }

  const propAction = resolvePropAction(scenePoint);
  if (propAction && !isOfficeActionDisabled(propAction.action)) {
    postToRN({ type: "HAPTIC" });
    postToRN(propAction);
    return;
  }

  const character =
    hitTestCharacter(scenePoint) ?? resolveDeskHitCharacter(scenePoint, latestCharacters);
  if (!character) return;
  if (isOfficeCharacterDisabled(character.id)) return;
  postToRN({ type: "HAPTIC" });
  openCharacterMenu(character.id, character);
}

function hitTestCharacter(point: { x: number; y: number }): Character | null {
  const hitPadding = 4;
  let picked: { character: Character; depth: number } | null = null;

  for (const character of latestCharacters) {
    if (!character.visible || !character.currentFrame) continue;
    const { dx, dy } = resolveDrawPosition(
      character,
      character.currentFrame,
      getSeatedBobOffset(character.id),
    );
    const left = dx - hitPadding;
    const top = dy - hitPadding;
    const right = dx + character.currentFrame.w + hitPadding;
    const bottom = dy + character.currentFrame.h + hitPadding;
    if (point.x < left || point.x > right || point.y < top || point.y > bottom)
      continue;
    if (!picked || bottom >= picked.depth)
      picked = { character, depth: bottom };
  }

  return picked?.character ?? null;
}

function hitTestOfficeClock(point: { x: number; y: number }): boolean {
  const item = furnitureList.find((f) => f.type === "office_clock");
  const frame =
    getFrameSafe("furniture", "office_clock") ??
    getFrameSafe("furniture", "coffee_machine");
  return hitTestFurnitureItem(point, item, frame);
}

function resolvePropAction(point: {
  x: number;
  y: number;
}): { type: "MENU_ACTION"; action: string; characterId: string; source: "prop" } | null {
  const mappings: Array<{ type: string; action: string }> = [
    { type: "filing_cabinet", action: "memory" },
    { type: "mailbox", action: "connections" },
    {
      type: "whiteboard",
      action: getGatewayState() === "none" ? "status" : "status",
    },
    { type: "bookshelf", action: "skills" },
    { type: "coffee_machine", action: "logs" },
    { type: "wall_calendar", action: "management" },
    { type: "toolbox", action: "tools" },
    { type: "signal_tower", action: "node_devices" },
    { type: "car", action: "add_gateway" },
  ];

  for (const mapping of mappings) {
    const items = furnitureList.filter((f) => f.type === mapping.type);
    const frame = getFrameSafe("furniture", mapping.type);
    if (items.some((item) => hitTestFurnitureItem(point, item, frame))) {
      return {
        type: "MENU_ACTION",
        action: mapping.action,
        characterId: "assistant",
        source: "prop",
      };
    }
  }
  return null;
}

function hitTestFurnitureItem(
  point: { x: number; y: number },
  item: (typeof furnitureList)[number] | undefined,
  frame: ReturnType<typeof getFrameSafe>,
): boolean {
  if (!item || !frame) return false;
  const base = tileToPixel(item.x, item.y);
  const dx = base.x + (item.offsetX ?? 0);
  const dy = base.y + (item.offsetY ?? 0);
  const hitPadding = 3;
  return (
    point.x >= dx - hitPadding &&
    point.x <= dx + frame.w + hitPadding &&
    point.y >= dy - hitPadding &&
    point.y <= dy + frame.h + hitPadding
  );
}