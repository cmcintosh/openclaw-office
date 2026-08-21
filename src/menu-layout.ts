import type { MenuState } from './menu-types';

export const PANEL_W = 180;
export const TITLE_H = 18;
export const BTN_H = 16;
export const BTN_GAP = 4;
export const BTN_MARGIN_X = 10;
export const PORTRAIT_SCALE = 2;
export const INFO_AREA_H = 56;
export const INFO_BTN_GAP = 8;
export const TITLE_MARGIN_BOTTOM = 8;
export const PANEL_PADDING_BOTTOM = 8;
export const SESSION_ITEM_H = 28;
export const SESSION_ITEM_GAP = 3;
export const SESSION_SCROLL_MARGIN = 6;
export const SESSIONS_PER_PAGE = 5;
export const PAGER_H = 16;
export const PAGER_BTN_W = 20;
export const PAGER_MARGIN_TOP = 4;
export const REPORT_ENTRY_H = 42;
export const REPORT_ENTRY_GAP = 5;
export const REPORT_PADDING = 6;

// Achievement strips in info view (stacked tappable rows below character info)
export const ACHIEVEMENT_STRIP_H = 14;
export const ACHIEVEMENT_STRIP_GAP = 4;   // gap from info area to first strip
export const ACHIEVEMENT_STRIP_INNER_GAP = 4; // gap between adjacent strips (matches BTN_GAP)

// Achievement detail view layout
export const ACHIEVE_NAME_H = 24;
export const ACHIEVE_SECTION_H = 36;
export const ACHIEVE_SECTION_GAP = 4;
export const ACHIEVE_PADDING = 6;

let panelX = 0;
let panelY = 0;
let panelH = 0;
// Extra vertical space added in info view when an achievement strip is shown
let infoAchievementH = 0;

export function getPanelFrame(): { x: number; y: number; h: number } {
  return { x: panelX, y: panelY, h: panelH };
}

export function computePanelPosition(
  state: MenuState,
  canvasW: number,
  canvasH: number,
  infoButtonCount: number,
  getCurrentListCount: () => number,
  getTotalPages: () => number,
): void {
  if (state.view === 'info') {
    const n = state.achievements.length;
    infoAchievementH = n > 0
      ? ACHIEVEMENT_STRIP_GAP + n * ACHIEVEMENT_STRIP_H + (n - 1) * ACHIEVEMENT_STRIP_INNER_GAP
      : 0;
    panelH = computeInfoPanelH(infoButtonCount, infoAchievementH);
  } else if (state.view === 'report') {
    infoAchievementH = 0;
    panelH = computeReportPanelH(state.reportLines.length);
  } else if (state.view === 'achievement') {
    infoAchievementH = 0;
    panelH = computeAchievementPanelH();
  } else {
    infoAchievementH = 0;
    panelH = computeListPanelH(getCurrentListCount, getTotalPages);
  }
  panelX = Math.round((canvasW - PANEL_W) / 2);
  panelY = Math.round((canvasH - panelH) / 2);
}

export function getButtonRect(index: number): { x: number; y: number; w: number; h: number } {
  const btnW = PANEL_W - BTN_MARGIN_X * 2;
  const buttonsTop = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + INFO_AREA_H + infoAchievementH + INFO_BTN_GAP;
  const y = buttonsTop + index * (BTN_H + BTN_GAP);
  return { x: panelX + BTN_MARGIN_X, y, w: btnW, h: BTN_H };
}

/** Tappable achievement strip at the given index in the info view. */
export function getAchievementStripRect(index: number): { x: number; y: number; w: number; h: number } {
  const firstY = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + INFO_AREA_H + ACHIEVEMENT_STRIP_GAP;
  const y = firstY + index * (ACHIEVEMENT_STRIP_H + ACHIEVEMENT_STRIP_INNER_GAP);
  return { x: panelX + BTN_MARGIN_X, y, w: PANEL_W - BTN_MARGIN_X * 2, h: ACHIEVEMENT_STRIP_H };
}

/**
 * Section cards in the achievement detail view.
 * index 0 = name card, 1 = condition card, 2 = flavor card.
 */
export function getAchieveSectionRect(index: number): { x: number; y: number; w: number; h: number } {
  const contentTop = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + ACHIEVE_PADDING;
  const itemW = PANEL_W - BTN_MARGIN_X * 2;
  if (index === 0) {
    return { x: panelX + BTN_MARGIN_X, y: contentTop, w: itemW, h: ACHIEVE_NAME_H };
  }
  const y = contentTop + ACHIEVE_NAME_H + ACHIEVE_SECTION_GAP
    + (index - 1) * (ACHIEVE_SECTION_H + ACHIEVE_SECTION_GAP);
  return { x: panelX + BTN_MARGIN_X, y, w: itemW, h: ACHIEVE_SECTION_H };
}

export function getSessionItemRect(visibleIndex: number): { x: number; y: number; w: number; h: number } {
  const listTop = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + SESSION_SCROLL_MARGIN;
  const itemW = PANEL_W - BTN_MARGIN_X * 2;
  const y = listTop + visibleIndex * (SESSION_ITEM_H + SESSION_ITEM_GAP);
  return { x: panelX + BTN_MARGIN_X, y, w: itemW, h: SESSION_ITEM_H };
}

export function getBackButtonRect(): { x: number; y: number; w: number; h: number } {
  return { x: panelX + 5, y: panelY + 5, w: 16, h: TITLE_H - 4 };
}

export function getCloseButtonRect(): { x: number; y: number; w: number; h: number } {
  return { x: panelX + PANEL_W - 21, y: panelY + 5, w: 16, h: TITLE_H - 4 };
}

export function getSettingsButtonRect(): { x: number; y: number; w: number; h: number } {
  return { x: panelX + PANEL_W - 41, y: panelY + 5, w: 16, h: TITLE_H - 4 };
}

export function getPagerY(getCurrentListCount: () => number): number {
  const visibleCount = Math.min(getCurrentListCount(), SESSIONS_PER_PAGE);
  const listTop = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + SESSION_SCROLL_MARGIN;
  const listBottom = listTop + visibleCount * (SESSION_ITEM_H + SESSION_ITEM_GAP) - SESSION_ITEM_GAP;
  return listBottom + PAGER_MARGIN_TOP;
}

export function getPrevBtnRect(getCurrentListCount: () => number): { x: number; y: number; w: number; h: number } {
  const py = getPagerY(getCurrentListCount);
  return { x: panelX + BTN_MARGIN_X, y: py, w: PAGER_BTN_W, h: PAGER_H };
}

export function getNextBtnRect(getCurrentListCount: () => number): { x: number; y: number; w: number; h: number } {
  const py = getPagerY(getCurrentListCount);
  return { x: panelX + PANEL_W - BTN_MARGIN_X - PAGER_BTN_W, y: py, w: PAGER_BTN_W, h: PAGER_H };
}

export function getReportEntryRect(index: number): { x: number; y: number; w: number; h: number } {
  const top = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + REPORT_PADDING;
  const itemW = PANEL_W - BTN_MARGIN_X * 2;
  const y = top + index * (REPORT_ENTRY_H + REPORT_ENTRY_GAP);
  return { x: panelX + BTN_MARGIN_X, y, w: itemW, h: REPORT_ENTRY_H };
}

function computeReportPanelH(entryCount: number): number {
  const count = Math.max(entryCount, 1);
  const contentH = count * (REPORT_ENTRY_H + REPORT_ENTRY_GAP) - REPORT_ENTRY_GAP;
  return TITLE_H + TITLE_MARGIN_BOTTOM + REPORT_PADDING + contentH + REPORT_PADDING + PANEL_PADDING_BOTTOM;
}

function computeInfoPanelH(buttonCount: number, achievementH: number): number {
  return TITLE_H
    + TITLE_MARGIN_BOTTOM
    + INFO_AREA_H
    + achievementH
    + INFO_BTN_GAP
    + Math.max(buttonCount, 0) * (BTN_H + BTN_GAP)
    - BTN_GAP
    + PANEL_PADDING_BOTTOM;
}

function computeAchievementPanelH(): number {
  // name card + 2 section cards with gaps, plus padding top+bottom
  return TITLE_H + TITLE_MARGIN_BOTTOM + ACHIEVE_PADDING
    + ACHIEVE_NAME_H + ACHIEVE_SECTION_GAP
    + ACHIEVE_SECTION_H + ACHIEVE_SECTION_GAP
    + ACHIEVE_SECTION_H
    + ACHIEVE_PADDING + PANEL_PADDING_BOTTOM;
}

function computeListPanelH(getCurrentListCount: () => number, getTotalPages: () => number): number {
  const visibleCount = Math.min(getCurrentListCount(), SESSIONS_PER_PAGE);
  const listH = Math.max(visibleCount, 1) * (SESSION_ITEM_H + SESSION_ITEM_GAP) - SESSION_ITEM_GAP;
  const pagerArea = getTotalPages() > 1 ? PAGER_MARGIN_TOP + PAGER_H : 0;
  return TITLE_H + TITLE_MARGIN_BOTTOM + SESSION_SCROLL_MARGIN + listH + pagerArea + SESSION_SCROLL_MARGIN + PANEL_PADDING_BOTTOM;
}
