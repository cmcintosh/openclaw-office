// Achievement system: per-character daily achievements derived from bridge state.
// Each character can earn at most one achievement per session (highest tier wins).

import { getDailyReportData, getUsageData, getCronFailureCount } from './bridge';
import { isOfficeChannelSlotId } from './channel-config';
import { t } from './i18n';
import type { AchievementData } from './menu-types';

interface AchievementDef {
  id: string;
  name: string;
  conditionText: string;
  flavorText: string;
  tier: number; // higher = rarer/more impressive
  // Achievements in the same group are mutually exclusive: only the highest-tier
  // earned one is shown. Leave undefined for independent achievements.
  excludeGroup?: string;
  check: (c: AchievementContext) => boolean;
}

interface AchievementContext {
  mainMessages: number;
  mainUserMessages: number;
  dmMessages: number;
  subagentMessages: number;
  cronMessages: number;
  channelMessages: Record<string, number>;
  todayCost: number;
  cronFailureCount: number;
  isLateNight: boolean;
  slotId: string; // channel slot ID for channel characters
}

// ---------------------------------------------------------------------------
// Achievement definitions per character role
// ---------------------------------------------------------------------------

const BOSS_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'spendthrift',
    name: 'Spendthrift',
    conditionText: 'Spent over $25 today',
    flavorText: "Money well spent — or at least money spent.",
    tier: 3,
    excludeGroup: 'spend',
    check: (c) => c.todayCost >= 25,
  },
  {
    id: 'night_shift',
    name: 'Night Shift',
    conditionText: 'Working past midnight',
    flavorText: "Sleep is for the weak. And the healthy.",
    tier: 2,
    check: (c) => c.isLateNight && c.mainMessages > 0,
  },
  {
    id: 'micromanager',
    name: 'Micromanager',
    conditionText: 'Sent over 30 messages today',
    flavorText: "The AI received your feedback. All 30+ messages of it.",
    tier: 2,
    check: (c) => c.mainUserMessages > 30,
  },
  {
    id: 'budget_conscious',
    name: 'Budget Conscious',
    conditionText: 'Spent less than $5 today',
    flavorText: "Your accountant approves. The AI is not impressed.",
    tier: 1,
    excludeGroup: 'spend',
    check: (c) => c.todayCost > 0 && c.todayCost < 5,
  },
];

const ASSISTANT_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'most_talkative',
    name: 'Most Talkative',
    conditionText: 'Replied over 100 times today',
    flavorText: "Words per minute: impressive. Silence: nonexistent.",
    tier: 3,
    excludeGroup: 'main_vol',
    check: (c) => c.mainMessages > 100,
  },
  {
    id: 'deep_work',
    name: 'Deep Work',
    conditionText: 'Replied over 50 times in main chat',
    flavorText: "Cal Newport would be proud. Mostly.",
    tier: 2,
    excludeGroup: 'main_vol',
    check: (c) => c.mainMessages > 50,
  },
  {
    id: 'dm_specialist',
    name: 'DM Specialist',
    conditionText: 'Handled over 20 direct messages',
    flavorText: "Inbox: managed. Social skills: also managed.",
    tier: 2,
    check: (c) => c.dmMessages > 20,
  },
  {
    id: 'juggler',
    name: 'Juggler',
    conditionText: 'Active in both main chat and DMs today',
    flavorText: "Multitasking achieved. Focus: somewhere else.",
    tier: 1,
    check: (c) => c.mainMessages > 0 && c.dmMessages > 0,
  },
];

const SUBAGENT_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'overachiever',
    name: 'Overachiever',
    conditionText: 'Completed over 20 sub-tasks today',
    flavorText: "Technically this is what you were hired for. Still impressive.",
    tier: 3,
    excludeGroup: 'sub_vol',
    check: (c) => c.subagentMessages > 20,
  },
  {
    id: 'multitasker',
    name: 'Multitasker',
    conditionText: 'Handled over 10 sub-tasks today',
    flavorText: "Juggling tasks with digital enthusiasm.",
    tier: 2,
    excludeGroup: 'sub_vol',
    check: (c) => c.subagentMessages > 10,
  },
  {
    id: 'on_call',
    name: 'On Call',
    conditionText: 'Handled at least one sub-task today',
    flavorText: "Showed up. That counts.",
    tier: 1,
    excludeGroup: 'sub_vol',
    check: (c) => c.subagentMessages >= 1,
  },
];

const CRON_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'marathon',
    name: 'Marathon',
    conditionText: 'Ran over 20 scheduled jobs today',
    flavorText: "A machine running machines. Very meta.",
    tier: 3,
    excludeGroup: 'cron_vol',
    check: (c) => c.cronMessages > 20,
  },
  {
    id: 'clockwork',
    name: 'Clockwork',
    conditionText: 'Ran over 10 jobs without a single failure',
    flavorText: "Tick tock. No errors. Tick tock.",
    tier: 2,
    excludeGroup: 'no_fail',
    check: (c) => c.cronMessages > 10 && c.cronFailureCount === 0,
  },
  {
    id: 'troublemaker',
    name: 'Troublemaker',
    conditionText: 'Triggered over 5 job failures today',
    flavorText: "The on-call engineer has been notified. Again.",
    tier: 2,
    check: (c) => c.cronFailureCount > 5,
  },
  {
    id: 'clean_run',
    name: 'Clean Run',
    conditionText: 'Completed all jobs without failure',
    flavorText: "Error logs: empty. Confidence: high.",
    tier: 1,
    excludeGroup: 'no_fail',
    check: (c) => c.cronMessages >= 1 && c.cronFailureCount === 0,
  },
];

const CHANNEL_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: '100_club',
    name: '100 Club',
    conditionText: 'Handled over 100 channel messages today',
    flavorText: "The channel is very chatty. So is this operator.",
    tier: 3,
    excludeGroup: 'ch_vol',
    check: (c) => (c.channelMessages[c.slotId] ?? 0) > 100,
  },
  {
    id: 'active_inbox',
    name: 'Active Inbox',
    conditionText: 'Handled over 20 channel messages today',
    flavorText: "Messages handled. Users satisfied (probably).",
    tier: 2,
    excludeGroup: 'ch_vol',
    check: (c) => (c.channelMessages[c.slotId] ?? 0) > 20,
  },
  {
    id: 'radio_silence',
    name: 'Radio Silence',
    conditionText: 'Configured but received no messages today',
    flavorText: "Ready and waiting. The channel just isn't calling.",
    tier: 1,
    excludeGroup: 'ch_vol',
    check: (c) => (c.channelMessages[c.slotId] ?? 0) === 0,
  },
];

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

function buildContext(slotId: string): AchievementContext {
  const report = getDailyReportData();
  const { todayCost } = getUsageData();
  const cronFailureCount = getCronFailureCount();
  const hour = new Date().getHours();
  return {
    mainMessages: report?.mainMessages ?? 0,
    mainUserMessages: report?.mainUserMessages ?? 0,
    dmMessages: report?.dmMessages ?? 0,
    subagentMessages: report?.subagentMessages ?? 0,
    cronMessages: report?.cronMessages ?? 0,
    channelMessages: report?.channelMessages ?? {},
    todayCost: todayCost ?? 0,
    cronFailureCount,
    isLateNight: hour >= 22 || hour < 5,
    slotId,
  };
}

/**
 * Returns all earned achievements, filtering out lower-tier achievements within
 * the same excludeGroup (only the highest-tier one per group is kept).
 * Independent achievements (no excludeGroup) are always included.
 * Results are sorted: highest-tier first.
 */
function pickAll(defs: AchievementDef[], ctx: AchievementContext): AchievementData[] {
  const earned = defs.filter((d) => d.check(ctx));
  if (earned.length === 0) return [];

  // For each excludeGroup, keep only the highest-tier member.
  const bestPerGroup = new Map<string, AchievementDef>();
  for (const def of earned) {
    if (!def.excludeGroup) continue;
    const existing = bestPerGroup.get(def.excludeGroup);
    if (!existing || def.tier > existing.tier) {
      bestPerGroup.set(def.excludeGroup, def);
    }
  }

  const result: AchievementDef[] = [];
  for (const def of earned) {
    if (!def.excludeGroup) {
      result.push(def);
    } else if (bestPerGroup.get(def.excludeGroup) === def) {
      result.push(def);
    }
  }

  result.sort((a, b) => b.tier - a.tier);

  return result.map((def) => ({
    id: def.id,
    name: t(def.name),
    conditionText: t(def.conditionText),
    flavorText: t(def.flavorText),
  }));
}

export function computeAchievements(characterId: string): AchievementData[] {
  const ctx = buildContext(characterId);
  switch (characterId) {
    case 'boss':      return pickAll(BOSS_ACHIEVEMENTS, ctx);
    case 'assistant': return pickAll(ASSISTANT_ACHIEVEMENTS, ctx);
    case 'subagent':  return pickAll(SUBAGENT_ACHIEVEMENTS, ctx);
    case 'cron':      return pickAll(CRON_ACHIEVEMENTS, ctx);
    default:
      if (isOfficeChannelSlotId(characterId)) {
        return pickAll(CHANNEL_ACHIEVEMENTS, ctx);
      }
      return [];
  }
}
