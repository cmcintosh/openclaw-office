/**
 * Settings view — department CRUD, OpenProject config, SuiteCRM config,
 * password change.
 */

import * as api from './api';

export function renderSettings(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="settings-view">
      <div class="settings-header">
        <button id="settings-back" class="settings-back-btn">← City</button>
        <h1>⚙ Settings</h1>
      </div>
      <div class="settings-body">
        <section class="settings-section">
          <h2>Departments</h2>
          <div id="dept-list" class="dept-list"></div>
          <form id="dept-add-form" class="dept-add-form">
            <input type="text" id="dept-name" placeholder="Department name" required maxlength="100" />
            <input type="text" id="dept-agent" placeholder="Executive agent ID (e.g. cto, cmo, coo)" required />
            <input type="text" id="dept-desc" placeholder="Description (optional)" />
            <input type="color" id="dept-color" value="#4a90d9" title="Department color" />
            <button type="submit">Add Department</button>
          </form>
        </section>

        <section class="settings-section">
          <h2>OpenProject Integration</h2>
          <form id="op-config-form" class="config-form">
            <input type="url" id="op-url" placeholder="https://openprojects.example.com" />
            <input type="password" id="op-key" placeholder="API Key" />
            <button type="submit">Save OpenProject Config</button>
          </form>
          <div id="op-status" class="config-status"></div>
        </section>

        <section class="settings-section">
          <h2>SuiteCRM Integration</h2>
          <form id="crm-config-form" class="config-form">
            <input type="url" id="crm-url" placeholder="https://crm.example.com" />
            <input type="password" id="crm-key" placeholder="API Key" />
            <button type="submit">Save SuiteCRM Config</button>
          </form>
          <div id="crm-status" class="config-status"></div>
        </section>

        <section class="settings-section">
          <h2>OpenClaw Gateway</h2>
          <div class="gateway-info">
            <p>The gateway URL is configured server-side via the <code>OPENCLAW_GW</code> environment variable.</p>
            <p class="gateway-url" id="gw-url-display">Loading...</p>
          </div>
        </section>

        <section class="settings-section">
          <h2>Change Password</h2>
          <form id="pwd-change-form" class="config-form">
            <input type="password" id="pwd-current" placeholder="Current password" required />
            <input type="password" id="pwd-new" placeholder="New password (min 8 chars)" required minlength="8" />
            <button type="submit">Change Password</button>
          </form>
          <div id="pwd-status" class="config-status"></div>
        </section>
      </div>
    </div>
  `;

  document.getElementById('settings-back')!.onclick = onBack;

  loadDepartments();
  loadConfigs();
  setupHandlers(onBack);
}

async function loadDepartments(): Promise<void> {
  try {
    const result = await api.departments.list();
    renderDeptList(result.departments || []);
  } catch (err) {
    console.error('Failed to load departments:', err);
  }
}

function renderDeptList(depts: any[]): void {
  const list = document.getElementById('dept-list');
  if (!list) return;
  if (depts.length === 0) {
    list.innerHTML = '<p class="empty-state">No departments yet. Add one below.</p>';
    return;
  }
  list.innerHTML = depts.map((d) => `
    <div class="dept-item">
      <span class="dept-item-color" style="background: ${escapeHtml(d.color)}"></span>
      <div class="dept-item-info">
        <strong>${escapeHtml(d.name)}</strong>
        <span class="dept-item-agent">Executive: ${escapeHtml(d.executiveAgentId)}</span>
        ${d.description ? `<span class="dept-item-desc">${escapeHtml(d.description)}</span>` : ''}
      </div>
      <button class="dept-delete-btn" data-id="${d.id}">Delete</button>
    </div>
  `).join('');

  list.querySelectorAll('.dept-delete-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.id;
      if (!id || !confirm('Delete this department?')) return;
      try {
        await api.departments.delete(id);
        loadDepartments();
      } catch (err) {
        alert('Failed to delete department');
      }
    });
  });
}

async function loadConfigs(): Promise<void> {
  try {
    const [op, crm] = await Promise.all([
      api.openproject.getConfig(),
      api.suitecrm.getConfig(),
    ]);
    if (op.url) (document.getElementById('op-url') as HTMLInputElement).value = op.url;
    if (crm.url) (document.getElementById('crm-url') as HTMLInputElement).value = crm.url;
    document.getElementById('op-status')!.textContent = op.configured ? '✅ Configured' : '⚠ Not configured';
    document.getElementById('crm-status')!.textContent = crm.configured ? '✅ Configured' : '⚠ Not configured';
  } catch (err) {
    console.error('Failed to load configs:', err);
  }

  // Load gateway URL from server
  try {
    const gwConfig = await api.openclaw.getConfig();
    const gwDisplay = document.getElementById('gw-url-display');
    if (gwDisplay && gwConfig.gatewayUrl) {
      gwDisplay.textContent = `Gateway: ${gwConfig.gatewayUrl}`;
    }
  } catch {}

  // Remove old gateway localStorage entries
  localStorage.removeItem('oc_gateway_url');
  localStorage.removeItem('oc_gateway_token');
}

function setupHandlers(onBack: () => void): void {
  // Add department
  document.getElementById('dept-add-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (document.getElementById('dept-name') as HTMLInputElement).value;
    const agent = (document.getElementById('dept-agent') as HTMLInputElement).value;
    const desc = (document.getElementById('dept-desc') as HTMLInputElement).value;
    const color = (document.getElementById('dept-color') as HTMLInputElement).value;
    try {
      await api.departments.create({ name, executiveAgentId: agent, description: desc, color });
      (e.target as HTMLFormElement).reset();
      (document.getElementById('dept-color') as HTMLInputElement).value = '#4a90d9';
      loadDepartments();
    } catch (err: any) {
      alert('Failed to add department: ' + (err.message || 'Unknown error'));
    }
  });

  // OpenProject config
  document.getElementById('op-config-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = (document.getElementById('op-url') as HTMLInputElement).value;
    const key = (document.getElementById('op-key') as HTMLInputElement).value;
    try {
      await api.openproject.setConfig(url, key);
      document.getElementById('op-status')!.textContent = '✅ Saved';
      (document.getElementById('op-key') as HTMLInputElement)!.value = '';
    } catch (err: any) {
      document.getElementById('op-status')!.textContent = '❌ ' + err.message;
    }
  });

  // SuiteCRM config
  document.getElementById('crm-config-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = (document.getElementById('crm-url') as HTMLInputElement).value;
    const key = (document.getElementById('crm-key') as HTMLInputElement).value;
    try {
      await api.suitecrm.setConfig(url, key);
      document.getElementById('crm-status')!.textContent = '✅ Saved';
      (document.getElementById('crm-key') as HTMLInputElement)!.value = '';
    } catch (err: any) {
      document.getElementById('crm-status')!.textContent = '❌ ' + err.message;
    }
  });

  // Change password
  document.getElementById('pwd-change-form')!.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = (document.getElementById('pwd-current') as HTMLInputElement).value;
    const next = (document.getElementById('pwd-new') as HTMLInputElement).value;
    try {
      await api.auth.changePassword(current, next);
      document.getElementById('pwd-status')!.textContent = '✅ Password changed';
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      document.getElementById('pwd-status')!.textContent = '❌ ' + err.message;
    }
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}