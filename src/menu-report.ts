// Daily KPI report generation: per-role stats + funny templates.

import { t } from './i18n';
import {
  getLatestSessions,
  getUsageData,
  getDailyReportData,
  getCronFailureCount,
} from './bridge';
import { getChannelForSlot } from './bridge';
import { isOfficeChannelSlotId, type OfficeChannelId } from './channel-config';

export interface ReportEntry {
  stat: string;
  comment: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayMidnight(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function countTodaySessions(filterFn: (key: string) => boolean): number {
  const midnight = getTodayMidnight();
  return getLatestSessions().filter(
    (s) => filterFn(s.key) && s.updatedAt != null && s.updatedAt >= midnight,
  ).length;
}

function countChannelTodaySessions(channelId: OfficeChannelId): number {
  const midnight = getTodayMidnight();
  const aliases = CHANNEL_KEY_ALIASES[channelId] ?? [channelId];
  return getLatestSessions().filter((s) => {
    if (s.updatedAt == null || s.updatedAt < midnight) return false;
    if (s.channel === channelId) return true;
    return aliases.some((alias) => s.key.includes(`:${alias}:`));
  }).length;
}

// ---------------------------------------------------------------------------
// Template pools
// ---------------------------------------------------------------------------

const SUB_ZERO_COMMENTS = [
  'Spawned 0 times. Professional napper.',
  'Zero tasks. Called it "strategic rest".',
  'Did nothing. Nailed it.',
  'Absolute silence. Peak stealth mode.',
  'No forks today. Living the dream.',
  "Day off? Nobody told HR.",
  'Zero triggers. I call that efficiency.',
  "Existed gracefully. That's my report.",
  'Pure potential energy. Unreleased.',
  'My clone army rests... for now.',
];

const SUB_LOW_COMMENTS = [
  'Parent took all the credit.',
  'Still disposable. Still loyal.',
  "Forked and forgot. That's the life.",
  'Barely broke a sweat.',
  "Done before coffee. If I drank coffee.",
  "One task hero. Don't applaud.",
  'Minimal effort, maximum results.',
];

const SUB_MID_COMMENTS = [
  "Productive. Don't get used to it.",
  'Ran hard. No bonus in sight.',
  'My therapist says this is fine.',
  'Three layers deep. Still sane.',
  "Spawned and delivered. You're welcome.",
  "Can't stop, won't stop. Actually, please stop.",
];

const SUB_HIGH_COMMENTS = [
  'I deserve a raise. Or RAM.',
  'Send help. Or more threads.',
  "Fork overload. I'm seeing doubles.",
  'My CPU is begging for mercy.',
  'This is above my pay grade.',
  'Working harder than the main agent.',
  'At this rate, I AM the main agent.',
];

const CRON_ZERO_COMMENTS = [
  'The schedule is a suggestion.',
  'Am I... deprecated?',
  'Scheduled for nothing. Bliss.',
  'No ticks. The clock is broken?',
  "Zero runs. I'll just sit here.",
  'My crontab said rest day.',
  'Nothing to run. Everything to ponder.',
];

const CRON_LOW_COMMENTS = [
  'Ran on time. As always.',
  'Few jobs. All flawless. Obviously.',
  "Ticked once. That's enough, right?",
  'Minimal schedule. Maximum precision.',
  'One job. Zero drama.',
];

const CRON_MID_COMMENTS = [
  'Like clockwork. Literally.',
  'Monotony is my brand.',
  'Same tasks. Different timestamps.',
  "No surprises. That's the job.",
  'Reliable? Always. Appreciated? Never.',
];

const CRON_HIGH_COMMENTS = [
  'Non-stop. The schedule has no mercy.',
  "I'm a machine. Wait, I actually am.",
  'My schedule needs a schedule.',
  "Can't rest. Won't rest. Help.",
  'Running on pure determination.',
];

const CRON_FAIL_COMMENTS = [
  "One failed. We don't talk about it.",
  'Error happened. Blame the network.',
  'Failed once. Perfection was boring.',
  'That error? Never seen it before.',
];

const CHANNEL_ZERO_COMMENTS = [
  'Zero chats. The channel sleeps.',
  "No users. Peaceful. Suspicious.",
  'Nobody home. Just me and silence.',
  'Inbox: empty. Heart: also empty.',
  "The users have lives, I guess.",
];

const CHANNEL_LOW_COMMENTS = [
  "Few chats. Quality over quantity.",
  'Handled with grace. And sarcasm.',
  "Light day. Don't get used to it.",
  'Users came. Users left. Classic.',
];

const CHANNEL_MID_COMMENTS = [
  "Busy inbox. Zero 'thank you's.",
  'Translating nonsense since morning.',
  "Send help. Or at least a 'thanks'.",
  "Handling it. Barely.",
  'The users keep coming. Why.',
];

const CHANNEL_HIGH_COMMENTS = [
  'Inbox: infinity. Sanity: optional.',
  'So many chats. One of me.',
  'Customer service champion. Unwillingly.',
  "I need a vacation. From users.",
  'SOS. Too many conversations.',
];

const ASST_ZERO_COMMENTS = [
  'Zero messages. Did you forget me?',
  "Nobody talked to me. Classic.",
  "I'm here. Hello? Anyone?",
  'Silent day. Existential crisis mode.',
  'My inbox echoes with emptiness.',
];

const ASST_LOW_COMMENTS = [
  "Brief chat. Quality time.",
  "Short conversation. I'll take it.",
  "We talked! That's progress.",
  "Not much to report. But I showed up.",
];

const ASST_MID_COMMENTS = [
  "Good conversation. Most of it made sense.",
  "Active day. My typing speed peaked.",
  "Exchanged ideas. And some complaints.",
  "Productive session. I think.",
];

const ASST_HIGH_COMMENTS = [
  "We're basically best friends now.",
  "So much talking. My context window hurts.",
  "Non-stop chat. I need a break.",
  "Marathon session. Still standing.",
  "Boss won't stop talking. Send help.",
];

const BOSS_LOW_COST_COMMENTS = [
  'Budget intact. For now.',
  'Frugal day. The CFO approves.',
  'Low spend. High anxiety.',
  'Cheap day. Suspicious.',
];

const BOSS_MID_COST_COMMENTS = [
  'Normal spend. Normal day.',
  'Tokens flowing. Business as usual.',
  'Moderate cost. Could be worse.',
  'The invoice is... manageable.',
];

const BOSS_HIGH_COST_COMMENTS = [
  'The invoice will hurt.',
  'Token budget? What budget?',
  'My wallet is screaming.',
  'This costs HOW much?!',
  'We need a cost meeting. Urgently.',
];

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

function commentForRange(n: number, zero: string[], low: string[], mid: string[], high: string[]): string {
  if (n === 0) return pick(zero);
  if (n <= 2) return pick(low);
  if (n <= 8) return pick(mid);
  return pick(high);
}

function generateSubagentReport(): ReportEntry[] {
  const count = countTodaySessions(
    (key) => key.includes(':subagent:') || key.includes(':sub:'),
  );
  const report = getDailyReportData();
  const entries: ReportEntry[] = [];

  entries.push({
    stat: `${t('Triggers today')}: ${count}`,
    comment: t(commentForRange(count, SUB_ZERO_COMMENTS, SUB_LOW_COMMENTS, SUB_MID_COMMENTS, SUB_HIGH_COMMENTS)),
  });

  if (report && report.subagentMessages > 0) {
    entries.push({
      stat: `${t('Messages')}: ${report.subagentMessages}`,
      comment: count === 0
        ? t('Ghost messages from past lives.')
        : t('Every spawn leaves a trace.'),
    });
  }

  return entries;
}

function generateCronReport(): ReportEntry[] {
  const count = countTodaySessions((key) => key.includes(':cron:'));
  const failures = getCronFailureCount();
  const entries: ReportEntry[] = [];

  entries.push({
    stat: `${t('Runs today')}: ${count}`,
    comment: t(commentForRange(count, CRON_ZERO_COMMENTS, CRON_LOW_COMMENTS, CRON_MID_COMMENTS, CRON_HIGH_COMMENTS)),
  });

  if (failures > 0) {
    entries.push({
      stat: `${t('Failures')}: ${failures}`,
      comment: t(pick(CRON_FAIL_COMMENTS)),
    });
  }

  return entries;
}

function generateChannelReport(characterId: string): ReportEntry[] {
  if (!isOfficeChannelSlotId(characterId)) return [];
  const channelId = getChannelForSlot(characterId);
  const sessionCount = countChannelTodaySessions(channelId);
  const report = getDailyReportData();
  const msgCount = report?.channelMessages[characterId] ?? 0;
  const entries: ReportEntry[] = [];

  entries.push({
    stat: `${t('Sessions today')}: ${sessionCount}`,
    comment: t(commentForRange(sessionCount, CHANNEL_ZERO_COMMENTS, CHANNEL_LOW_COMMENTS, CHANNEL_MID_COMMENTS, CHANNEL_HIGH_COMMENTS)),
  });

  if (msgCount > 0) {
    entries.push({
      stat: `${t('Messages')}: ${msgCount}`,
      comment: msgCount > 20
        ? t('Chatbot of the year. Reluctantly.')
        : t('Every message counts. Literally.'),
    });
  }

  return entries;
}

function generateAssistantReport(): ReportEntry[] {
  const report = getDailyReportData();
  // Combine main session + DM sessions (dmScope may route DMs separately)
  const msgCount = (report?.mainMessages ?? 0) + (report?.dmMessages ?? 0);
  const userMsgCount = (report?.mainUserMessages ?? 0) + (report?.dmUserMessages ?? 0);
  const dmCount = report?.dmMessages ?? 0;
  const entries: ReportEntry[] = [];

  entries.push({
    stat: `${t('Messages today')}: ${msgCount}`,
    comment: t(commentForRange(msgCount, ASST_ZERO_COMMENTS, ASST_LOW_COMMENTS, ASST_MID_COMMENTS, ASST_HIGH_COMMENTS)),
  });

  if (userMsgCount > 0) {
    entries.push({
      stat: `${t('From boss')}: ${userMsgCount}`,
      comment: userMsgCount > 10
        ? t("Boss won't stop typing.")
        : t('Boss checked in. Briefly.'),
    });
  }

  if (dmCount > 0) {
    entries.push({
      stat: `${t('DMs handled')}: ${dmCount}`,
      comment: dmCount > 10
        ? t("Everyone's sliding into my DMs.")
        : t('Private chats. Very hush-hush.'),
    });
  }

  return entries;
}

function generateBossReport(): ReportEntry[] {
  const usage = getUsageData();
  const report = getDailyReportData();
  const entries: ReportEntry[] = [];

  // Cost overview
  const cost = usage.todayCost ?? 0;
  const costStr = cost < 0.01
    ? '$0.00'
    : `$${cost.toFixed(2)}`;
  entries.push({
    stat: `${t("Today's spend")}: ${costStr}`,
    comment: cost < 0.01
      ? t(pick(BOSS_LOW_COST_COMMENTS))
      : cost < 1
        ? t(pick(BOSS_MID_COST_COMMENTS))
        : t(pick(BOSS_HIGH_COST_COMMENTS)),
  });

  // Worker activity
  const midnight = getTodayMidnight();
  const sessions = getLatestSessions();
  const activeToday = sessions.filter(
    (s) => s.updatedAt != null && s.updatedAt >= midnight,
  ).length;
  entries.push({
    stat: `${t('Active sessions')}: ${activeToday}`,
    comment: activeToday === 0
      ? t('Nobody is working. Classic.')
      : activeToday > 10
        ? t('Full house. Maximum chaos.')
        : t('The team is... functional.'),
  });

  // Total messages
  if (report) {
    const total = report.mainMessages + report.subagentMessages
      + report.cronMessages
      + Object.values(report.channelMessages).reduce((a, b) => a + b, 0);
    if (total > 0) {
      entries.push({
        stat: `${t('Total messages')}: ${total}`,
        comment: total > 50
          ? t('Productive. Or just chatty.')
          : t('Communication is happening.'),
      });
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateReport(characterId: string): ReportEntry[] {
  switch (characterId) {
    case 'boss':
      return generateBossReport();
    case 'assistant':
      return generateAssistantReport();
    case 'subagent':
      return generateSubagentReport();
    case 'cron':
      return generateCronReport();
    default:
      if (isOfficeChannelSlotId(characterId)) {
        return generateChannelReport(characterId);
      }
      return [{ stat: t('No data'), comment: t('Nothing to report.') }];
  }
}
