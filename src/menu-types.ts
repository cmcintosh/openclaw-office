import type { Character } from './character';
import type { ReportEntry } from './menu-report';

export type MenuView = 'info' | 'sessions' | 'settings' | 'report' | 'achievement';

export interface MenuButton {
  label: string;
  action: string;
}

export interface ChannelOption {
  channelId: string;
  label: string;
  detail: string;
  selectable: boolean;
}

export interface AchievementData {
  id: string;
  name: string;
  conditionText: string;
  flavorText: string;
}

export interface MenuState {
  open: boolean;
  view: MenuView;
  characterId: string | null;
  character: Character | null;
  pressedIndex: number;
  viewChangedAt: number;
  sessionsList: import('./bridge').SessionData[];
  settingsList: ChannelOption[];
  reportLines: ReportEntry[];
  currentPage: number;
  achievements: AchievementData[];
  selectedAchievementIndex: number;
}
