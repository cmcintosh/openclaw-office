// Office game bootstrap and main loop — standalone web app version

import { loadSpriteSheets } from './sprite-sheet';
import { postToRN } from './openclaw-bridge';
import { initRenderer, render } from './renderer';
import { updateCharacter, type Character } from './character';
import { initOpenClawBridge } from './openclaw-bridge';
import { initBubbleScheduler, updateBubbleScheduler } from './bubble-scheduler';
import { updateInteractions } from './character-interactions';

const TARGET_FPS = 15;
const FRAME_TIME = 1000 / TARGET_FPS;
const MAX_FRAME_DELTA_MS = 250;
const MAX_CATCH_UP_STEPS = 5;

let characters: Character[] = [];
let lastTime = 0;
let accumulator = 0;

function gameLoop(timestamp: number): void {
  requestAnimationFrame(gameLoop);

  const dt = Math.min(timestamp - lastTime, MAX_FRAME_DELTA_MS);
  lastTime = timestamp;
  accumulator += dt;

  if (accumulator < FRAME_TIME) return;

  const stepDt = FRAME_TIME / 1000;
  let steps = 0;
  while (accumulator >= FRAME_TIME && steps < MAX_CATCH_UP_STEPS) {
    for (const c of characters) {
      updateCharacter(c, stepDt);
    }
    updateBubbleScheduler(stepDt, characters);
    updateInteractions(characters, stepDt);
    accumulator -= FRAME_TIME;
    steps += 1;
  }

  if (steps === MAX_CATCH_UP_STEPS && accumulator >= FRAME_TIME) {
    accumulator = 0;
  }

  render(characters);
}

// Read gateway config from URL params, localStorage, or defaults
function getGatewayConfig(): { url: string; token: string } {
  // Check URL params first
  const params = new URLSearchParams(window.location.search);
  const url = params.get('gw') || localStorage.getItem('oc_gateway_url') || 'ws://127.0.0.1:18789';
  const token = params.get('token') || localStorage.getItem('oc_gateway_token') || '';
  return { url, token };
}

async function init(): Promise<void> {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  await loadSpriteSheets();
  initRenderer(canvas);

  const { url, token } = getGatewayConfig();

  // Show connection status
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    statusEl.textContent = `Connecting to ${url}...`;
  }

  characters = initOpenClawBridge(url, token, (updated) => { characters = updated; });

  for (const c of characters) {
    updateCharacter(c, 0);
  }
  initBubbleScheduler();

  // Update connection status display
  if (statusEl) {
    statusEl.textContent = `Gateway: ${url}`;
    setTimeout(() => {
      statusEl.style.opacity = '0';
    }, 5000);
  }

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

void init().catch((error) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error('Office init failed:', error);
  postToRN({ type: 'OFFICE_DEBUG', message: `init failed: ${message}` });
});