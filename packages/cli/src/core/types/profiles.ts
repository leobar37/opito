/**
 * Types for OPITO profiles and configuration
 */

export type ProviderType = 'glm' | 'kimi' | 'minimax' | 'custom';
export type CliType = 'claude' | 'droid';

export interface ProfileModel {
  baseUrl: string;
  model: string;
  providerType?: 'anthropic' | 'openai' | 'generic-chat-completion-api';
}

export interface Profile {
  id: string;
  provider: ProviderType;
  displayName: string;
  apiKey: string;
  models: {
    claude?: ProfileModel;
    droid?: ProfileModel;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OpitoConfig {
  version: string;
  defaultProfile?: string;
  profilesPath: string;
}

export interface ClaudeSettings {
  anthropicBaseUrl?: string;
  apiKey?: string;
  model?: string;
  [key: string]: unknown;
}

export interface DroidCustomModel {
  model: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  provider: 'anthropic' | 'openai' | 'generic-chat-completion-api';
  maxOutputTokens?: number;
}

export interface DroidSettings {
  model?: string;
  customModels?: DroidCustomModel[];
  [key: string]: unknown;
}
