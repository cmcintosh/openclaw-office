import { t } from "./i18n";
import { getSheet, getFrame, type Frame } from "./sprite-sheet";
import { state } from "./menu-state";
import {
  computePanelPosition,
  getAchieveSectionRect,
  getAchievementStripRect,
  getBackButtonRect,
  getButtonRect,
  getCloseButtonRect,
  getNextBtnRect,
  getPanelFrame,
  getPrevBtnRect,
  getReportEntryRect,
  getSessionItemRect,
  getSettingsButtonRect,
  PANEL_W,
  PORTRAIT_SCALE,
  TITLE_H,
  TITLE_MARGIN_BOTTOM,
} from "./menu-layout";
import {
  formatRelativeTime,
  getActiveButtons,
  getCurrentListCount,
  getLatestSessionForCharacter,
  getSessionPageItems,
  getSettingsPageItems,
  getTotalPages,
  isConfigurableChannelCharacter,
  MENU_SPRITE_MAP,
  resolveMenuMeta,
  truncateText,
} from "./menu-model";

const COL = {
  panelBg: "#f0e8d0",
  panelBorder: "#1a1117",
  panelHighlight: "#c8b898",
  titleBarBg: "#a07840",
  titleText: "#ffffff",
  bodyText: "#1a1117",
  bodyTextMuted: "#6a5a48",
  btnNormal: "#3868b8",
  btnBorder: "#2a4e8a",
  btnPressed: "#2a4e8a",
  btnText: "#ffffff",
  closeBtnNormal: "#787878",
  closeBtnBorder: "#585858",
  closeBtnPressed: "#585858",
  statusWorking: "#48a848",
  statusIdle: "#b08820",
  statusAway: "#787878",
  shadow: "rgba(0,0,0,0.25)",
  sessionItemBg: "#e8dfc8",
  sessionItemBorder: "#c8b898",
  sessionItemPressed: "#d8d0b8",
};

export function drawMenu(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
): void {
  if (!state.open || !state.characterId) return;

  computePanelPosition(
    state,
    canvasW,
    canvasH,
    getActiveButtons().length,
    getCurrentListCount,
    getTotalPages,
  );

  if (state.view === "info") {
    drawInfoView(ctx);
  } else if (state.view === "sessions") {
    drawSessionsView(ctx);
  } else if (state.view === "report") {
    drawReportView(ctx);
  } else if (state.view === "achievement") {
    drawAchievementView(ctx);
  } else {
    drawSettingsView(ctx);
  }
}

function resolveStatus(): { text: string; color: string } {
  const character = state.character;
  if (!character) return { text: t("Unknown"), color: COL.statusAway };
  if (!character.visible) return { text: t("Away"), color: COL.statusAway };
  if (character.forceWork)
    return { text: t("Working"), color: COL.statusWorking };
  if (character.state === "walking")
    return { text: t("Slacking"), color: COL.statusIdle };
  return { text: t("Standby"), color: COL.statusIdle };
}

function getPortraitFrame(characterId: string): Frame | null {
  const spriteId = MENU_SPRITE_MAP[characterId];
  if (!spriteId) return null;
  try {
    return getFrame("characters", `${spriteId}_idle_0`);
  } catch {
    return null;
  }
}

function getSettingsIconFrame(): Frame | null {
  try {
    return getFrame("furniture", "icon_settings");
  } catch {
    return null;
  }
}

function getCloseIconFrame(): Frame | null {
  try {
    return getFrame("furniture", "icon_close");
  } catch {
    return null;
  }
}

function drawPanelFrame(
  ctx: CanvasRenderingContext2D,
  titleText: string,
  showBackArrow: boolean,
  showSettings: boolean,
): void {
  const { x: panelX, y: panelY, h: panelH } = getPanelFrame();

  ctx.fillStyle = COL.shadow;
  ctx.fillRect(panelX + 3, panelY + 3, PANEL_W, panelH);
  ctx.fillStyle = COL.panelBg;
  ctx.fillRect(panelX, panelY, PANEL_W, panelH);
  ctx.strokeStyle = COL.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, PANEL_W, panelH);
  ctx.strokeStyle = COL.panelHighlight;
  ctx.lineWidth = 1;
  ctx.strokeRect(panelX + 3, panelY + 3, PANEL_W - 6, panelH - 6);
  ctx.fillStyle = COL.titleBarBg;
  ctx.fillRect(panelX + 3, panelY + 3, PANEL_W - 6, TITLE_H);
  ctx.fillStyle = COL.panelBorder;
  ctx.fillRect(panelX + 3, panelY + 3 + TITLE_H, PANEL_W - 6, 1);

  if (showBackArrow) {
    const arrowX = panelX + 10;
    const arrowCY = panelY + 3 + TITLE_H / 2 + 1;
    ctx.save();
    ctx.fillStyle = COL.titleText;
    ctx.fillRect(arrowX, arrowCY, 5, 1);
    ctx.fillRect(arrowX, arrowCY - 1, 1, 1);
    ctx.fillRect(arrowX, arrowCY + 1, 1, 1);
    ctx.fillRect(arrowX - 1, arrowCY - 2, 1, 1);
    ctx.fillRect(arrowX - 1, arrowCY + 2, 1, 1);
    ctx.restore();
  }

  if (showSettings) {
    const r = getSettingsButtonRect();
    const pressed = state.pressedIndex === -3;
    ctx.fillStyle = pressed ? COL.btnPressed : COL.btnNormal;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.btnBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    const icon = getSettingsIconFrame();
    if (icon) {
      const sheet = getSheet("furniture");
      const dx = r.x + Math.round((r.w - icon.w) / 2);
      const dy = r.y + Math.round((r.h - icon.h) / 2);
      ctx.drawImage(
        sheet,
        icon.x,
        icon.y,
        icon.w,
        icon.h,
        dx,
        dy,
        icon.w,
        icon.h,
      );
    } else {
      const cx = r.x + Math.round(r.w / 2);
      const cy = r.y + Math.round(r.h / 2);
      ctx.fillStyle = COL.btnText;
      ctx.fillRect(cx - 1, cy - 1, 3, 3);
      ctx.fillRect(cx - 3, cy - 1, 1, 1);
      ctx.fillRect(cx + 3, cy - 1, 1, 1);
      ctx.fillRect(cx - 1, cy - 3, 1, 1);
      ctx.fillRect(cx - 1, cy + 3, 1, 1);
    }
  }

  {
    const r = getCloseButtonRect();
    const pressed = state.pressedIndex === -4;
    ctx.fillStyle = pressed ? COL.closeBtnPressed : COL.closeBtnNormal;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.closeBtnBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    const icon = getCloseIconFrame();
    if (icon) {
      const sheet = getSheet("furniture");
      const dx = r.x + Math.round((r.w - icon.w) / 2);
      const dy = r.y + Math.round((r.h - icon.h) / 2);
      ctx.drawImage(
        sheet,
        icon.x,
        icon.y,
        icon.w,
        icon.h,
        dx,
        dy,
        icon.w,
        icon.h,
      );
    } else {
      const cx = r.x + Math.round(r.w / 2);
      const cy = r.y + Math.round(r.h / 2);
      ctx.fillStyle = COL.btnText;
      ctx.fillRect(cx - 2, cy - 2, 1, 1);
      ctx.fillRect(cx + 2, cy - 2, 1, 1);
      ctx.fillRect(cx - 1, cy - 1, 1, 1);
      ctx.fillRect(cx + 1, cy - 1, 1, 1);
      ctx.fillRect(cx, cy, 1, 1);
      ctx.fillRect(cx - 1, cy + 1, 1, 1);
      ctx.fillRect(cx + 1, cy + 1, 1, 1);
      ctx.fillRect(cx - 2, cy + 2, 1, 1);
      ctx.fillRect(cx + 2, cy + 2, 1, 1);
    }
  }

  ctx.save();
  ctx.font = "bold 10px monospace";
  ctx.fillStyle = COL.titleText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rightOffset = showSettings ? 22 : 12;
  const leftOffset = showBackArrow ? 12 : 0;
  const titleCenterX = panelX + (leftOffset + PANEL_W - rightOffset) / 2;
  ctx.fillText(titleText, titleCenterX, panelY + 3 + TITLE_H / 2 + 1);
  ctx.restore();
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  r: { x: number; y: number; w: number; h: number },
  label: string,
  pressed: boolean,
  isClose = false,
): void {
  ctx.fillStyle = isClose
    ? pressed
      ? COL.closeBtnPressed
      : COL.closeBtnNormal
    : pressed
      ? COL.btnPressed
      : COL.btnNormal;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = isClose ? COL.closeBtnBorder : COL.btnBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  ctx.save();
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = COL.btnText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.restore();
}

function drawInfoView(ctx: CanvasRenderingContext2D): void {
  const characterId = state.characterId!;
  const meta = resolveMenuMeta(characterId);
  const status = resolveStatus();
  const latestSession = getLatestSessionForCharacter(characterId);
  const { x: panelX, y: panelY } = getPanelFrame();

  drawPanelFrame(
    ctx,
    meta.name,
    false,
    isConfigurableChannelCharacter(characterId),
  );

  const infoY = panelY + TITLE_H + TITLE_MARGIN_BOTTOM + 4;
  const portraitFrame = getPortraitFrame(characterId);
  if (portraitFrame) {
    const charSheet = getSheet("characters");
    const pw = portraitFrame.w * PORTRAIT_SCALE;
    const ph = portraitFrame.h * PORTRAIT_SCALE;
    const portraitX = panelX + 14;
    const portraitY = infoY + 2;

    ctx.fillStyle = COL.panelHighlight;
    ctx.fillRect(portraitX - 2, portraitY - 2, pw + 4, ph + 4);
    ctx.strokeStyle = COL.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(portraitX - 2, portraitY - 2, pw + 4, ph + 4);
    ctx.drawImage(
      charSheet,
      portraitFrame.x,
      portraitFrame.y,
      portraitFrame.w,
      portraitFrame.h,
      portraitX,
      portraitY,
      pw,
      ph,
    );
  }

  const textX = panelX + 70;
  const textMaxW = PANEL_W - 78;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = COL.bodyText;
  ctx.fillText(meta.role, textX, infoY + 4);
  ctx.font = "8px monospace";
  ctx.fillStyle = status.color;
  ctx.fillText(status.text, textX, infoY + 16);
  ctx.fillStyle = COL.bodyTextMuted;
  ctx.fillText(
    `${t("Active")}: ${formatRelativeTime(latestSession?.updatedAt)}`,
    textX,
    infoY + 28,
  );
  if (characterId !== "boss") {
    ctx.fillText(
      truncateText(ctx, latestSession?.model ?? "N/A", textMaxW),
      textX,
      infoY + 40,
    );
  }
  ctx.restore();

  // Achievement strips (one per earned achievement, stacked)
  for (let i = 0; i < state.achievements.length; i++) {
    drawAchievementStrip(ctx, i, state.achievements[i].name);
  }

  const buttons = getActiveButtons();
  for (let i = 0; i < buttons.length; i++) {
    drawButton(
      ctx,
      getButtonRect(i),
      buttons[i].label,
      state.pressedIndex === i,
    );
  }
}

function drawSessionsView(ctx: CanvasRenderingContext2D): void {
  const meta = resolveMenuMeta(state.characterId!);
  const { x: panelX } = getPanelFrame();
  drawPanelFrame(ctx, `${meta.name} ${t("Sessions")}`, true, false);

  if (state.sessionsList.length === 0) {
    const { y: panelY } = getPanelFrame();
    ctx.save();
    ctx.font = "10px monospace";
    ctx.fillStyle = COL.bodyTextMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      t("No sessions"),
      panelX + PANEL_W / 2,
      panelY + TITLE_H + TITLE_MARGIN_BOTTOM + 30,
    );
    ctx.restore();
    return;
  }

  const pageItems = getSessionPageItems();
  for (let i = 0; i < pageItems.length; i++) {
    const session = pageItems[i];
    const r = getSessionItemRect(i);
    ctx.fillStyle =
      state.pressedIndex === i ? COL.sessionItemPressed : COL.sessionItemBg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.sessionItemBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    const labelText =
      session.label || session.key.split(":").pop() || session.key;
    const timeText = formatRelativeTime(session.updatedAt);
    const timeWidth = 28;
    const labelMaxW = r.w - 12 - timeWidth;

    ctx.save();
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = COL.bodyText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(truncateText(ctx, labelText, labelMaxW), r.x + 4, r.y + 3);

    ctx.font = "8px monospace";
    ctx.fillStyle = COL.bodyTextMuted;
    const previewText = session.lastMessage
      ? session.lastMessage.replace(/\s+/g, " ").trim()
      : t("No message");
    ctx.fillText(truncateText(ctx, previewText, r.w - 8), r.x + 4, r.y + 15);

    ctx.textAlign = "right";
    ctx.fillText(timeText, r.x + r.w - 4, r.y + 3);
    ctx.restore();
  }

  drawPager(ctx, panelX);
}

function drawSettingsView(ctx: CanvasRenderingContext2D): void {
  const meta = resolveMenuMeta(state.characterId!);
  const { x: panelX } = getPanelFrame();
  drawPanelFrame(ctx, `${meta.name} ${t("Settings")}`, true, false);

  const pageItems = getSettingsPageItems();
  for (let i = 0; i < pageItems.length; i++) {
    const item = pageItems[i];
    const r = getSessionItemRect(i);
    ctx.fillStyle =
      state.pressedIndex === i ? COL.sessionItemPressed : COL.sessionItemBg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.sessionItemBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    ctx.save();
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = COL.bodyText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(truncateText(ctx, item.label, r.w - 8), r.x + 4, r.y + 3);
    ctx.font = "8px monospace";
    ctx.fillStyle = item.selectable ? COL.bodyTextMuted : COL.statusAway;
    ctx.fillText(truncateText(ctx, item.detail, r.w - 8), r.x + 4, r.y + 15);
    ctx.restore();
  }

  drawPager(ctx, panelX);
}

/** Word-wrap text into up to maxLines lines that fit within maxWidth. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
        if (lines.length >= maxLines) break;
      }
      current = word;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  // Truncate last line if it still overflows
  if (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (ctx.measureText(last).width > maxWidth) {
      lines[lines.length - 1] = truncateText(ctx, last, maxWidth);
    }
  }
  return lines.length > 0 ? lines : [truncateText(ctx, text, maxWidth)];
}

function drawReportView(ctx: CanvasRenderingContext2D): void {
  const meta = resolveMenuMeta(state.characterId!);
  drawPanelFrame(ctx, `${meta.name} ${t("KPI")}`, true, false);

  if (state.reportLines.length === 0) {
    const { x: px, y: panelY } = getPanelFrame();
    ctx.save();
    ctx.font = "10px monospace";
    ctx.fillStyle = COL.bodyTextMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      t("No data yet"),
      px + PANEL_W / 2,
      panelY + TITLE_H + TITLE_MARGIN_BOTTOM + 30,
    );
    ctx.restore();
    return;
  }

  for (let i = 0; i < state.reportLines.length; i++) {
    const entry = state.reportLines[i];
    const r = getReportEntryRect(i);

    // Entry background
    ctx.fillStyle = COL.sessionItemBg;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = COL.sessionItemBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);

    // Stat line (bold)
    ctx.save();
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = COL.bodyText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(truncateText(ctx, entry.stat, r.w - 8), r.x + 4, r.y + 3);

    // Comment lines (muted, word-wrapped up to 2 lines)
    ctx.font = "8px monospace";
    ctx.fillStyle = COL.bodyTextMuted;
    const commentText = `"${entry.comment}"`;
    const maxW = r.w - 8;
    const lines = wrapText(ctx, commentText, maxW, 2);
    for (let li = 0; li < lines.length; li++) {
      ctx.fillText(lines[li], r.x + 4, r.y + 16 + li * 10);
    }
    ctx.restore();
  }
}

/** Pixel-art medal icon: ribbon + disc + star highlight. Total size ~7×9. */
function drawMedalIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  // Ribbon
  ctx.fillStyle = "#e89030";
  ctx.fillRect(x + 2, y, 3, 3);
  ctx.fillStyle = "#f0a840";
  ctx.fillRect(x + 3, y, 1, 3);

  // Medal disc (7×6, roughly circular)
  ctx.fillStyle = "#e8a820";
  ctx.fillRect(x + 1, y + 3, 5, 1);
  ctx.fillRect(x, y + 4, 7, 3);
  ctx.fillRect(x + 1, y + 7, 5, 1);

  // Inner highlight
  ctx.fillStyle = "#f8d060";
  ctx.fillRect(x + 1, y + 4, 3, 2);

  // Star center pixels (bright white)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 3, y + 4, 1, 1);
  ctx.fillRect(x + 2, y + 5, 3, 1);
  ctx.fillRect(x + 3, y + 6, 1, 1);

  // Dark outline accents
  ctx.fillStyle = "#a07010";
  ctx.fillRect(x, y + 3, 1, 1);
  ctx.fillRect(x + 6, y + 3, 1, 1);
}

/** Tappable achievement strip shown at the bottom of the info panel. */
function drawAchievementStrip(
  ctx: CanvasRenderingContext2D,
  index: number,
  achievementName: string,
): void {
  const r = getAchievementStripRect(index);
  const pressed = state.pressedIndex === -5 - index;

  ctx.fillStyle = pressed ? COL.sessionItemPressed : "#e8d8a0";
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = "#c0a840";
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x, r.y, r.w, r.h);

  // Medal icon on the left
  const medalX = r.x + 3;
  const medalY = r.y + Math.round((r.h - 8) / 2);
  drawMedalIcon(ctx, medalX, medalY);

  // Achievement name text
  ctx.save();
  ctx.font = "bold 7px monospace";
  ctx.fillStyle = "#7a5800";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const textX = r.x + 14;
  const maxW = r.w - 22;
  ctx.fillText(
    truncateText(ctx, achievementName, maxW),
    textX,
    r.y + r.h / 2 + 1,
  );

  // Chevron ">" on the right
  const cx = r.x + r.w - 7;
  const cy = r.y + Math.round(r.h / 2);
  ctx.fillStyle = "#a07020";
  ctx.fillRect(cx, cy - 2, 1, 1);
  ctx.fillRect(cx + 1, cy - 1, 1, 1);
  ctx.fillRect(cx + 2, cy, 1, 1);
  ctx.fillRect(cx + 1, cy + 1, 1, 1);
  ctx.fillRect(cx, cy + 2, 1, 1);
  ctx.restore();
}

/** Achievement detail view: title + 3 section cards (name / condition / flavor). */
function drawAchievementView(ctx: CanvasRenderingContext2D): void {
  const achievement =
    state.achievements[state.selectedAchievementIndex] ?? null;
  const { x: panelX } = getPanelFrame();
  drawPanelFrame(ctx, t("Today's Badge"), true, false);

  if (!achievement) {
    const { y: panelY } = getPanelFrame();
    ctx.save();
    ctx.font = "10px monospace";
    ctx.fillStyle = COL.bodyTextMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      t("No data yet"),
      panelX + PANEL_W / 2,
      panelY + TITLE_H + TITLE_MARGIN_BOTTOM + 30,
    );
    ctx.restore();
    return;
  }

  // Card 0: achievement name (warm gold background)
  const nameR = getAchieveSectionRect(0);
  ctx.fillStyle = "#f0e4a0";
  ctx.fillRect(nameR.x, nameR.y, nameR.w, nameR.h);
  ctx.strokeStyle = "#c0a840";
  ctx.lineWidth = 1;
  ctx.strokeRect(nameR.x, nameR.y, nameR.w, nameR.h);

  // Medal icon inside name card
  drawMedalIcon(ctx, nameR.x + 4, nameR.y + Math.round((nameR.h - 8) / 2));

  ctx.save();
  ctx.font = "bold 9px monospace";
  ctx.fillStyle = "#7a5000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    truncateText(ctx, achievement.name, nameR.w - 20),
    nameR.x + nameR.w / 2 + 4,
    nameR.y + nameR.h / 2 + 1,
  );
  ctx.restore();

  // Card 1: condition text
  const condR = getAchieveSectionRect(1);
  ctx.fillStyle = COL.sessionItemBg;
  ctx.fillRect(condR.x, condR.y, condR.w, condR.h);
  ctx.strokeStyle = COL.sessionItemBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(condR.x, condR.y, condR.w, condR.h);

  ctx.save();
  ctx.font = "bold 7px monospace";
  ctx.fillStyle = COL.bodyTextMuted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(t("Earned by"), condR.x + 4, condR.y + 3);
  ctx.font = "8px monospace";
  ctx.fillStyle = COL.bodyTextMuted;
  const condLines = wrapText(ctx, achievement.conditionText, condR.w - 8, 2);
  for (let i = 0; i < condLines.length; i++) {
    ctx.fillText(condLines[i], condR.x + 4, condR.y + 14 + i * 10);
  }
  ctx.restore();

  // Card 2: flavor text
  const flavR = getAchieveSectionRect(2);
  ctx.fillStyle = COL.sessionItemBg;
  ctx.fillRect(flavR.x, flavR.y, flavR.w, flavR.h);
  ctx.strokeStyle = COL.sessionItemBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(flavR.x, flavR.y, flavR.w, flavR.h);

  ctx.save();
  ctx.font = "bold 7px monospace";
  ctx.fillStyle = COL.bodyTextMuted;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(t("Staff review"), flavR.x + 4, flavR.y + 3);
  ctx.font = "8px monospace";
  ctx.fillStyle = COL.bodyTextMuted;
  const flavLines = wrapText(ctx, achievement.flavorText, flavR.w - 8, 2);
  for (let i = 0; i < flavLines.length; i++) {
    ctx.fillText(flavLines[i], flavR.x + 4, flavR.y + 14 + i * 10);
  }
  ctx.restore();
}

function drawPager(ctx: CanvasRenderingContext2D, panelX: number): void {
  const totalPages = getTotalPages();
  if (totalPages <= 1) return;

  const hasPrev = state.currentPage > 0;
  const hasNext = state.currentPage < totalPages - 1;
  const prevR = getPrevBtnRect(getCurrentListCount);
  ctx.fillStyle = hasPrev ? COL.closeBtnNormal : COL.sessionItemBg;
  ctx.fillRect(prevR.x, prevR.y, prevR.w, prevR.h);
  ctx.strokeStyle = hasPrev ? COL.closeBtnBorder : COL.sessionItemBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(prevR.x, prevR.y, prevR.w, prevR.h);
  if (hasPrev) {
    const ax = prevR.x + 8;
    const ay = prevR.y + Math.round(prevR.h / 2);
    ctx.fillStyle = COL.btnText;
    ctx.fillRect(ax, ay, 5, 1);
    ctx.fillRect(ax, ay - 1, 1, 1);
    ctx.fillRect(ax, ay + 1, 1, 1);
    ctx.fillRect(ax - 1, ay - 2, 1, 1);
    ctx.fillRect(ax - 1, ay + 2, 1, 1);
  }

  const nextR = getNextBtnRect(getCurrentListCount);
  ctx.fillStyle = hasNext ? COL.closeBtnNormal : COL.sessionItemBg;
  ctx.fillRect(nextR.x, nextR.y, nextR.w, nextR.h);
  ctx.strokeStyle = hasNext ? COL.closeBtnBorder : COL.sessionItemBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(nextR.x, nextR.y, nextR.w, nextR.h);
  if (hasNext) {
    const ax = nextR.x + 8;
    const ay = nextR.y + Math.round(nextR.h / 2);
    ctx.fillStyle = COL.btnText;
    ctx.fillRect(ax, ay, 5, 1);
    ctx.fillRect(ax + 4, ay - 1, 1, 1);
    ctx.fillRect(ax + 4, ay + 1, 1, 1);
    ctx.fillRect(ax + 5, ay - 2, 1, 1);
    ctx.fillRect(ax + 5, ay + 2, 1, 1);
  }

  ctx.save();
  ctx.font = "bold 8px monospace";
  ctx.fillStyle = COL.bodyText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const pagerCenterY = prevR.y + Math.round(prevR.h / 2) + 1;
  ctx.fillText(
    `${state.currentPage + 1}/${totalPages}`,
    panelX + PANEL_W / 2,
    pagerCenterY,
  );
  ctx.restore();
}
