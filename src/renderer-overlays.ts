import type { Character } from './character';
import { furnitureList, tileToPixel } from './world';
import { getCronFailureCount, getGatewayState, getPendingPairCount, getUsageData } from './bridge';
import { clearBubbleBounds, getActiveBubble, setBubbleBounds } from './bubble-scheduler';
import { t } from './i18n';
import { resolveDrawPosition } from './renderer-shared';
import { getFrameSafe } from './renderer-shared';
import { drawInteractionOverlays } from './character-interactions';

export function drawOverlays(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  virtualWidth: number,
  seatedOffsetForCharacter: (characterId: string) => number,
  sweatAnimFrame: number,
): void {
  drawWhiteboardText(ctx);
  drawSignalTowerBadge(ctx);
  drawCalendarBadge(ctx);
  drawSweatDrops(ctx, characters, seatedOffsetForCharacter, sweatAnimFrame);
  drawStartleMarkers(ctx, characters, seatedOffsetForCharacter);
  drawInteractionOverlays(ctx, characters, seatedOffsetForCharacter);
  drawActiveBubble(ctx, characters, virtualWidth, seatedOffsetForCharacter);
}

function formatCostShort(cost: number): string {
  if (cost >= 100) return `$${Math.round(cost)}`;
  if (cost >= 10) return `$${cost.toFixed(1)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokensShort(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function drawWhiteboardLostInSpace(ctx: CanvasRenderingContext2D): void {
  const wb = furnitureList.find((f) => f.type === 'whiteboard');
  if (!wb) return;
  const base = tileToPixel(wb.x, wb.y);
  const bx = base.x + (wb.offsetX ?? 0);
  const by = base.y + (wb.offsetY ?? 0);
  const surfaceX = bx + 3;
  const surfaceY = by + 2;
  const surfaceW = wb.tileWidth * 16 - 6;
  const surfaceH = 28;
  const cx = surfaceX + surfaceW / 2 - 1;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#505050';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(t('lost in'), cx, surfaceY + surfaceH * 0.30 - 2);

  const row2Y = surfaceY + surfaceH * 0.72 - 2;
  const textW = ctx.measureText(t('space')).width;
  const ufoW = 11;
  const gap = 3;
  const totalW = textW + gap + ufoW;
  const startX = cx - totalW / 2;
  ctx.fillText(t('space'), startX + textW / 2, row2Y);

  const ux = Math.round(startX + textW + gap) + 2;
  const uy = Math.round(row2Y - 4) + 2;
  ctx.fillStyle = '#50b848';
  ctx.fillRect(ux + 3, uy, 5, 1);
  ctx.fillStyle = '#68d860';
  ctx.fillRect(ux + 4, uy - 1, 3, 1);
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(ux, uy + 1, 11, 1);
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(ux + 1, uy + 2, 9, 1);
  ctx.fillStyle = '#888888';
  ctx.fillRect(ux + 2, uy + 3, 7, 1);
  ctx.fillStyle = '#ff4040';
  ctx.fillRect(ux + 3, uy + 4, 1, 1);
  ctx.fillStyle = '#ffff40';
  ctx.fillRect(ux + 5, uy + 4, 1, 1);
  ctx.fillStyle = '#4040ff';
  ctx.fillRect(ux + 7, uy + 4, 1, 1);
  ctx.restore();
}

function drawWhiteboardUsage(ctx: CanvasRenderingContext2D): void {
  const wb = furnitureList.find((f) => f.type === 'whiteboard');
  if (!wb) return;

  const { todayCost, todayTokens } = getUsageData();
  const base = tileToPixel(wb.x, wb.y);
  const bx = base.x + (wb.offsetX ?? 0);
  const by = base.y + (wb.offsetY ?? 0);
  const surfaceX = bx + 3;
  const surfaceY = by + 2;
  const surfaceH = 28;
  const surfaceW = 70;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (todayCost === null && todayTokens === null) {
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#888888';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('connecting...'), surfaceX + surfaceW / 2, surfaceY + surfaceH / 2);
    ctx.restore();
    return;
  }

  const calW = 10;
  const calH = 10;
  const calX = surfaceX + 2;
  const calY = surfaceY + Math.round((surfaceH - calH) / 2);
  ctx.fillStyle = '#d04040';
  ctx.fillRect(calX, calY, calW, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(calX + 3, calY, 1, 1);
  ctx.fillRect(calX + 6, calY, 1, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(calX, calY + 3, calW, calH - 3);
  ctx.strokeStyle = '#484848';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(calX + 0.25, calY + 0.25, calW - 0.5, calH - 0.5);
  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = '#303030';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(new Date().getDate()), calX + calW / 2, calY + 3 + (calH - 3) / 2);

  const contentLeft = surfaceX + 15;
  const contentStartY = surfaceY + (surfaceH - 22) / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = 'bold 6px monospace';
  ctx.fillStyle = '#505050';
  ctx.fillText('cost:', contentLeft, contentStartY + 5.5);
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#d04040';
  ctx.fillText(formatCostShort(todayCost ?? 0), contentLeft + 20, contentStartY + 5.5);
  ctx.font = 'bold 6px monospace';
  ctx.fillStyle = '#505050';
  ctx.fillText('token:', contentLeft, contentStartY + 16.5);
  ctx.font = 'bold 8px monospace';
  ctx.fillStyle = '#3868b8';
  ctx.fillText(formatTokensShort(todayTokens ?? 0), contentLeft + 24, contentStartY + 16.5);
  ctx.restore();
}

function drawWhiteboardText(ctx: CanvasRenderingContext2D): void {
  if (getGatewayState() === 'none') {
    drawWhiteboardLostInSpace(ctx);
  } else {
    drawWhiteboardUsage(ctx);
  }
}

function drawSignalTowerBadge(ctx: CanvasRenderingContext2D): void {
  drawBadge(ctx, 'signal_tower', getPendingPairCount(), 10, -2);
}

function drawCalendarBadge(ctx: CanvasRenderingContext2D): void {
  drawBadge(ctx, 'wall_calendar', getCronFailureCount(), 2, -2);
}

function drawBadge(ctx: CanvasRenderingContext2D, furnitureType: string, count: number, rightInset: number, topInset: number): void {
  if (count <= 0) return;
  const item = furnitureList.find((f) => f.type === furnitureType);
  const frame = item ? getFrameSafe('furniture', furnitureType) : null;
  if (!item || !frame) return;
  const base = tileToPixel(item.x, item.y);
  const dx = base.x + (item.offsetX ?? 0);
  const dy = base.y + (item.offsetY ?? 0);
  const text = count > 9 ? '9+' : String(count);
  const badgeW = text.length > 1 ? 10 : 7;
  const badgeH = 7;
  const badgeX = dx + frame.w - rightInset;
  const badgeY = dy + topInset;

  ctx.save();
  ctx.fillStyle = '#d04040';
  ctx.beginPath();
  ctx.roundRect(badgeX - 1, badgeY - 1, badgeW + 2, badgeH + 2, 3);
  ctx.fill();
  ctx.font = 'bold 6px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX + badgeW / 2, badgeY + badgeH / 2);
  ctx.restore();
}

function drawSweatDrops(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  seatedOffsetForCharacter: (characterId: string) => number,
  sweatAnimFrame: number,
): void {
  for (const c of characters) {
    if (!c.visible || !c.forceWork || c.state !== 'working' || !c.currentFrame || c.id === 'boss') continue;
    const { dx, dy } = resolveDrawPosition(c, c.currentFrame, seatedOffsetForCharacter(c.id));
    const headRight = dx + c.currentFrame.w - 2;
    const headTop = dy + 1;

    ctx.save();
    const dropColor = '#78c8f0';
    const dropShadow = '#4898c0';
    if (sweatAnimFrame === 0) {
      ctx.fillStyle = dropColor;
      ctx.fillRect(headRight, headTop, 1, 1);
      ctx.fillRect(headRight, headTop + 1, 1, 1);
      ctx.fillStyle = dropShadow;
      ctx.fillRect(headRight, headTop + 2, 1, 1);
    } else if (sweatAnimFrame === 1) {
      ctx.fillStyle = dropColor;
      ctx.fillRect(headRight, headTop, 1, 1);
      ctx.fillRect(headRight + 1, headTop + 2, 1, 1);
      ctx.fillRect(headRight + 1, headTop + 3, 1, 1);
      ctx.fillStyle = dropShadow;
      ctx.fillRect(headRight + 1, headTop + 4, 1, 1);
    } else {
      ctx.fillStyle = dropColor;
      ctx.fillRect(headRight, headTop + 1, 1, 1);
      ctx.fillRect(headRight, headTop + 2, 1, 1);
      ctx.fillStyle = dropShadow;
      ctx.fillRect(headRight + 1, headTop + 5, 1, 1);
    }
    ctx.restore();
  }
}

function drawStartleMarkers(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  seatedOffsetForCharacter: (characterId: string) => number,
): void {
  const now = Date.now();
  for (const c of characters) {
    if (!c.visible || c.startledUntilMs <= now || !c.currentFrame) continue;
    const { dx, dy } = resolveDrawPosition(c, c.currentFrame, seatedOffsetForCharacter(c.id));
    const cx = Math.round(dx + c.currentFrame.w / 2);
    const topY = dy - 8;
    ctx.save();
    ctx.fillStyle = '#fff7c2';
    ctx.fillRect(cx - 1, topY, 2, 5);
    ctx.fillRect(cx - 1, topY + 6, 2, 2);
    ctx.fillStyle = '#6a3f00';
    ctx.fillRect(cx - 2, topY - 1, 4, 1);
    ctx.fillRect(cx - 2, topY + 8, 4, 1);
    ctx.restore();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  ctx.font = '8px monospace';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawActiveBubble(
  ctx: CanvasRenderingContext2D,
  characters: Character[],
  virtualWidth: number,
  seatedOffsetForCharacter: (characterId: string) => number,
): void {
  const bubble = getActiveBubble();
  if (!bubble) {
    clearBubbleBounds();
    return;
  }
  const character = characters.find((c) => c.id === bubble.characterId);
  if (!character || !character.visible || !character.currentFrame) {
    clearBubbleBounds();
    return;
  }

  const { dx, dy } = resolveDrawPosition(character, character.currentFrame, seatedOffsetForCharacter(character.id));
  const tipX = Math.round(dx + character.currentFrame.w / 2);
  const tipY = dy;
  const maxBubbleW = 140;
  const padH = 5;
  const padVTop = 3;
  const padVBottom = 5;
  const lineH = 10;
  const triH = 5;
  const triHalfW = 4;

  ctx.save();
  ctx.font = '8px monospace';
  const lines = wrapText(ctx, bubble.text, maxBubbleW - padH * 2);
  const textW = lines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
  const bw = Math.ceil(textW) + padH * 2;
  const bh = lines.length * lineH + padVTop + padVBottom;
  const bx = Math.max(1, Math.min(Math.round(tipX - bw / 2), virtualWidth - bw - 1));
  const by = tipY - triH - bh;

  ctx.fillStyle = '#fffde7';
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tipX - triHalfW, by + bh);
  ctx.lineTo(tipX + triHalfW, by + bh);
  ctx.lineTo(tipX, by + bh + triH);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tipX - triHalfW, by + bh);
  ctx.lineTo(tipX, by + bh + triH);
  ctx.lineTo(tipX + triHalfW, by + bh);
  ctx.stroke();
  ctx.fillStyle = '#2a2a2a';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], bx + padH, by + padVTop + i * lineH);
  }
  ctx.restore();
  setBubbleBounds(bx, by, bw, bh + triH);
}
