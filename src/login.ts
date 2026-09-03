/**
 * Login view — JWT-based authentication screen.
 */

export function renderLogin(container: HTMLElement): void {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-logo">🏢</div>
        <h1>OpenClaw Office</h1>
        <p class="login-subtitle">Sign in to enter the pixel office</p>
        <form id="login-form">
          <div class="login-field">
            <label for="login-username">Username</label>
            <input id="login-username" type="text" autocomplete="username" required placeholder="admin" />
          </div>
          <div class="login-field">
            <label for="login-password">Password</label>
            <input id="login-password" type="password" autocomplete="current-password" required placeholder="••••••••" />
          </div>
          <button type="submit" id="login-submit">Enter Office →</button>
          <div id="login-error" class="login-error"></div>
        </form>
        <p class="login-hint">Default credentials: admin / openclaw2026</p>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form') as HTMLFormElement;
  const errorEl = document.getElementById('login-error') as HTMLDivElement;
  const submitBtn = document.getElementById('login-submit') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connecting...';

    const username = (document.getElementById('login-username') as HTMLInputElement).value;
    const password = (document.getElementById('login-password') as HTMLInputElement).value;

    try {
      const api = await import('./api');
      const result = await api.auth.login(username, password);
      window.dispatchEvent(new CustomEvent('office:login', { detail: result }));
    } catch (err: any) {
      errorEl.textContent = err.message || 'Login failed';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enter Office →';
    }
  });
}