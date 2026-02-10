import type { Plugin } from './base';

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
