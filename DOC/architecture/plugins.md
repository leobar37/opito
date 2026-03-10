# Plugin System

OPITO's extensibility mechanism.

## Overview

The plugin system allows extending OPITO with custom functionality. It's designed to be:

- **Simple** - Minimal interface
- **Non-intrusive** - Core works without plugins
- **Event-driven** - Hooks at key lifecycle points
- **Optional** - No plugins required

## Plugin Interface

```typescript
interface Plugin {
  // Plugin metadata
  name: string;
  version: string;
  
  // Optional lifecycle hooks
  beforeSync?(options: SyncOptions): Promise<void>;
  afterSync?(report: SyncReport): Promise<void>;
  beforeParse?(provider: Provider): Promise<void>;
  afterParse?(commands: CommandConfig[]): Promise<CommandConfig[]>;
  beforeWrite?(command: CommandConfig): Promise<CommandConfig>;
  afterWrite?(command: CommandConfig): Promise<void>;
}
```

## Plugin Registry

Singleton registry for managing plugins:

```typescript
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
  
  // Execute hook on all plugins
  async executeHook(
    hookName: keyof Plugin,
    ...args: unknown[]
  ): Promise<void> {
    for (const plugin of this.getAll()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        await hook.apply(plugin, args);
      }
    }
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
```

## Creating a Plugin

### Basic Plugin

```typescript
import { Plugin } from 'opito/plugins';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async beforeSync(options) {
    console.log('About to sync with options:', options);
  },
  
  async afterSync(report) {
    console.log('Sync completed:', report);
  }
};

// Register
pluginRegistry.register(myPlugin);
```

### Advanced Plugin

```typescript
const advancedPlugin: Plugin = {
  name: 'command-logger',
  version: '2.0.0',
  
  async beforeParse(provider) {
    this.startTime = Date.now();
    console.log(`Parsing ${provider} commands...`);
  },
  
  async afterParse(commands) {
    const duration = Date.now() - this.startTime;
    console.log(`Parsed ${commands.length} commands in ${duration}ms`);
    return commands;
  },
  
  async beforeWrite(command) {
    // Add metadata
    return {
      ...command,
      frontmatter: {
        ...command.frontmatter,
        lastModified: new Date().toISOString()
      }
    };
  }
};
```

## Lifecycle Hooks

### beforeSync

Called before sync operation begins:

```typescript
async beforeSync(options: SyncOptions): Promise<void> {
  // Validate options
  if (!options.filter) {
    console.warn('No filter specified, syncing all commands');
  }
  
  // Log to external service
  await analytics.track('sync.started', options);
}
```

### afterSync

Called after sync operation completes:

```typescript
async afterSync(report: SyncReport): Promise<void> {
  // Send notification
  if (report.errors > 0) {
    await notify(`Sync completed with ${report.errors} errors`);
  }
  
  // Log metrics
  await metrics.gauge('sync.commands.total', report.total);
  await metrics.gauge('sync.commands.created', report.created);
}
```

### beforeParse

Called before parsing commands:

```typescript
async beforeParse(provider: Provider): Promise<void> {
  // Warm up cache
  await cache.prefetch(`${provider}:commands`);
}
```

### afterParse

Called after parsing, can modify commands:

```typescript
async afterParse(
  commands: CommandConfig[]
): Promise<CommandConfig[]> {
  // Add tags based on content
  return commands.map(cmd => ({
    ...cmd,
    frontmatter: {
      ...cmd.frontmatter,
      tags: this.extractTags(cmd.content)
    }
  }));
}
```

### beforeWrite

Called before writing command, can modify:

```typescript
async beforeWrite(
  command: CommandConfig
): Promise<CommandConfig> {
  // Add version info
  return {
    ...command,
    frontmatter: {
      ...command.frontmatter,
      version: '1.0.0',
      syncedAt: new Date().toISOString()
    }
  };
}
```

### afterWrite

Called after writing command:

```typescript
async afterWrite(command: CommandConfig): Promise<void> {
  // Update index
  await searchIndex.add({
    name: command.name,
    description: command.description,
    content: command.content.slice(0, 500)
  });
}
```

## Example Plugins

### Validation Plugin

```typescript
const validationPlugin: Plugin = {
  name: 'validator',
  version: '1.0.0',
  
  async afterParse(commands) {
    for (const cmd of commands) {
      if (!cmd.description) {
        throw new Error(`Command ${cmd.name} missing description`);
      }
      if (cmd.content.length < 50) {
        console.warn(`Command ${cmd.name} has very short content`);
      }
    }
    return commands;
  }
};
```

### Logging Plugin

```typescript
const loggingPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  
  async beforeSync(options) {
    console.log(`[${new Date().toISOString()}] Sync starting...`);
    console.log('Options:', JSON.stringify(options, null, 2));
  },
  
  async afterSync(report) {
    console.log(`[${new Date().toISOString()}] Sync completed`);
    console.log('Report:', JSON.stringify(report, null, 2));
  }
};
```

### Metrics Plugin

```typescript
const metricsPlugin: Plugin = {
  name: 'metrics',
  version: '1.0.0',
  
  async afterSync(report) {
    // Send to StatsD
    statsd.increment('opito.sync.completed');
    statsd.gauge('opito.sync.commands_total', report.total);
    statsd.gauge('opito.sync.commands_created', report.created);
    statsd.gauge('opito.sync.commands_updated', report.updated);
    statsd.gauge('opito.sync.errors', report.errors);
  }
};
```

## Loading Plugins

### Auto-Discovery (Future)

```typescript
// Load from npm packages
const plugins = await discoverPlugins('opito-plugin-*');
for (const plugin of plugins) {
  pluginRegistry.register(plugin);
}
```

### Configuration-Based

```json
// ~/.config/opito/config.json
{
  "plugins": [
    "opito-plugin-logger",
    "opito-plugin-metrics",
    "./custom-plugin.js"
  ]
}
```

### Manual Loading

```typescript
// In your initialization code
import { myPlugin } from './my-plugin';
import { pluginRegistry } from 'opito/plugins';

pluginRegistry.register(myPlugin);
```

## Plugin Configuration

Plugins can accept configuration:

```typescript
interface ConfigurablePlugin extends Plugin {
  configure(config: Record<string, unknown>): void;
}

const configurablePlugin: ConfigurablePlugin = {
  name: 'configurable',
  version: '1.0.0',
  
  configure(config) {
    this.webhookUrl = config.webhookUrl;
    this.apiKey = config.apiKey;
  },
  
  async afterSync(report) {
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(report)
    });
  }
};

// Usage
configurablePlugin.configure({
  webhookUrl: 'https://hooks.slack.com/...',
  apiKey: process.env.SLACK_API_KEY
});
pluginRegistry.register(configurablePlugin);
```

## Best Practices

1. **Handle errors gracefully** - Don't break sync on plugin error
2. **Keep hooks fast** - Don't block sync operation
3. **Document dependencies** - List required config/env vars
4. **Use semantic versioning** - Follow semver
5. **Test independently** - Plugins should be unit testable
6. **Provide defaults** - Work without configuration

## Current State

The plugin system exists in the codebase but is **not actively used** by core commands. It's ready for:

- Community plugins
- Enterprise extensions
- Custom workflows
- Third-party integrations

To use plugins:

1. Create a plugin implementing the `Plugin` interface
2. Register it with `pluginRegistry.register()`
3. Hooks will be called automatically during sync

## Future Enhancements

- [ ] NPM plugin discovery
- [ ] Configuration-based loading
- [ ] Plugin marketplace
- [ ] Hook priorities
- [ ] Async plugin loading
- [ ] Plugin sandboxing

## See Also

- [Architecture Overview](./README.md) - System design
- [Base Plugin Interface](../architecture/plugins.md)
