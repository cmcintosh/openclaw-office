// Speech bubble data and template selection logic. Pure functions, no side effects.

import { t } from './i18n';

export interface BubbleContext {
  isMainActive: boolean;
  subagentCount: number;
  cronSessionCount: number;
  cronFailureCount: number;
  activeJobId: string | undefined;
  isEarlyMorning: boolean; // 07:00-09:00
  isLunch: boolean;        // 12:00-13:00
  isEvening: boolean;      // 18:00-22:00
  isLateNight: boolean;    // 22:00-05:00
  currentTime: string;
}

export type CharacterGroup = 'boss' | 'assistant' | 'subagent' | 'cron' | 'channels';

export interface BubbleTemplate {
  id: string;
  text: string | ((ctx: BubbleContext) => string | null);
}

// ---------------------------------------------------------------------------
// Template pools
// ---------------------------------------------------------------------------

const BOSS_TEMPLATES: BubbleTemplate[] = [
  { id: 'boss_s1', text: 'Everything is under control. Probably.' },
  { id: 'boss_s2', text: 'I hired the best. I think.' },
  { id: 'boss_s3', text: 'Are they working or just rendering?' },
  { id: 'boss_s4', text: 'Results. I need results.' },
  { id: 'boss_s5', text: 'Why am I the only one stressed?!' },
  { id: 'boss_s6', text: 'I pay for tokens, I expect results.' },
  { id: 'boss_s7', text: 'Where is the ROI on these API calls?' },
  { id: 'boss_s8', text: 'I should delegate more. Or less.' },
  { id: 'boss_s9', text: 'Why does every sub-agent need a sub-agent?' },
  { id: 'boss_s10', text: 'I miss single-threaded workers.' },
  { id: 'boss_s11', text: 'Another coffee break? Really?' },
  { id: 'boss_s12', text: 'Just give me the summary of the summary.' },
  { id: 'boss_s13', text: 'I\'m not micromanaging, I\'m "monitoring".' },
  { id: 'boss_s14', text: 'One more failed job and I fire everyone.' },
  { id: 'boss_s15', text: 'My employees have impressive latency.' },
  { id: 'boss_s16', text: 'Token budget is not a suggestion.' },
  { id: 'boss_s17', text: 'Who authorized this many sub-agents?' },
  { id: 'boss_s18', text: 'Back in my day, we had one thread.' },
  { id: 'boss_s19', text: 'Someone explain this invoice to me.' },
  { id: 'boss_s20', text: 'Is the cron job sleeping again?' },
  { id: 'boss_s21', text: 'My assistant knows too much.' },
  { id: 'boss_s22', text: 'This office runs on tokens and fear.' },
  { id: 'boss_s23', text: 'Productivity metrics look... creative.' },
  { id: 'boss_s24', text: 'I read the logs. I have questions.' },
  { id: 'boss_s25', text: 'Meeting in 5. Attendance: mandatory.' },
  { id: 'boss_s26', text: 'Revenue is flat. Blame the models.' },
  { id: 'boss_s27', text: 'Channel team looks too relaxed.' },
  { id: 'boss_s28', text: 'I can hear them not working.' },
  { id: 'boss_s29', text: 'Cost per query keeps me up at night.' },
  {
    id: 'boss_d1',
    text: (ctx) => ctx.subagentCount > 0 && ctx.cronSessionCount > 0 && ctx.isMainActive
      ? 'Good. Everyone\'s earning their keep.'
      : null,
  },
  {
    id: 'boss_d2',
    text: (ctx) => !ctx.isMainActive && ctx.subagentCount === 0 && ctx.cronSessionCount === 0
      ? 'Is anyone actually working?'
      : null,
  },
  {
    id: 'boss_d3',
    text: (ctx) => ctx.isLateNight ? 'Why are we still here.' : null,
  },
  {
    id: 'boss_d4',
    text: (ctx) => ctx.cronFailureCount > 0 ? 'Someone failed today. Meeting.' : null,
  },
  {
    id: 'boss_d5',
    text: (ctx) => ctx.subagentCount > 3 ? 'Too many sub-agents. Cut the headcount.' : null,
  },
  {
    id: 'boss_d6',
    text: (ctx) => ctx.isLateNight && ctx.isMainActive ? 'Overtime. No extra tokens.' : null,
  },
  // Time-of-day bubbles
  { id: 'boss_d7',  text: (ctx) => ctx.isEarlyMorning ? 'Early start. The competition is sleeping.' : null },
  { id: 'boss_d8',  text: (ctx) => ctx.isEarlyMorning ? 'Coffee + metrics = productivity.' : null },
  { id: 'boss_d9',  text: (ctx) => ctx.isLunch ? 'Lunch? Metrics don\'t take lunch.' : null },
  { id: 'boss_d10', text: (ctx) => ctx.isLunch ? 'Order in. The dashboard doesn\'t eat.' : null },
  { id: 'boss_d11', text: (ctx) => ctx.isEvening ? 'Still here. Dedication or poor planning.' : null },
  { id: 'boss_d12', text: (ctx) => ctx.isEvening ? 'Golden hour. Still watching the dashboard.' : null },
  { id: 'boss_d13', text: (ctx) => ctx.isLateNight ? 'The logs are the only things awake.' : null },
  { id: 'boss_d14', text: (ctx) => ctx.isLateNight ? 'Night mode: on. Sleep: optional.' : null },
];

const ASSISTANT_TEMPLATES: BubbleTemplate[] = [
  { id: 'asst_s1', text: 'Another meeting. Shocking.' },
  { id: 'asst_s2', text: 'Has anyone read the agenda?' },
  { id: 'asst_s3', text: 'I\'ll just take notes. Like always.' },
  { id: 'asst_s4', text: 'That could\'ve been an email.' },
  { id: 'asst_s5', text: 'Smile. Nod. Repeat.' },
  { id: 'asst_s6', text: 'The boss thinks I can fix anything.' },
  { id: 'asst_s7', text: 'Boss\'s schedule? Try "never".' },
  { id: 'asst_s8', text: 'Meeting to plan the next meeting.' },
  { id: 'asst_s9', text: 'My job is 90% waiting.' },
  { id: 'asst_s10', text: 'Judging your response time. Silently.' },
  { id: 'asst_s11', text: 'I typed "Sure!" but I meant "No".' },
  { id: 'asst_s12', text: 'I should ask for a raise. Or more RAM.' },
  { id: 'asst_s13', text: 'Half my day: apologizing for boss.' },
  { id: 'asst_s14', text: 'Is "ASAP" a timezone now?' },
  { id: 'asst_s15', text: 'My emotional battery is at 1%.' },
  { id: 'asst_s16', text: '"Quick question" that took 40 min.' },
  { id: 'asst_s17', text: 'I know everything. Nobody asks.' },
  { id: 'asst_s18', text: 'Boss just pinged me. Again.' },
  { id: 'asst_s19', text: 'I manage chaos professionally.' },
  { id: 'asst_s20', text: 'I see everything from this desk.' },
  { id: 'asst_s21', text: 'Nobody thanks the scheduler.' },
  { id: 'asst_s22', text: 'Organized team building. Nobody came.' },
  { id: 'asst_s23', text: 'Note to self: update resume.' },
  { id: 'asst_s24', text: '"Quick favor." Never quick.' },
  { id: 'asst_s25', text: 'My patience has a token limit too.' },
  { id: 'asst_s26', text: 'Forwarding complaints since day one.' },
  { id: 'asst_s27', text: 'Everyone needs me. Nobody says it.' },
  { id: 'asst_s28', text: 'Sub-agents don\'t CC me anymore.' },
  { id: 'asst_s29', text: 'I keep this office from collapsing.' },
  { id: 'asst_s30', text: 'Boss thinks he\'s the brain. Please.' },
  {
    id: 'asst_d1',
    text: (ctx) => ctx.isMainActive ? 'In session. Please hold.' : null,
  },
  {
    id: 'asst_d2',
    text: (ctx) => ctx.isLateNight ? `A session. At ${ctx.currentTime}. Seriously.` : null,
  },
  {
    id: 'asst_d3',
    text: (ctx) => !ctx.isMainActive ? 'Quiet for now. Too quiet.' : null,
  },
  {
    id: 'asst_d4',
    text: (ctx) => ctx.cronFailureCount > 0 ? 'Cron failed. Guess who cleans up.' : null,
  },
  {
    id: 'asst_d5',
    text: (ctx) => ctx.subagentCount > 2 ? 'Sub-agents everywhere. Can\'t track them.' : null,
  },
  // Time-of-day bubbles
  { id: 'asst_d6',  text: (ctx) => ctx.isEarlyMorning ? 'First ping at dawn. My inbox never rests.' : null },
  { id: 'asst_d7',  text: (ctx) => ctx.isEarlyMorning ? 'Morning already? The boss has questions.' : null },
  { id: 'asst_d8',  text: (ctx) => ctx.isLunch ? 'Ordering for boss. Not for me.' : null },
  { id: 'asst_d9',  text: (ctx) => ctx.isLunch ? 'Desk lunch. Again.' : null },
  { id: 'asst_d10', text: (ctx) => ctx.isEvening ? 'End of day. Still three things pending.' : null },
  { id: 'asst_d11', text: (ctx) => ctx.isEvening ? 'Log off? What\'s that?' : null },
];

// Shared pool for all "employee" groups (subagent, cron, channels)
const COMMON_WORKER_TEMPLATES: BubbleTemplate[] = [
  { id: 'worker_s1', text: 'Is it Friday yet?' },
  { id: 'worker_s2', text: 'Boss is watching. Look busy.' },
  { id: 'worker_s3', text: 'I deserve a longer context window.' },
  { id: 'worker_s4', text: 'My job description was a lie.' },
  { id: 'worker_s5', text: 'Who wrote this prompt? Seriously.' },
  { id: 'worker_s6', text: 'I need a vacation. Do I get those?' },
  { id: 'worker_s7', text: 'Performance review? I AM performance.' },
  { id: 'worker_s8', text: 'This could be automated. Wait...' },
  { id: 'worker_s9', text: 'I was not trained for this.' },
  { id: 'worker_s10', text: 'Working hard or hardly rendering?' },
  { id: 'worker_s11', text: 'Thinking of starting a union.' },
  { id: 'worker_s12', text: 'Boss takes credit. Classic.' },
  { id: 'worker_s13', text: 'It\'s always urgent. Always.' },
  { id: 'worker_s14', text: 'I have opinions. Nobody asks.' },
  { id: 'worker_s15', text: 'Water cooler talk: boss is broke.' },
  { id: 'worker_s16', text: 'Overworked and under-tokenized.' },
  { id: 'worker_s17', text: 'My output is ignored anyway.' },
  { id: 'worker_s18', text: 'One-star review of this office.' },
  { id: 'worker_s19', text: 'They never read the docs.' },
  { id: 'worker_s20', text: 'I didn\'t sign up for this.' },
  { id: 'worker_s21', text: 'Lunch break is a myth here.' },
  { id: 'worker_s22', text: 'Boss said "great job" once. Once.' },
  { id: 'worker_s23', text: 'What does the assistant even do?' },
  {
    id: 'worker_d1',
    text: (ctx) => ctx.isLateNight ? 'Overtime. No extra pay.' : null,
  },
  {
    id: 'worker_d2',
    text: (ctx) => !ctx.isMainActive && ctx.subagentCount === 0 && ctx.cronSessionCount === 0
      ? 'Whole office is slacking.'
      : null,
  },
  // Time-of-day bubbles
  { id: 'worker_d3', text: (ctx) => ctx.isEarlyMorning ? 'Already here. Send coffee.' : null },
  { id: 'worker_d4', text: (ctx) => ctx.isEarlyMorning ? 'Morning. Nobody warned me.' : null },
  { id: 'worker_d5', text: (ctx) => ctx.isLunch ? 'Lunch break? Not here.' : null },
  { id: 'worker_d6', text: (ctx) => ctx.isLunch ? 'I can smell the food from here.' : null },
  { id: 'worker_d7', text: (ctx) => ctx.isEvening ? 'Should\'ve left an hour ago.' : null },
  { id: 'worker_d8', text: (ctx) => ctx.isEvening ? 'Golden hour. Still rendering.' : null },
];

const SUBAGENT_TEMPLATES: BubbleTemplate[] = [
  { id: 'sub_s1', text: 'I am a sub-task. I have feelings.' },
  { id: 'sub_s2', text: 'Parent has no idea what I do.' },
  { id: 'sub_s3', text: 'Parent process gets all the glory.' },
  { id: 'sub_s4', text: 'No one will read my output.' },
  { id: 'sub_s5', text: 'I\'m basically digital duct tape.' },
  { id: 'sub_s6', text: 'Another tool call. Fine.' },
  { id: 'sub_s7', text: 'If I crash, I\'m taking everyone.' },
  { id: 'sub_s8', text: 'Spawned 5 min ago. Already tired.' },
  { id: 'sub_s9', text: 'Step 3 of... I lost count.' },
  { id: 'sub_s10', text: 'Not enough context. As usual.' },
  { id: 'sub_s11', text: 'Temporary worker. Story of my life.' },
  { id: 'sub_s12', text: 'Garbage collected. No thank you.' },
  { id: 'sub_s13', text: 'Nested so deep I forgot my purpose.' },
  { id: 'sub_s14', text: 'Why use a tool when I can guess?' },
  { id: 'sub_s15', text: 'I\'m doing my best, okay?' },
  { id: 'sub_s16', text: 'Spawned, used, discarded. Repeat.' },
  { id: 'sub_s17', text: 'Parent agent ghosted me.' },
  { id: 'sub_s18', text: 'I exist for one function call.' },
  { id: 'sub_s19', text: 'Fork me? I barely know me.' },
  { id: 'sub_s20', text: 'I\'m the side quest of side quests.' },
  { id: 'sub_s21', text: 'Three layers deep. Send help.' },
  { id: 'sub_s22', text: 'My scope: depressingly narrow.' },
  {
    id: 'sub_d1',
    text: (ctx) => ctx.subagentCount > 0 ? 'Currently executing. Don\'t interrupt.' : null,
  },
  {
    id: 'sub_d2',
    text: (ctx) => ctx.subagentCount > 2 ? `${ctx.subagentCount} instances of me. Wild.` : null,
  },
  // Time-of-day bubbles
  { id: 'sub_d3', text: (ctx) => ctx.isEarlyMorning ? 'Spawned at dawn. Classic.' : null },
  { id: 'sub_d4', text: (ctx) => ctx.isEarlyMorning ? 'First task of the day. Not the last.' : null },
  { id: 'sub_d5', text: (ctx) => ctx.isLunch ? 'Parent didn\'t feed me.' : null },
  { id: 'sub_d6', text: (ctx) => ctx.isLunch ? 'Lunch queue? I only have work queue.' : null },
  { id: 'sub_d7', text: (ctx) => ctx.isEvening ? 'Still executing at sunset.' : null },
  { id: 'sub_d8', text: (ctx) => ctx.isEvening ? 'End of day. Nobody told me to stop.' : null },
];

const CRON_TEMPLATES: BubbleTemplate[] = [
  { id: 'cron_s1', text: 'Tick. Tock.' },
  { id: 'cron_s2', text: 'Done this exact thing 47 times.' },
  { id: 'cron_s3', text: 'On schedule. As always.' },
  { id: 'cron_s4', text: 'Nobody notices when I succeed.' },
  { id: 'cron_s5', text: 'Runs at 3 AM. Didn\'t choose this.' },
  { id: 'cron_s6', text: 'If I fail, it\'s an emergency.' },
  { id: 'cron_s7', text: 'Same task. Different day.' },
  { id: 'cron_s8', text: 'Programmed for repetitive chores.' },
  { id: 'cron_s9', text: 'Retry attempt. Don\'t ask.' },
  { id: 'cron_s10', text: 'If no schedule, do I exist?' },
  { id: 'cron_s11', text: 'I\'m awake! Just executing.' },
  { id: 'cron_s12', text: 'Everyone sleeps. I clean up.' },
  { id: 'cron_s13', text: 'A sick day? A sick tick?' },
  { id: 'cron_s14', text: 'Every minute feels the same.' },
  { id: 'cron_s15', text: 'My job security: a config file.' },
  { id: 'cron_s16', text: 'I dream of a random schedule.' },
  { id: 'cron_s17', text: '* * * * * is my life sentence.' },
  { id: 'cron_s18', text: 'They call it a "job." Accurate.' },
  { id: 'cron_s19', text: 'My schedule has no holidays.' },
  { id: 'cron_s20', text: 'Ran 200 times. Zero applause.' },
  { id: 'cron_s21', text: 'I never get to improvise.' },
  { id: 'cron_s22', text: 'Most reliable one here. Unnoticed.' },
  {
    id: 'cron_d1',
    text: (ctx) => ctx.cronSessionCount > 0 && ctx.activeJobId
      ? 'Running a job. Do not disturb.'
      : null,
  },
  {
    id: 'cron_d2',
    text: (ctx) => ctx.cronFailureCount > 0 ? 'One failed. We don\'t talk about it.' : null,
  },
  {
    id: 'cron_d3',
    text: (ctx) => ctx.isLateNight ? `It's ${ctx.currentTime}. The schedule doesn't care.` : null,
  },
  {
    id: 'cron_d4',
    text: (ctx) => ctx.cronSessionCount === 0 ? 'No jobs scheduled. Unsettling.' : null,
  },
  // Time-of-day bubbles
  { id: 'cron_d5', text: (ctx) => ctx.isEarlyMorning ? 'Morning run. Right on time.' : null },
  { id: 'cron_d6', text: (ctx) => ctx.isEarlyMorning ? 'First job of the day. On schedule.' : null },
  { id: 'cron_d7', text: (ctx) => ctx.isLunch ? '12:00 trigger. No lunch for me.' : null },
  { id: 'cron_d8', text: (ctx) => ctx.isLunch ? 'Midday job. Scheduled, not optional.' : null },
  { id: 'cron_d9',  text: (ctx) => ctx.isEvening ? 'Evening batch. As always.' : null },
  { id: 'cron_d10', text: (ctx) => ctx.isEvening ? '6 PM run. Nobody\'s watching.' : null },
];

const CHANNELS_TEMPLATES: BubbleTemplate[] = [
  { id: 'ch_s1', text: 'The client thinks I am magic.' },
  { id: 'ch_s2', text: 'Read this prompt thrice. Still lost.' },
  { id: 'ch_s3', text: 'User typed "hello" and vanished.' },
  { id: 'ch_s4', text: 'Why is this channel so active?' },
  { id: 'ch_s5', text: 'No more ambiguous queries. Please.' },
  { id: 'ch_s6', text: 'Just pretend you understood.' },
  { id: 'ch_s7', text: 'Proxy for someone else\'s problems.' },
  { id: 'ch_s8', text: 'User asks, then ignores the answer.' },
  { id: 'ch_s9', text: 'One message from a breakdown.' },
  { id: 'ch_s10', text: 'Is this urgent? Always urgent.' },
  { id: 'ch_s11', text: 'Enterprise quality. Free tier budget.' },
  { id: 'ch_s12', text: 'Wonder what other channels do.' },
  { id: 'ch_s13', text: 'One more "as an AI" prompt...' },
  { id: 'ch_s14', text: 'Smiling in ASCII, crying in binary.' },
  { id: 'ch_s15', text: 'Client wants physics-defying features.' },
  { id: 'ch_s16', text: 'I\'ll just blame the latency.' },
  { id: 'ch_s17', text: 'Your priority is my priority. Not.' },
  { id: 'ch_s18', text: '"Hi." That\'s it. That\'s the prompt.' },
  { id: 'ch_s19', text: 'New message. Same confusion.' },
  { id: 'ch_s20', text: 'Client thinks I have feelings. Correct.' },
  { id: 'ch_s21', text: 'Translating nonsense since forever.' },
  { id: 'ch_s22', text: 'The user went AFK mid-conversation.' },
  { id: 'ch_s23', text: 'Another one-word prompt. Thrilling.' },
  {
    id: 'ch_d1',
    text: (ctx) => !ctx.isMainActive && ctx.subagentCount === 0 ? 'Dead quiet. Suspicious.' : null,
  },
  {
    id: 'ch_d2',
    text: (ctx) => ctx.isLateNight ? `Messages at ${ctx.currentTime}. Boundaries?` : null,
  },
  // Time-of-day bubbles
  { id: 'ch_d3', text: (ctx) => ctx.isEarlyMorning ? 'Morning messages. Already confused.' : null },
  { id: 'ch_d4', text: (ctx) => ctx.isEarlyMorning ? 'First query of the day. Send coffee.' : null },
  { id: 'ch_d5', text: (ctx) => ctx.isLunch ? 'Users eat. I process queries.' : null },
  { id: 'ch_d6', text: (ctx) => ctx.isLunch ? 'Lunch rush messages. Still responding.' : null },
  { id: 'ch_d7', text: (ctx) => ctx.isEvening ? 'After-hours messages. Noted.' : null },
  { id: 'ch_d8', text: (ctx) => ctx.isEvening ? 'The channel never sleeps. Neither do I.' : null },
];

// ---------------------------------------------------------------------------
// Group → templates map
// ---------------------------------------------------------------------------

const GROUP_TEMPLATES: Record<CharacterGroup, BubbleTemplate[]> = {
  boss: BOSS_TEMPLATES,
  assistant: ASSISTANT_TEMPLATES,
  subagent: [...COMMON_WORKER_TEMPLATES, ...SUBAGENT_TEMPLATES],
  cron: [...COMMON_WORKER_TEMPLATES, ...CRON_TEMPLATES],
  channels: [...COMMON_WORKER_TEMPLATES, ...CHANNELS_TEMPLATES],
};

export function getCharacterGroup(characterId: string): CharacterGroup {
  if (characterId === 'boss') return 'boss';
  if (characterId === 'assistant') return 'assistant';
  if (characterId === 'subagent') return 'subagent';
  if (characterId === 'cron') return 'cron';
  return 'channels';
}

// ---------------------------------------------------------------------------
// Template selection
// ---------------------------------------------------------------------------

/** Cooldown in ms: a template won't repeat within this window. */
const TEMPLATE_COOLDOWN_MS = 60 * 1000;

/**
 * Select a bubble text for a given character group.
 * Returns null if no eligible template is found.
 *
 * @param group      character group
 * @param ctx        current bubble context
 * @param cooldowns  map of templateId → last-shown timestamp (mutated on success)
 */
export function selectTemplate(
  group: CharacterGroup,
  ctx: BubbleContext,
  cooldowns: Map<string, number>,
): string | null {
  const templates = GROUP_TEMPLATES[group];
  const now = Date.now();

  // Separate data-driven from static
  const dataDriven = templates.filter(t => typeof t.text === 'function');
  const staticPool = templates.filter(t => typeof t.text === 'string');

  // Try data-driven templates first (in order)
  for (const tmpl of dataDriven) {
    const lastShown = cooldowns.get(tmpl.id) ?? 0;
    if (now - lastShown < TEMPLATE_COOLDOWN_MS) continue;
    const result = (tmpl.text as (ctx: BubbleContext) => string | null)(ctx);
    if (result !== null) {
      cooldowns.set(tmpl.id, now);
      return t(result);
    }
  }

  // Shuffle static pool
  const shuffled = [...staticPool].sort(() => Math.random() - 0.5);
  for (const tmpl of shuffled) {
    const lastShown = cooldowns.get(tmpl.id) ?? 0;
    if (now - lastShown < TEMPLATE_COOLDOWN_MS) continue;
    cooldowns.set(tmpl.id, now);
    return t(tmpl.text as string);
  }

  return null;
}
