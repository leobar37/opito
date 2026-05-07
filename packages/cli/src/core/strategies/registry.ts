/**
 * Strategy Registry
 * 
 * Central registry for all provider strategies. Built-in providers are
 * registered at startup. External providers can be loaded dynamically
 * via the plugin system.
 * 
 * Usage:
 *   import { strategyRegistry } from '@opito/core';
 *   
 *   // Register a built-in provider
 *   strategyRegistry.register(new ClaudeStrategy());
 *   
 *   // Get a provider
 *   const claude = strategyRegistry.get('claude');
 *   
 *   // Get all providers supporting a feature
 *   const skillProviders = strategyRegistry.getSupporting('skills');
 */
import type { IProviderStrategy } from './base-strategy.js';
import type { FeatureType } from './capabilities.js';

export class StrategyRegistry {
  private strategies = new Map<string, IProviderStrategy>();

  /**
   * Register a provider strategy
   */
  register(strategy: IProviderStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * Unregister a provider strategy
   */
  unregister(name: string): void {
    this.strategies.delete(name);
  }

  /**
   * Get a strategy by name
   */
  get(name: string): IProviderStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * Get all registered strategies
   */
  getAll(): IProviderStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get all strategy names
   */
  getNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get strategies that support a specific feature
   */
  getSupporting(feature: FeatureType): IProviderStrategy[] {
    return this.getAll().filter((s) => s.capabilities[feature]);
  }

  /**
   * Check if a strategy is registered
   */
  has(name: string): boolean {
    return this.strategies.has(name);
  }

  /**
   * Check if a strategy supports a feature
   */
  supports(name: string, feature: FeatureType): boolean {
    const strategy = this.get(name);
    return strategy ? strategy.capabilities[feature] : false;
  }

  /**
   * Get display names of all registered strategies
   */
  getDisplayNames(): Array<{ name: string; displayName: string }> {
    return this.getAll().map((s) => ({
      name: s.name,
      displayName: s.displayName,
    }));
  }

  /**
   * Initialize all registered strategies with their configs
   */
  async initializeAll(
    configs: Record<string, Record<string, unknown>>
  ): Promise<void> {
    for (const [name, strategy] of this.strategies) {
      const config = configs[name];
      if (config) {
        await strategy.initialize({ basePath: '', ...config });
      }
    }
  }
}

/**
 * Global strategy registry instance
 */
export const strategyRegistry = new StrategyRegistry();

/**
 * Helper to check if a provider name is valid (registered)
 */
export function isValidStrategy(name: string): boolean {
  return strategyRegistry.has(name);
}

/**
 * Helper to get display name for a provider
 */
export function getStrategyDisplayName(name: string): string {
  return strategyRegistry.get(name)?.displayName || name;
}
