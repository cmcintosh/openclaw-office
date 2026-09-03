/**
 * Shared types for OpenClaw Office
 */

export interface Department {
  id: string;
  name: string;
  executiveAgentId: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
}

export interface OpenClawSession {
  key: string;
  kind?: string;
  channel?: string;
  active: boolean;
  label?: string;
  updatedAt?: number | null;
  lastMessage?: string;
  model?: string;
}