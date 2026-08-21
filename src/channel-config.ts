export type OfficeChannelSlotId = 'channel1' | 'channel2' | 'channel3' | 'channel4';

export type OfficeChannelId =
  | 'telegram'
  | 'discord'
  | 'slack'
  | 'feishu'
  | 'whatsapp'
  | 'googlechat'
  | 'signal'
  | 'imessage'
  | 'webchat';

export type OfficeChannelSlotConfig = Record<OfficeChannelSlotId, OfficeChannelId>;

export const OFFICE_CHANNEL_SLOT_IDS: OfficeChannelSlotId[] = ['channel1', 'channel2', 'channel3', 'channel4'];

export const DEFAULT_OFFICE_CHANNEL_SLOT_CONFIG: OfficeChannelSlotConfig = {
  channel1: 'telegram',
  channel2: 'discord',
  channel3: 'slack',
  channel4: 'feishu',
};

export const OFFICE_CHANNEL_CATALOG: OfficeChannelId[] = [
  'telegram',
  'discord',
  'slack',
  'feishu',
  'whatsapp',
  'googlechat',
  'signal',
  'imessage',
  'webchat',
];

const CHANNEL_LABELS: Record<OfficeChannelId, string> = {
  telegram: 'Telegram',
  discord: 'Discord',
  slack: 'Slack',
  feishu: 'Feishu',
  whatsapp: 'WhatsApp',
  googlechat: 'Google Chat',
  signal: 'Signal',
  imessage: 'iMessage',
  webchat: 'Web Chat',
};

const CHANNEL_ID_SET = new Set<OfficeChannelId>(OFFICE_CHANNEL_CATALOG);
const SLOT_ID_SET = new Set<OfficeChannelSlotId>(OFFICE_CHANNEL_SLOT_IDS);

export function isOfficeChannelSlotId(value: string): value is OfficeChannelSlotId {
  return SLOT_ID_SET.has(value as OfficeChannelSlotId);
}

export function normalizeOfficeChannelId(value?: string | null): OfficeChannelId | null {
  const raw = value?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === 'lark') return 'feishu';
  if (raw === 'google-chat' || raw === 'google_chat' || raw === 'gchat') return 'googlechat';
  if (CHANNEL_ID_SET.has(raw as OfficeChannelId)) return raw as OfficeChannelId;
  return null;
}

export function normalizeOfficeChannelSlotConfig(value: unknown): OfficeChannelSlotConfig {
  const normalized: OfficeChannelSlotConfig = { ...DEFAULT_OFFICE_CHANNEL_SLOT_CONFIG };
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const slotId of OFFICE_CHANNEL_SLOT_IDS) {
      const resolved = normalizeOfficeChannelId(typeof record[slotId] === 'string' ? (record[slotId] as string) : undefined);
      if (resolved) normalized[slotId] = resolved;
    }
  }

  const used = new Set<OfficeChannelId>();
  for (const slotId of OFFICE_CHANNEL_SLOT_IDS) {
    const candidate = normalized[slotId];
    if (!used.has(candidate)) {
      used.add(candidate);
      continue;
    }
    const fallback = OFFICE_CHANNEL_CATALOG.find((id) => !used.has(id));
    if (fallback) {
      normalized[slotId] = fallback;
      used.add(fallback);
    }
  }
  return normalized;
}

export function officeChannelLabel(channelId: OfficeChannelId): string {
  return CHANNEL_LABELS[channelId] ?? channelId;
}
