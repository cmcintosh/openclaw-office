import {
  getAgentName,
  getChannelForSlot,
  getChannelLabelForSlot,
  getLatestSessions,
  getOfficeChannelSlots,
  type SessionData,
} from './bridge';
import { isOfficeChannelSlotId, normalizeOfficeChannelId, OFFICE_CHANNEL_CATALOG, officeChannelLabel } from './channel-config';
import { t } from './i18n';
import { state } from './menu-state';
import type { ChannelOption, MenuButton } from './menu-types';

const MENU_META: Record<string, { name: string; role: string }> = {
  boss: { name: 'Boss', role: 'You' },
  assistant: { name: 'Main Agent', role: '' },
  subagent: { name: 'Sub-Agent', role: 'Task Worker' },
  cron: { name: 'Cron', role: 'Scheduler' },
  channel1: { name: 'Operator 1', role: 'Channel Worker' },
  channel2: { name: 'Operator 2', role: 'Channel Worker' },
  channel3: { name: 'Operator 3', role: 'Channel Worker' },
  channel4: { name: 'Operator 4', role: 'Channel Worker' },
};

export const MENU_SPRITE_MAP: Record<string, string> = {
  boss: 'boss',
  assistant: 'assistant',
  subagent: 'worker_4',
  cron: 'worker_3',
  channel1: 'worker_1',
  channel2: 'worker_2',
  channel3: 'worker_5',
  channel4: 'worker_6',
};

const CHANNEL_KEY_ALIASES: Record<string, string[]> = {
  telegram: ['telegram'],
  discord: ['discord'],
  slack: ['slack'],
  feishu: ['feishu', 'lark'],
  whatsapp: ['whatsapp'],
  googlechat: ['googlechat', 'google-chat', 'google_chat', 'gchat'],
  signal: ['signal'],
  imessage: ['imessage', 'i_message'],
  webchat: ['webchat', 'web_chat'],
};

export function isConfigurableChannelCharacter(characterId: string): boolean {
  return isOfficeChannelSlotId(characterId);
}

export function resolveMenuMeta(characterId: string): { name: string; role: string } {
  if (isConfigurableChannelCharacter(characterId)) {
    return {
      name: t(MENU_META[characterId]?.name ?? characterId),
      role: t(getChannelLabelForSlot(characterId)),
    };
  }
  const meta = MENU_META[characterId];
  if (!meta) return { name: t(characterId), role: '???' };
  // For the assistant, show the actual agent name as role instead of a static label
  if (characterId === 'assistant') {
    const dynName = getAgentName();
    return { name: t(meta.name), role: dynName || t('Secretary') };
  }
  return { name: t(meta.name), role: t(meta.role) };
}

export function getActiveButtons(): MenuButton[] {
  if (!state.characterId) return [];

  switch (state.characterId) {
    case 'boss':
      return [
        { label: t('Usage'), action: 'status' },
        { label: t('Manage'), action: 'console' },
        { label: t('Daily KPI'), action: 'report' },
      ];
    case 'assistant':
      return [
        { label: t('Chat'), action: 'chat' },
        { label: t('Memory'), action: 'memory' },
        { label: t('Daily KPI'), action: 'report' },
      ];
    case 'cron':
      return [
        { label: t('Sessions'), action: 'sessions' },
        { label: t('Management'), action: 'management' },
        { label: t('New Job'), action: 'new_cron' },
        { label: t('Daily KPI'), action: 'report' },
      ];
    case 'channel1':
    case 'channel2':
    case 'channel3':
    case 'channel4':
      return [
        { label: t('Sessions'), action: 'sessions' },
        { label: t('Daily KPI'), action: 'report' },
      ];
    case 'subagent':
    default:
      return [
        { label: t('Sessions'), action: 'sessions' },
        { label: t('Daily KPI'), action: 'report' },
      ];
  }
}

export function getCurrentListCount(): number {
  if (state.view === 'sessions') return state.sessionsList.length;
  if (state.view === 'settings') return state.settingsList.length;
  return 0;
}

export function getTotalPages(): number {
  return Math.max(1, Math.ceil(getCurrentListCount() / 5));
}

export function getSessionPageItems(): SessionData[] {
  const start = state.currentPage * 5;
  return state.sessionsList.slice(start, start + 5);
}

export function getSettingsPageItems(): ChannelOption[] {
  const start = state.currentPage * 5;
  return state.settingsList.slice(start, start + 5);
}

export function getSessionsForRole(characterId: string): SessionData[] {
  const sessions = getLatestSessions();
  let filtered: SessionData[];

  switch (characterId) {
    case 'subagent':
      filtered = sessions.filter((s) => s.key.includes(':subagent:') || s.key.includes(':sub:'));
      break;
    case 'cron':
      filtered = sessions.filter((s) => s.key.includes(':cron:'));
      break;
    case 'channel1':
    case 'channel2':
    case 'channel3':
    case 'channel4': {
      const targetChannel = getChannelForSlot(characterId);
      const aliases = CHANNEL_KEY_ALIASES[targetChannel] ?? [targetChannel];
      filtered = sessions.filter((s) => {
        const normalized = normalizeOfficeChannelId(s.channel);
        if (normalized === targetChannel) return true;
        return aliases.some((alias) => s.key.includes(`:${alias}:`));
      });
      break;
    }
    default:
      filtered = [];
  }

  return filtered.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function getLatestSessionForCharacter(characterId: string): SessionData | null {
  const sessions = getLatestSessions();
  let relevant: SessionData[];
  switch (characterId) {
    case 'boss':
      relevant = sessions.filter((s) => /^agent:[^:]+:main$/.test(s.key));
      break;
    case 'assistant':
      // Include main session + all DM sessions (dmScope may route DMs to separate sessions)
      relevant = sessions
        .filter((s) => /^agent:[^:]+:main$/.test(s.key) || s.kind === 'direct')
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      break;
    default:
      relevant = getSessionsForRole(characterId);
      break;
  }
  return relevant.length > 0 ? relevant[0] : null;
}

export function buildSettingsOptions(characterId: string): ChannelOption[] {
  if (!isOfficeChannelSlotId(characterId)) return [];

  const slots = getOfficeChannelSlots();
  const current = slots[characterId];
  const usedByOthers = new Set<string>();
  for (const [slotId, channelId] of Object.entries(slots)) {
    if (slotId !== characterId) usedByOthers.add(channelId);
  }

  return OFFICE_CHANNEL_CATALOG.map((channelId) => {
    const isCurrent = channelId === current;
    const occupied = usedByOthers.has(channelId);
    return {
      channelId,
      label: officeChannelLabel(channelId),
      detail: isCurrent ? t('Current channel') : (occupied ? t('Used by another desk') : t('Tap to switch')),
      selectable: isCurrent || !occupied,
    };
  });
}

export function formatRelativeTime(updatedAt?: number | null): string {
  if (!updatedAt) return t('N/A');
  const diff = Date.now() - updatedAt;
  if (diff < 5_000) return t('Now');
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const suffix = '..';
  const suffixW = ctx.measureText(suffix).width;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated).width + suffixW > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + suffix;
}
