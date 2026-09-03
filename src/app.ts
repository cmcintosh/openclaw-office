/**
 * App controller — handles routing between login, city, office, and settings views.
 * Also handles auth state and initial boot.
 */

import { renderLogin } from './login';
import { renderCityView } from './city-view';
import { renderOfficeView } from './office-view';
import { renderSettings } from './settings';
import { auth, departments as deptApi } from './api';
import type { Department } from './types';

type View = 'login' | 'city' | 'office' | 'settings';

let currentView: View = 'login';
let selectedDepartment: Department | null = null;
let cachedDepartments: Department[] = [];

export async function bootApp(container: HTMLElement): Promise<void> {
  // Check if already authenticated
  const isValid = await auth.verify();
  if (isValid) {
    await navigateToCity(container);
  } else {
    showLogin(container);
  }
}

function showLogin(container: HTMLElement): void {
  currentView = 'login';
  renderLogin(container);

  window.addEventListener('office:login', () => {
    navigateToCity(container);
  }, { once: true });
}

async function navigateToCity(container: HTMLElement): Promise<void> {
  currentView = 'city';

  // Fetch departments
  try {
    const result = await deptApi.list();
    cachedDepartments = result.departments || [];
  } catch {
    cachedDepartments = [];
  }

  container.innerHTML = `
    <div class="city-view-wrap">
      <canvas id="city-canvas"></canvas>
    </div>
  `;

  const canvas = document.getElementById('city-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  renderCityView(canvas, {
    departments: cachedDepartments,
    onSelectDepartment: (dept) => navigateToOffice(container, dept),
    onOpenSettings: () => navigateToSettings(container),
    onLogout: () => {
      auth.logout();
      showLogin(container);
    },
  });
}

function navigateToOffice(container: HTMLElement, dept: Department): void {
  currentView = 'office';
  selectedDepartment = dept;
  renderOfficeView(container, {
    department: dept,
    onBack: () => navigateToCity(container),
  });
}

function navigateToSettings(container: HTMLElement): void {
  currentView = 'settings';
  renderSettings(container, () => navigateToCity(container));
}