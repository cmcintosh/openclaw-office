// OpenClaw WebSocket Bridge
// Connects to OpenClaw Gateway via WebSocket and maps sessions to office characters.
// Replaces the React Native postMessage bridge with direct WS communication.

import {
  createAllCharacters,
  setCharacterActivity,
  setBossPresence,
  triggerCharacterRushToDesk,
  type Character,
} from "./character";
import type { BubbleContext } from "./bubbles";
import {
  DEFAULT_OFFICE_CHANNEL_SLOT_CONFIG,
  isOfficeChannelSlotId,
  normalizeOfficeChannelId,
  normalizeOfficeChannelSlotConfig,
  officeChannelLabel,
  type OfficeChannelId,
  type OfficeChannelSlotConfig,
  type OfficeChannelSlotId,
} from "./channel-config";
import { setLocale } from "./i18n";

export interface SessionData {
  key: string;
  kind?: string;
  channel?: string;
  active: boolean;
  label?: string;
  updatedAt?: number | null;
  lastMessage?: string;
  model?: string;
}

// --- OpenClaw Gateway connection ---

const GATEWAY_URL = (window as any).__OPENCLAW_GATEWAY_URL__ || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = (window as any).__OPENCLAW_GATEWAY_TOKEN__ || "";

let ws: WebSocket | null = null;
let wsConnected = false;
let wsReconnectTimer: number | null = null;
let msgId = 1;

// Pending RPC promises
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();

// --- State (mirrors the RN bridge) ---

let latestSessions: SessionData[] = [];
let mainTyping = false;
let usageTodayCost: number | null = null;
let usageTodayTokens: number | null = null;
let channelSlots: OfficeChannelSlotConfig = { ...DEFAULT_OFFICE_CHANNEL_SLOT_CONFIG };
let channelConnectionStatuses: Record<string, string> = {};
let memoryFileCount = 0;
let pendingPairCount = 0;
let cronFailureCount = 0;
let gatewayState: "configured" | "none" = "none";
let agentName: string | null = null;
let dailyReportData: any = null;

const disabledCharacterIds = new Set<string>();
const hiddenDeskLabelIds = new Set<string>();
const disabledPropActions = new Set<string>();

let characters: Character[] = [];
let onCharactersChanged: ((chars: Character[]) => void) | null = null;

// --- Timers ---
const MAIN_ACTIVE_WINDOW_MS = 5 * 60_000;
const SUBAGENT_RECENT_WINDOW_MS = 10 * 60_000;
const WORKER_RECENT_WINDOW_MS = 5 * 60_000;
const POLL_INTERVAL_MS = 10_000; // poll sessions every 10s
const EVENING_START_HOUR = 18;
const EVENING_END_HOUR = 22;

const CHANNEL_KEY_ALIASES: Record<OfficeChannelId, string[]> = {
  telegram: ["telegram"],
  discord: ["discord"],
  slack: ["slack"],
  feishu: ["feishu", "lark"],
  whatsapp: ["whatsapp"],
  googlechat: ["googlechat", "google-chat"],
  signal: ["signal"],
  imessage: ["imessage"],
  webchat: ["webchat"],
};

// --- WebSocket connection ---

function wsConnect(): void {
  if (ws) {
    try { ws.close(); } catch {}
  }

  const url = GATEWAY_TOKEN
    ? `${GATEWAY_URL}?token=${encodeURIComponent(GATEWAY_TOKEN)}`
    : GATEWAY_URL;

  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.error("[Office] WebSocket connect failed:", e);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    wsConnected = true;
    gatewayState = "configured";
    console.log("[Office] Connected to OpenClaw Gateway");
    // Initial data fetch
    rpc("sessions.list").then(handleSessionUpdate).catch(() => {});
    rpc("status").then(handleStatus).catch(() => {});
    rpc("agents.list").then(handleAgents).catch(() => {});
    rpc("channels.status").then(handleChannelsStatus).catch(() => {});
    rpc("sessions.usage").then(handleUsage).catch(() => {});
  };

  ws.onclose = (ev) => {
    wsConnected = false;
    gatewayState = "none";
    console.log(`[Office] WS disconnected: ${ev.code} ${ev.reason}`);
    if (ev.code === 1008) {
      // pairing required — don't auto-reconnect aggressively
      return;
    }
    scheduleReconnect();
  };

  ws.onerror = (e) => {
    console.error("[Office] WS error:", e);
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      handleWsMessage(msg);
    } catch (e) {
      // non-JSON message, ignore
    }
  };
}

function scheduleReconnect(): void {
  if (wsReconnectTimer) return;
  wsReconnectTimer = window.setTimeout(() => {
    wsReconnectTimer = null;
    wsConnect();
  }, 5000);
}

function handleWsMessage(msg: any): void {
  // RPC response
  if (msg.id && pending.has(msg.id)) {
    const p = pending.get(msg.id)!;
    pending.delete(msg.id);
    if (msg.error) p.reject(msg.error);
    else p.resolve(msg.result ?? msg.data);
    return;
  }

  // Push events from gateway
  if (msg.type === "sessions.update" || msg.type === "session.update") {
    handleSessionUpdate(msg.sessions ?? msg.data?.sessions ?? []);
  } else if (msg.type === "status") {
    handleStatus(msg.data ?? msg);
  } else if (msg.type === "channels.status") {
    handleChannelsStatus(msg.data ?? msg.statuses ?? {});
  } else if (msg.type === "usage.update" || msg.type === "sessions.usage") {
    handleUsage(msg.data ?? msg);
  } else if (msg.type === "chat.typing") {
    mainTyping = !!msg.isTyping;
    updateCharacterStates();
  }
}

function rpc(method: string, params?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error("WebSocket not connected"));
      return;
    }
    const id = msgId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params: params ?? {} }));
    // Timeout after 15s
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`RPC timeout: ${method}`));
      }
    }, 15000);
  });
}

// --- Data handlers ---

function handleSessionUpdate(sessions: any[]): void {
  latestSessions = (sessions || []).map((s: any) => ({
    key: s.key ?? s.sessionKey ?? "",
    kind: s.kind,
    channel: s.channel,
    active: s.active ?? false,
    label: s.label ?? s.name,
    updatedAt: s.updatedAt ?? s.lastActivity ?? null,
    lastMessage: s.lastMessage,
    model: s.model,
  }));
  updateCharacterStates();
}

function handleStatus(data: any): void {
  if (data.agentName) agentName = data.agentName;
  if (data.gatewayState) gatewayState = data.gatewayState;
  if (data.memoryFileCount != null) memoryFileCount = data.memoryFileCount;
  if (data.pendingPairCount != null) pendingPairCount = data.pendingPairCount;
  if (data.cronFailureCount != null) cronFailureCount = data.cronFailureCount;
}

function handleAgents(data: any): void {
  const agents = Array.isArray(data) ? data : data?.agents ?? [];
  if (agents.length > 0 && agents[0]?.name) {
    agentName = agents[0].name;
  }
}

function handleChannelsStatus(data: any): void {
  const statuses = data?.statuses ?? data ?? {};
  channelConnectionStatuses = {};
  for (const [key, val] of Object.entries(statuses)) {
    const normalized = normalizeOfficeChannelId(key);
    if (normalized) {
      const slotId = Object.keys(channelSlots).find(
        (s) => channelSlots[s as OfficeChannelSlotId] === normalized,
      );
      if (slotId) {
        channelConnectionStatuses[slotId] = (val as any)?.status ?? String(val);
      }
    }
  }
}

function handleUsage(data: any): void {
  usageTodayCost = data?.todayCost ?? data?.cost ?? null;
  usageTodayTokens = data?.todayTokens ?? data?.tokens ?? null;
}

// --- Character state mapping (same logic as RN bridge) ---

function updateCharacterStates(): void {
  const now = Date.now();
  if (characters.length === 0) return;

  const mainSession = latestSessions.find((s) => /^agent:[^:]+:main$/.test(s.key));
  const mainActive = mainTyping || (mainSession?.updatedAt ?? 0) > now - MAIN_ACTIVE_WINDOW_MS;

  const subActive = latestSessions.some((s) => {
    if (!(s.key.includes(":subagent:") || s.key.includes(":sub:"))) return false;
    const ageMs = s.updatedAt ? now - s.updatedAt : Infinity;
    if (ageMs < SUBAGENT_RECENT_WINDOW_MS) return true;
    if (s.active === true && !Number.isFinite(ageMs)) return true;
    return false;
  });

  const cronSessions = latestSessions.filter((s) => s.key.includes(":cron:"));
  const cronActive = cronSessions.some(
    (s) => s.updatedAt && now - s.updatedAt < WORKER_RECENT_WINDOW_MS,
  );

  const channelActive = (channelId: OfficeChannelId): boolean => {
    const channelSessions = latestSessions.filter((s) => {
      const normalized = normalizeOfficeChannelId(s.channel);
      if (normalized === channelId) return true;
      return CHANNEL_KEY_ALIASES[channelId].some((alias) => s.key.includes(`:${alias}:`));
    });
    return channelSessions.some(
      (s) => s.updatedAt && now - s.updatedAt < WORKER_RECENT_WINDOW_MS,
    );
  };

  const bossPresent = mainSession?.updatedAt
    ? now - mainSession.updatedAt < 300_000
    : false;

  const charById = new Map<string, Character>();
  for (const c of characters) charById.set(c.id, c);

  const boss = charById.get("boss");
  if (boss) setBossPresence(boss, bossPresent);

  const secretary = charById.get("assistant");
  if (secretary) setCharacterActivity(secretary, mainActive);

  const subagent = charById.get("subagent");
  if (subagent) setCharacterActivity(subagent, subActive);

  const cron = charById.get("cron");
  if (cron) setCharacterActivity(cron, cronActive);

  const ch1 = charById.get("channel1");
  if (ch1) setCharacterActivity(ch1, channelActive(channelSlots.channel1));
  const ch2 = charById.get("channel2");
  if (ch2) setCharacterActivity(ch2, channelActive(channelSlots.channel2));
  const ch3 = charById.get("channel3");
  if (ch3) setCharacterActivity(ch3, channelActive(channelSlots.channel3));
  const ch4 = charById.get("channel4");
  if (ch4) setCharacterActivity(ch4, channelActive(channelSlots.channel4));

  if (onCharactersChanged) onCharactersChanged(characters);
}

// --- Polling fallback (in case WS push events aren't available) ---

function startPolling(): void {
  setInterval(() => {
    if (wsConnected) {
      rpc("sessions.list").then(handleSessionUpdate).catch(() => {});
      rpc("sessions.usage").then(handleUsage).catch(() => {});
    }
  }, POLL_INTERVAL_MS);
}

// --- Public API (same interface as RN bridge) ---

export function initOpenClawBridge(
  gatewayUrl: string,
  gatewayToken: string,
  onUpdate: (chars: Character[]) => void,
): Character[] {
  (window as any).__OPENCLAW_GATEWAY_URL__ = gatewayUrl;
  (window as any).__OPENCLAW_GATEWAY_TOKEN__ = gatewayToken;

  characters = createAllCharacters();
  onCharactersChanged = onUpdate;

  // Apply channel config from localStorage if saved
  const savedSlots = localStorage.getItem("officeChannelSlots");
  if (savedSlots) {
    try {
      const parsed = JSON.parse(savedSlots);
      channelSlots = normalizeOfficeChannelSlotConfig(parsed);
    } catch {}
  }

  wsConnect();
  startPolling();

  return characters;
}

export function getLatestSessions(): SessionData[] {
  return latestSessions;
}

export function postToRN(_message: unknown): void {
  // No-op in standalone mode — menu actions are handled locally
  // Could be extended to send commands back to OpenClaw via WS
}

export function getChannelForSlot(slotId: OfficeChannelSlotId): OfficeChannelId {
  return channelSlots[slotId];
}

export function getChannelLabelForSlot(slotId: string): string {
  if (!isOfficeChannelSlotId(slotId)) return slotId;
  return officeChannelLabel(getChannelForSlot(slotId));
}

export function getOfficeChannelSlots(): OfficeChannelSlotConfig {
  return { ...channelSlots };
}

export function getUsageData(): { todayCost: number | null; todayTokens: number | null } {
  return { todayCost: usageTodayCost, todayTokens: usageTodayTokens };
}

export function getChannelConnectionStatus(slotId: string): string {
  return channelConnectionStatuses[slotId] || "none";
}

export function getMemoryFileCount(): number {
  return memoryFileCount;
}

export function getPendingPairCount(): number {
  return pendingPairCount;
}

export function getCronFailureCount(): number {
  return cronFailureCount;
}

export function getGatewayState(): "configured" | "none" {
  return gatewayState;
}

export function getDailyReportData(): any | null {
  return dailyReportData;
}

export function getAgentName(): string | null {
  return agentName;
}

export function isOfficeCharacterDisabled(characterId: string): boolean {
  return disabledCharacterIds.has(characterId);
}

export function isDeskLabelHidden(characterId: string): boolean {
  return hiddenDeskLabelIds.has(characterId);
}

export function isOfficeActionDisabled(action: string): boolean {
  return disabledPropActions.has(action);
}

export function getBubbleContext(): BubbleContext {
  const now = Date.now();
  const date = new Date();
  const hour = date.getHours();

  const subSessions = latestSessions.filter(
    (s) => s.key.includes(":subagent:") || s.key.includes(":sub:"),
  );
  const cronSessions = latestSessions.filter((s) => s.key.includes(":cron:"));
  const mainSession = latestSessions.find((s) => /^agent:[^:]+:main$/.test(s.key));

  return {
    isMainActive:
      mainTyping || (mainSession?.updatedAt ?? 0) > now - MAIN_ACTIVE_WINDOW_MS,
    subagentCount: subSessions.filter(
      (s) => s.updatedAt && now - s.updatedAt < SUBAGENT_RECENT_WINDOW_MS,
    ).length,
    cronSessionCount: cronSessions.filter(
      (s) => s.updatedAt && now - s.updatedAt < WORKER_RECENT_WINDOW_MS,
    ).length,
    cronFailureCount,
    activeJobId: cronSessions[0]?.key.split(":").pop(),
    isEarlyMorning: hour >= 7 && hour < 9,
    isLunch: hour >= 12 && hour < 13,
    isEvening: hour >= EVENING_START_HOUR && hour < EVENING_END_HOUR,
    isLateNight: hour >= 22 || hour < 5,
    currentTime: `${String(hour).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

export function triggerOfficeClockRecall(): void {
  for (const c of characters) {
    if (c.id === "boss") continue;
    triggerCharacterRushToDesk(c, 10_000);
  }
  if (onCharactersChanged) onCharactersChanged(characters);
}

export function isWsConnected(): boolean {
  return wsConnected;
}