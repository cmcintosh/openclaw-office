/**
 * Office Room View — pixel art office on the left, chat panel on the right.
 * Renders the executive agent's office with the existing canvas renderer
 * and overlays an HTML chat panel for text/voice interaction.
 */

import type { Department, ChatMessage } from './types';
import { renderCityView } from './city-view';
import { createChatSocket } from './api';
import { initVoiceController, type VoiceController } from './voice';

export interface OfficeViewConfig {
  department: Department;
  onBack: () => void;
}

let chatWs: WebSocket | null = null;
let voiceController: VoiceController | null = null;
let chatMessages: ChatMessage[] = [];
let isWaitingForResponse = false;
let currentSessionKey: string | null = null;

export function renderOfficeView(
  container: HTMLElement,
  config: OfficeViewConfig,
): void {
  const { department, onBack } = config;

  container.innerHTML = `
    <div class="office-view">
      <div class="office-header">
        <button id="office-back" class="office-back-btn">← City</button>
        <div class="office-title">
          <span class="office-dept-dot" style="background: ${department.color}"></span>
          <span>${department.name}</span>
          ${department.description ? `<span class="office-dept-desc">— ${department.description}</span>` : ''}
        </div>
        <div class="office-agent-badge">
          <span class="agent-status" id="agent-status">●</span>
          <span id="agent-name">${department.executiveAgentId}</span>
        </div>
      </div>
      <div class="office-body">
        <div class="office-canvas-wrap">
          <canvas id="office-canvas"></canvas>
        </div>
        <div class="chat-panel" id="chat-panel">
          <div class="chat-tabs">
            <button class="chat-tab active" data-tab="chat">💬 Chat</button>
            <button class="chat-tab" data-tab="tasks">📋 Tasks</button>
            <button class="chat-tab" data-tab="contacts">👤 Contacts</button>
          </div>
          <div class="chat-tab-content" id="tab-chat">
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-row">
              <button id="voice-btn" class="voice-btn" title="Hold to talk, double-click for voice responses">
                🎤
              </button>
              <input type="text" id="chat-input" placeholder="Message ${department.executiveAgentId}..." autocomplete="off" />
              <button id="chat-send" class="chat-send-btn">Send</button>
            </div>
            <div class="voice-status" id="voice-status"></div>
          </div>
          <div class="chat-tab-content hidden" id="tab-tasks">
            <div class="integration-panel" id="tasks-panel"></div>
          </div>
          <div class="chat-tab-content hidden" id="tab-contacts">
            <div class="integration-panel" id="contacts-panel"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Back button
  document.getElementById('office-back')!.onclick = () => {
    cleanup();
    onBack();
  };

  // Initialize chat WebSocket
  initChat(department);

  // Initialize voice
  voiceController = initVoiceController(
    document.getElementById('voice-btn') as HTMLButtonElement,
    document.getElementById('voice-status') as HTMLDivElement,
    (transcript: string) => {
      // When voice transcription completes, fill the input and auto-send
      const input = document.getElementById('chat-input') as HTMLInputElement;
      input.value = transcript;
      sendMessage(department);
    },
    (agentResponse: string) => {
      // When agent responds via TTS, add to chat
      addMessage('agent', agentResponse);
    },
  );

  // Chat send handlers
  const sendBtn = document.getElementById('chat-send')!;
  const input = document.getElementById('chat-input') as HTMLInputElement;

  sendBtn.onclick = () => sendMessage(department);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(department);
    }
  });

  // Initialize the pixel art office canvas
  initOfficeCanvas(department);

  // Tab switching
  document.querySelectorAll('.chat-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chat-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const tabId = (tab as HTMLElement).dataset.tab;
      document.querySelectorAll('.chat-tab-content').forEach((c) => c.classList.add('hidden'));
      const content = document.getElementById(`tab-${tabId}`);
      if (content) content.classList.remove('hidden');
      // Lazy load integration data
      if (tabId === 'tasks') loadOpenProjectTasks();
      if (tabId === 'contacts') loadSuiteCRMContacts();
    });
  });
}

function initChat(department: Department): void {
  try {
    chatWs = createChatSocket();
  } catch (err) {
    console.error('[Chat] Failed to create WebSocket:', err);
    addMessage('system', 'Failed to connect to chat server. Please refresh.');
    return;
  }

  chatWs.onopen = () => {
    console.log('[Chat] WebSocket connected');
    updateAgentStatus('connecting');

    // Connect to OpenClaw gateway
    chatWs!.send(JSON.stringify({
      type: 'connect',
      gatewayUrl: localStorage.getItem('oc_gateway_url') || 'ws://127.0.0.1:18789',
      gatewayToken: localStorage.getItem('oc_gateway_token') || '',
    }));
  };

  chatWs.onmessage = (event) => {
    let msg: any;
    try { msg = JSON.parse(event.data); } catch { return; }

    if (msg.type === 'gateway_connected') {
      updateAgentStatus('online');
      addMessage('system', `Connected to ${department.executiveAgentId}`);
      // List sessions to find the executive agent's session
      chatWs!.send(JSON.stringify({
        type: 'rpc',
        id: 'list-sessions',
        method: 'sessions.list',
        params: {},
      }));
    } else if (msg.type === 'gateway_disconnected') {
      updateAgentStatus('offline');
      addMessage('system', 'Disconnected from gateway. Reconnecting...');
    } else if (msg.type === 'gateway_message') {
      handleGatewayMessage(msg.data, department);
    } else if (msg.type === 'message_sent') {
      isWaitingForResponse = true;
      updateAgentStatus('thinking');
    } else if (msg.type === 'message_error') {
      addMessage('system', 'Failed to send message. Please try again.');
      isWaitingForResponse = false;
      updateAgentStatus('online');
    }
  };

  chatWs.onclose = () => {
    updateAgentStatus('offline');
    console.log('[Chat] WebSocket closed');
  };

  chatWs.onerror = () => {
    addMessage('system', 'Chat connection error.');
  };
}

function handleGatewayMessage(data: any, department: Department): void {
  // Handle RPC responses
  if (data.id === 'list-sessions' && data.result) {
    // Find the executive agent's main session
    const sessions = data.result.sessions || data.result;
    const agentSession = sessions.find((s: any) =>
      s.key && s.key.includes(department.executiveAgentId) && s.key.includes(':main'),
    );
    if (agentSession) {
      currentSessionKey = agentSession.key;
      addMessage('system', `Session established with ${department.executiveAgentId}`);
    } else {
      // Try to find any session for this agent
      const anySession = sessions.find((s: any) =>
        s.key && s.key.includes(department.executiveAgentId),
      );
      if (anySession) {
        currentSessionKey = anySession.key;
        addMessage('system', `Session established with ${department.executiveAgentId}`);
      } else {
        addMessage('system', `No active session found for ${department.executiveAgentId}. The agent may need to be activated first.`);
      }
    }
    return;
  }

  // Handle session update / new message from agent
  if (data.type === 'sessions.update' || data.type === 'session.update') {
    const sessions = data.sessions || data.data?.sessions || [];
    const agentSession = sessions.find((s: any) =>
      s.key && s.key.includes(department.executiveAgentId),
    );
    if (agentSession && agentSession.lastMessage && isWaitingForResponse) {
      isWaitingForResponse = false;
      updateAgentStatus('online');
      addMessage('agent', agentSession.lastMessage);
      // Speak the response if voice is enabled
      if (voiceController?.ttsEnabled) {
        voiceController.speak(agentSession.lastMessage);
      }
    }
  }

  // Handle chat message push from gateway
  if (data.type === 'chat.message' || data.type === 'message') {
    const content = data.content || data.message || data.text;
    if (content && data.from !== 'user') {
      isWaitingForResponse = false;
      updateAgentStatus('online');
      addMessage('agent', content);
      if (voiceController?.ttsEnabled) {
        voiceController.speak(content);
      }
    }
  }
}

function sendMessage(department: Department): void {
  const input = document.getElementById('chat-input') as HTMLInputElement;
  const text = input.value.trim();
  if (!text || !chatWs || chatWs.readyState !== WebSocket.OPEN) return;
  if (!currentSessionKey) {
    addMessage('system', 'No active session. Please wait for agent to connect.');
    return;
  }

  addMessage('user', text);
  input.value = '';

  chatWs.send(JSON.stringify({
    type: 'send_message',
    id: `msg-${Date.now()}`,
    sessionKey: currentSessionKey,
    message: text,
  }));
}

function addMessage(role: 'user' | 'agent' | 'system', content: string): void {
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    timestamp: Date.now(),
  };
  chatMessages.push(msg);
  renderMessages();
}

function renderMessages(): void {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = chatMessages.map((msg) => {
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cls = msg.role === 'user' ? 'msg-user' : msg.role === 'agent' ? 'msg-agent' : 'msg-system';
    const label = msg.role === 'user' ? 'You' : msg.role === 'agent' ? 'Agent' : 'System';
    return `
      <div class="chat-msg ${cls}">
        <div class="chat-msg-header">
          <span class="chat-msg-role">${label}</span>
          <span class="chat-msg-time">${time}</span>
        </div>
        <div class="chat-msg-content">${escapeHtml(msg.content)}</div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateAgentStatus(status: 'online' | 'offline' | 'connecting' | 'thinking'): void {
  const dot = document.getElementById('agent-status');
  if (!dot) return;
  const colors: Record<string, string> = {
    online: '#4ade80',
    offline: '#f44',
    connecting: '#fbbf24',
    thinking: '#60a5fa',
  };
  dot.style.color = colors[status] || '#888';
  dot.title = status;
}

function initOfficeCanvas(department: Department): void {
  // Use the existing renderer for the office scene
  // For now, draw a simple themed office
  const canvas = document.getElementById('office-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Set canvas size
  canvas.width = 240;
  canvas.height = 560;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';

  // Draw a simple office scene with department color theme
  drawSimpleOffice(ctx, department);
}

function drawSimpleOffice(ctx: CanvasRenderingContext2D, dept: Department): void {
  // Floor
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(0, 0, 240, 560);

  // Carpet area
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(16, 48, 208, 400);

  // Walls
  ctx.fillStyle = '#4a4a4a';
  ctx.fillRect(0, 0, 240, 16);
  ctx.fillRect(0, 0, 16, 560);
  ctx.fillRect(224, 0, 16, 560);
  ctx.fillRect(0, 448, 240, 16);

  // Windows (back wall)
  ctx.fillStyle = '#1a1a2a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(32 + i * 64, 4, 48, 8);
  }
  // Window glow
  ctx.fillStyle = 'rgba(100,180,255,0.3)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(32 + i * 64, 4, 48, 8);
  }

  // Desk (center)
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(80, 160, 80, 40);
  // Desk top
  ctx.fillStyle = '#6a5a4a';
  ctx.fillRect(80, 160, 80, 8);

  // Monitor on desk
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(104, 140, 32, 24);
  // Screen
  ctx.fillStyle = dept.color;
  ctx.fillRect(106, 142, 28, 20);
  // Screen glow
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(108, 144, 8, 8);

  // Chair behind desk
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(108, 200, 24, 24);

  // Executive character (simple pixel person)
  drawPixelPerson(ctx, 112, 180, dept.color);

  // Department sign on wall
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(80, 24, 80, 16);
  ctx.fillStyle = dept.color;
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(dept.name.toUpperCase(), 120, 34);
  ctx.textAlign = 'left';

  // Plants
  ctx.fillStyle = '#2a6a2a';
  ctx.fillRect(20, 40, 8, 12);
  ctx.fillRect(212, 40, 8, 12);

  // Bookshelf
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(16, 48, 8, 40);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(18, 50, 4, 6);
  ctx.fillRect(18, 58, 4, 6);
  ctx.fillRect(18, 66, 4, 6);
  ctx.fillRect(18, 74, 4, 6);

  // Door at bottom (exit)
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(104, 448, 32, 16);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(106, 450, 28, 12);
}

function drawPixelPerson(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  // Head
  ctx.fillStyle = '#f0c0a0';
  ctx.fillRect(x + 4, y, 8, 8);
  // Hair
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x + 4, y, 8, 3);
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 8, 12, 16);
  // Arms
  ctx.fillStyle = '#f0c0a0';
  ctx.fillRect(x, y + 10, 2, 10);
  ctx.fillRect(x + 14, y + 10, 2, 10);
  // Legs
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x + 4, y + 24, 4, 8);
  ctx.fillRect(x + 10, y + 24, 4, 8);
}

function cleanup(): void {
  if (chatWs) {
    try { chatWs.close(); } catch {}
    chatWs = null;
  }
  if (voiceController) {
    voiceController.destroy();
    voiceController = null;
  }
  chatMessages = [];
  currentSessionKey = null;
  isWaitingForResponse = false;
}

// --- Integration panels ---

async function loadOpenProjectTasks(): Promise<void> {
  const panel = document.getElementById('tasks-panel');
  if (!panel) return;
  panel.innerHTML = '<p class="loading">Loading tasks...</p>';
  try {
    const api = await import('./api');
    const result = await api.openproject.getWorkPackages();
    const workPackages = result._embedded?.elements || result.elements || [];
    if (workPackages.length === 0) {
      panel.innerHTML = '<p class="empty-state">No tasks found. Configure OpenProject in Settings.</p>';
      return;
    }
    panel.innerHTML = workPackages.slice(0, 50).map((wp: any) => {
      const subject = wp.subject || 'Untitled';
      const type = wp._type || wp.type || 'Task';
      const status = wp._links?.status?.title || wp.status || 'Unknown';
      const assignee = wp._links?.assignee?.title || 'Unassigned';
      const id = wp.id || '';
      return `
        <div class="task-item">
          <div class="task-header">
            <span class="task-type">${escapeHtml(type)}</span>
            <span class="task-id">#${id}</span>
            <span class="task-status">${escapeHtml(status)}</span>
          </div>
          <div class="task-subject">${escapeHtml(subject)}</div>
          <div class="task-assignee">Assigned: ${escapeHtml(assignee)}</div>
        </div>
      `;
    }).join('');
  } catch (err: any) {
    panel.innerHTML = `<p class="error-state">⚠ ${escapeHtml(err.message || 'Failed to load tasks')}</p>`;
  }
}

async function loadSuiteCRMContacts(): Promise<void> {
  const panel = document.getElementById('contacts-panel');
  if (!panel) return;
  panel.innerHTML = '<p class="loading">Loading contacts...</p>';
  try {
    const api = await import('./api');
    const result = await api.suitecrm.getContacts();
    const contacts = result.data || result._embedded?.elements || result.elements || [];
    if (contacts.length === 0) {
      panel.innerHTML = '<p class="empty-state">No contacts found. Configure SuiteCRM in Settings.</p>';
      return;
    }
    panel.innerHTML = contacts.slice(0, 50).map((c: any) => {
      const name = c.attributes?.name || c.attributes?.first_name + ' ' + c.attributes?.last_name || c.name || 'Unknown';
      const email = c.attributes?.email1 || c.attributes?.email || c.email || 'No email';
      const phone = c.attributes?.phone_work || c.attributes?.phone || c.phone || 'No phone';
      const title = c.attributes?.title || c.title || '';
      return `
        <div class="contact-item">
          <div class="contact-name">${escapeHtml(name)}</div>
          ${title ? `<div class="contact-title">${escapeHtml(title)}</div>` : ''}
          <div class="contact-email">✉ ${escapeHtml(email)}</div>
          <div class="contact-phone">☎ ${escapeHtml(phone)}</div>
        </div>
      `;
    }).join('');
  } catch (err: any) {
    panel.innerHTML = `<p class="error-state">⚠ ${escapeHtml(err.message || 'Failed to load contacts')}</p>`;
  }
}