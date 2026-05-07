/**
 * Feature types supported by provider strategies
 */
export type FeatureType = 'commands' | 'skills' | 'agents';

/**
 * Capabilities flags for each provider strategy
 * Each provider declares which features it supports
 */
export interface ProviderCapabilities {
  commands: boolean;
  skills: boolean;
  agents: boolean;
}

/**
 * Common capability configurations for known providers
 */
export const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilities> = {
  claude: { commands: true, skills: true, agents: true },
  opencode: { commands: true, skills: true, agents: true },
  droid: { commands: true, skills: true, agents: true },
  codex: { commands: false, skills: true, agents: false },
};

/**
 * Check if a provider supports a specific feature
 */
export function supportsFeature(
  capabilities: ProviderCapabilities,
  feature: FeatureType
): boolean {
  return capabilities[feature];
}

/**
 * Get list of supported features for a provider
 */
export function getSupportedFeatures(capabilities: ProviderCapabilities): FeatureType[] {
  const features: FeatureType[] = [];
  if (capabilities.commands) features.push('commands');
  if (capabilities.skills) features.push('skills');
  if (capabilities.agents) features.push('agents');
  return features;
}
