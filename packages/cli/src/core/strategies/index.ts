/**
 * Strategy module barrel exports
 */
export type { IProviderStrategy, ProviderStrategyConfig } from './base-strategy.js';
export { ProviderCapabilityError, isProviderStrategy } from './base-strategy.js';
export type { FeatureType, ProviderCapabilities } from './capabilities.js';
export {
  PROVIDER_CAPABILITIES,
  supportsFeature,
  getSupportedFeatures,
} from './capabilities.js';
export {
  strategyRegistry,
  isValidStrategy,
  getStrategyDisplayName,
} from './registry.js';
export { StrategyRegistry } from './registry.js';
