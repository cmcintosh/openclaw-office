// Compatibility shim: re-exports from openclaw-bridge.ts
// This keeps all existing imports (menu.ts, character-interactions.ts, etc.) working
// without modifying them. The original bridge.ts used React Native postMessage;
// openclaw-bridge.ts uses WebSocket to connect directly to OpenClaw Gateway.

// Constants needed by renderer.ts
export const EVENING_START_HOUR = 18;
export const EVENING_END_HOUR = 22;

export {
  initOpenClawBridge as initBridge,
  getLatestSessions,
  postToRN,
  getChannelForSlot,
  getChannelLabelForSlot,
  getOfficeChannelSlots,
  getUsageData,
  getChannelConnectionStatus,
  getMemoryFileCount,
  getPendingPairCount,
  getCronFailureCount,
  getGatewayState,
  getDailyReportData,
  getAgentName,
  isOfficeCharacterDisabled,
  isDeskLabelHidden,
  isOfficeActionDisabled,
  getBubbleContext,
  triggerOfficeClockRecall,
  isWsConnected,
  type SessionData,
} from './openclaw-bridge';

export type DailyReportData = {
  mainMessages: number;
  mainUserMessages: number;
  dmMessages: number;
  dmUserMessages: number;
  subagentMessages: number;
  cronMessages: number;
  channelMessages: Record<string, number>;
};