// In-game pixel-style character menu (Kairosoft-inspired)
// Facade module: keeps public API stable while delegating state, model, and drawing.

import { postToRN } from './bridge';
import { isOfficeChannelSlotId } from './channel-config';
import { drawMenu as drawMenuView } from './menu-draw';
import {
  getActiveButtons,
  getCurrentListCount,
  getSessionPageItems,
  getSettingsPageItems,
  getTotalPages,
  buildSettingsOptions,
  isConfigurableChannelCharacter,
} from './menu-model';
import {
  getAchievementStripRect,
  getBackButtonRect,
  getButtonRect,
  getCloseButtonRect,
  getNextBtnRect,
  getPanelFrame,
  getPrevBtnRect,
  getSessionItemRect,
  getSettingsButtonRect,
} from './menu-layout';
import { closeMenu, goBackToInfo, openAchievementView, openCharacterMenu, openReportView, openSettingsView, state } from './menu-state';
import { generateReport } from './menu-report';
import type { Character } from './character';

export { openCharacterMenu, closeMenu };

export function isMenuOpen(): boolean {
  return state.open;
}

export function handleMenuTap(cx: number, cy: number): boolean {
  if (!state.open) return false;
  if (Date.now() - state.viewChangedAt < 300) return true;
  if (!hitTestPanel(cx, cy)) {
    closeMenu();
    return true;
  }

  if (state.view === 'info') return handleInfoTap(cx, cy);
  if (state.view === 'sessions') return handleSessionsTap(cx, cy);
  if (state.view === 'report') return handleReportTap(cx, cy);
  if (state.view === 'achievement') return handleAchievementTap(cx, cy);
  return handleSettingsTap(cx, cy);
}

export function handleMenuTouchStart(cx: number, cy: number): void {
  if (!state.open) return;

  if (hitTestCloseButton(cx, cy)) {
    state.pressedIndex = -4;
    return;
  }

  if (state.view === 'info') {
    if (hitTestSettingsButton(cx, cy)) {
      state.pressedIndex = -3;
      return;
    }
    const stripIdx = hitTestAchievementStrip(cx, cy);
    if (stripIdx >= 0) {
      state.pressedIndex = -5 - stripIdx;
      return;
    }
    state.pressedIndex = hitTestInfoButton(cx, cy);
    return;
  }

  if (hitTestBackButton(cx, cy)) {
    state.pressedIndex = -2;
    return;
  }
  if (state.view === 'report' || state.view === 'achievement') return;
  state.pressedIndex = hitTestSessionItem(cx, cy);
}

export function handleMenuTouchMove(_cx: number, _cy: number): void {
  // Pagination keeps interaction predictable; no drag scrolling.
}

export function handleMenuTouchEnd(): void {
  state.pressedIndex = -1;
}

export function drawMenu(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number): void {
  drawMenuView(ctx, canvasW, canvasH);
}

function hitTestPanel(cx: number, cy: number): boolean {
  const panel = getPanelFrame();
  return cx >= panel.x && cx <= panel.x + 180 && cy >= panel.y && cy <= panel.y + panel.h;
}

function hitTestInfoButton(cx: number, cy: number): number {
  const buttons = getActiveButtons();
  for (let i = 0; i < buttons.length; i++) {
    const r = getButtonRect(i);
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return -1;
}

function hitTestCloseButton(cx: number, cy: number): boolean {
  const r = getCloseButtonRect();
  return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
}

function hitTestSettingsButton(cx: number, cy: number): boolean {
  if (!state.characterId || !isConfigurableChannelCharacter(state.characterId) || state.view !== 'info') return false;
  const r = getSettingsButtonRect();
  return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
}

/** Returns the index of the tapped strip, or -1 if none. */
function hitTestAchievementStrip(cx: number, cy: number): number {
  for (let i = 0; i < state.achievements.length; i++) {
    const r = getAchievementStripRect(i);
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return -1;
}

function hitTestBackButton(cx: number, cy: number): boolean {
  const r = getBackButtonRect();
  return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
}

function hitTestSessionItem(cx: number, cy: number): number {
  const pageItems = state.view === 'settings' ? getSettingsPageItems() : getSessionPageItems();
  for (let i = 0; i < pageItems.length; i++) {
    const r = getSessionItemRect(i);
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return -1;
}

function hitTestPagerButton(cx: number, cy: number): 'prev' | 'next' | null {
  if (getTotalPages() <= 1) return null;
  const prev = getPrevBtnRect(getCurrentListCount);
  if (cx >= prev.x && cx <= prev.x + prev.w && cy >= prev.y && cy <= prev.y + prev.h) return 'prev';
  const next = getNextBtnRect(getCurrentListCount);
  if (cx >= next.x && cx <= next.x + next.w && cy >= next.y && cy <= next.y + next.h) return 'next';
  return null;
}

function handleInfoTap(cx: number, cy: number): boolean {
  if (hitTestCloseButton(cx, cy)) {
    closeMenu();
    return true;
  }
  if (hitTestSettingsButton(cx, cy) && state.characterId && isOfficeChannelSlotId(state.characterId)) {
    openSettingsView(buildSettingsOptions(state.characterId));
    return true;
  }
  const stripIdx = hitTestAchievementStrip(cx, cy);
  if (stripIdx >= 0 && stripIdx < state.achievements.length) {
    postToRN({ type: 'HAPTIC' });
    openAchievementView(stripIdx);
    return true;
  }

  const btnIdx = hitTestInfoButton(cx, cy);
  const buttons = getActiveButtons();
  if (btnIdx < 0 || btnIdx >= buttons.length) return true;

  const btn = buttons[btnIdx];
  postToRN({ type: 'HAPTIC' });
  if (btn.action === 'report' && state.characterId) {
    openReportView(generateReport(state.characterId));
  } else if (state.characterId) {
    postToRN({ type: 'MENU_ACTION', action: btn.action, characterId: state.characterId });
    closeMenu();
  }
  return true;
}

function handleSessionsTap(cx: number, cy: number): boolean {
  if (hitTestCloseButton(cx, cy)) {
    closeMenu();
    return true;
  }
  if (hitTestBackButton(cx, cy)) {
    goBackToInfo();
    return true;
  }
  const pagerHit = hitTestPagerButton(cx, cy);
  if (pagerHit === 'prev' && state.currentPage > 0) {
    state.currentPage--;
    state.pressedIndex = -1;
    return true;
  }
  if (pagerHit === 'next' && state.currentPage < getTotalPages() - 1) {
    state.currentPage++;
    state.pressedIndex = -1;
    return true;
  }

  const itemIdx = hitTestSessionItem(cx, cy);
  if (itemIdx >= 0 && state.characterId) {
    const session = getSessionPageItems()[itemIdx];
    if (session) {
      postToRN({ type: 'HAPTIC' });
      postToRN({
        type: 'MENU_ACTION',
        action: 'open_session',
        characterId: state.characterId,
        sessionKey: session.key,
      });
      closeMenu();
    }
  }
  return true;
}

function handleReportTap(cx: number, cy: number): boolean {
  if (hitTestCloseButton(cx, cy)) {
    closeMenu();
    return true;
  }
  if (hitTestBackButton(cx, cy)) {
    goBackToInfo();
    return true;
  }
  return true;
}

function handleAchievementTap(cx: number, cy: number): boolean {
  if (hitTestCloseButton(cx, cy)) {
    closeMenu();
    return true;
  }
  if (hitTestBackButton(cx, cy)) {
    goBackToInfo();
    return true;
  }
  return true;
}

function handleSettingsTap(cx: number, cy: number): boolean {
  if (hitTestCloseButton(cx, cy)) {
    closeMenu();
    return true;
  }
  if (hitTestBackButton(cx, cy)) {
    goBackToInfo();
    return true;
  }
  const pagerHit = hitTestPagerButton(cx, cy);
  if (pagerHit === 'prev' && state.currentPage > 0) {
    state.currentPage--;
    state.pressedIndex = -1;
    return true;
  }
  if (pagerHit === 'next' && state.currentPage < getTotalPages() - 1) {
    state.currentPage++;
    state.pressedIndex = -1;
    return true;
  }

  const itemIdx = hitTestSessionItem(cx, cy);
  const item = itemIdx >= 0 ? getSettingsPageItems()[itemIdx] : null;
  if (item && item.selectable && state.characterId) {
    postToRN({ type: 'HAPTIC' });
    postToRN({
      type: 'MENU_ACTION',
      action: 'set_channel',
      characterId: state.characterId,
      channelId: item.channelId,
    });
    closeMenu();
  }
  return true;
}

// Re-export type for callers that open menus directly from character taps.
export type { Character };
