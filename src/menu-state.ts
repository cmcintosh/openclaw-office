import type { Character } from './character';
import type { MenuState } from './menu-types';
import { computeAchievements } from './menu-achievement';

export const state: MenuState = {
  open: false,
  view: 'info',
  characterId: null,
  character: null,
  pressedIndex: -1,
  viewChangedAt: 0,
  sessionsList: [],
  settingsList: [],
  reportLines: [],
  currentPage: 0,
  achievements: [],
  selectedAchievementIndex: 0,
};

export function openCharacterMenu(characterId: string, character: Character): void {
  state.open = true;
  state.view = 'info';
  state.characterId = characterId;
  state.character = character;
  state.pressedIndex = -1;
  state.sessionsList = [];
  state.settingsList = [];
  state.reportLines = [];
  state.currentPage = 0;
  state.achievements = computeAchievements(characterId);
  state.selectedAchievementIndex = 0;
}

export function closeMenu(): void {
  state.open = false;
  state.view = 'info';
  state.characterId = null;
  state.character = null;
  state.pressedIndex = -1;
  state.sessionsList = [];
  state.settingsList = [];
  state.reportLines = [];
  state.currentPage = 0;
  state.achievements = [];
  state.selectedAchievementIndex = 0;
}

export function openSessionsView(sessionsList: MenuState['sessionsList']): void {
  state.view = 'sessions';
  state.viewChangedAt = Date.now();
  state.sessionsList = sessionsList;
  state.settingsList = [];
  state.currentPage = 0;
  state.pressedIndex = -1;
}

export function openSettingsView(settingsList: MenuState['settingsList']): void {
  state.view = 'settings';
  state.viewChangedAt = Date.now();
  state.settingsList = settingsList;
  state.sessionsList = [];
  state.currentPage = 0;
  state.pressedIndex = -1;
}

export function openReportView(reportLines: MenuState['reportLines']): void {
  state.view = 'report';
  state.viewChangedAt = Date.now();
  state.reportLines = reportLines;
  state.sessionsList = [];
  state.settingsList = [];
  state.currentPage = 0;
  state.pressedIndex = -1;
}

export function openAchievementView(index: number): void {
  state.view = 'achievement';
  state.viewChangedAt = Date.now();
  state.selectedAchievementIndex = index;
  state.pressedIndex = -1;
}

export function goBackToInfo(): void {
  state.view = 'info';
  state.viewChangedAt = Date.now();
  state.pressedIndex = -1;
}
