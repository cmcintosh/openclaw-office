/**
 * JSON file-based store for departments, users, and third-party API configs.
 * Thread-safe via synchronous writes. Suitable for single-server deployment.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.dbPath = path.join(dataDir, 'office.json');
    fs.mkdirSync(dataDir, { recursive: true });
    this._load();
    this._ensureDefaults();
  }

  _load() {
    try {
      this.data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
    } catch {
      this.data = {};
    }
    if (!this.data.users) this.data.users = {};
    if (!this.data.departments) this.data.departments = [];
    if (!this.data.openProject) this.data.openProject = { url: '', apiKey: '' };
    if (!this.data.suiteCRM) this.data.suiteCRM = { url: '', apiKey: '' };
  }

  _save() {
    const tmp = this.dbPath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.dbPath);
  }

  _ensureDefaults() {
    // Create default admin user if no users exist
    if (Object.keys(this.data.users).length === 0) {
      const { hashPassword } = require('./auth');
      this.data.users['admin'] = {
        username: 'admin',
        passwordHash: hashPassword('openclaw2026'),
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      this._save();
      console.log('[Store] Created default admin user (password: openclaw2026)');
    }
  }

  // --- Users ---
  getUser(username) {
    return this.data.users[username] || null;
  }

  updateUser(username, updates) {
    if (!this.data.users[username]) return null;
    Object.assign(this.data.users[username], updates);
    this._save();
    return this.data.users[username];
  }

  // --- Departments ---
  getDepartments() {
    return this.data.departments;
  }

  addDepartment({ name, executiveAgentId, description, color }) {
    const dept = {
      id: crypto.randomUUID(),
      name,
      executiveAgentId,
      description: description || '',
      color: color || '#4a90d9',
      createdAt: new Date().toISOString(),
    };
    this.data.departments.push(dept);
    this._save();
    return dept;
  }

  updateDepartment(id, updates) {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    // Whitelist updatable fields
    const allowed = ['name', 'executiveAgentId', 'description', 'color'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        this.data.departments[idx][key] = updates[key];
      }
    }
    this._save();
    return this.data.departments[idx];
  }

  deleteDepartment(id) {
    const idx = this.data.departments.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.data.departments.splice(idx, 1);
    this._save();
    return true;
  }

  // --- OpenProject config ---
  getOpenProjectConfig() {
    return this.data.openProject;
  }

  setOpenProjectConfig({ url, apiKey }) {
    if (url !== undefined) this.data.openProject.url = url;
    if (apiKey !== undefined) this.data.openProject.apiKey = apiKey;
    this._save();
  }

  // --- SuiteCRM config ---
  getSuiteCRMConfig() {
    return this.data.suiteCRM;
  }

  setSuiteCRMConfig({ url, apiKey }) {
    if (url !== undefined) this.data.suiteCRM.url = url;
    if (apiKey !== undefined) this.data.suiteCRM.apiKey = apiKey;
    this._save();
  }
}

module.exports = { Store };