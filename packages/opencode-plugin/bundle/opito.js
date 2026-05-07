// dist/opito/logger.js
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname } from "path";
var LOG_DIR = dirname(getLogPath());
var LOG_FILE = getLogPath();
function getLogPath() {
  return `${homedir()}/.config/opencode/opito-plugin.log`;
}
function ensureLogFile() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  if (!existsSync(LOG_FILE)) {
    writeFileSync(LOG_FILE, "");
  }
}
function serializeError(err) {
  if (err instanceof Error) {
    return { message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}
function write(entry) {
  ensureLogFile();
  const line = JSON.stringify(entry) + "\n";
  appendFileSync(LOG_FILE, line);
}
var logger = {
  debug: (event, data) => write({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), level: "debug", event, data }),
  info: (event, data) => write({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), level: "info", event, data }),
  warn: (event, data) => write({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), level: "warn", event, data }),
  error: (event, err, data) => write({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: "error",
    event,
    data,
    error: serializeError(err)
  }),
  getLogPath: () => LOG_FILE
};

// dist/opito/context.js
import { AsyncLocalStorage } from "async_hooks";
var Context;
(function(Context2) {
  class NotFound extends Error {
    name;
    constructor(name) {
      super(`No context found for ${name}`);
      this.name = name;
    }
  }
  Context2.NotFound = NotFound;
  function create(name) {
    const storage = new AsyncLocalStorage();
    return {
      use() {
        const result = storage.getStore();
        if (!result) {
          throw new NotFound(name);
        }
        return result;
      },
      provide(value, fn) {
        return storage.run(value, fn);
      }
    };
  }
  Context2.create = create;
})(Context || (Context = {}));
var RequestContext;
(function(RequestContext2) {
  const context = Context.create("RequestContext");
  function get() {
    return context.use();
  }
  RequestContext2.get = get;
  function set(value, fn) {
    return context.provide(value, fn);
  }
  RequestContext2.set = set;
  function plugin2() {
    return get().plugin;
  }
  RequestContext2.plugin = plugin2;
})(RequestContext || (RequestContext = {}));

// dist/opito/state.js
function createState(store2) {
  return {
    createSessionStore(storeName) {
      return {
        get(sessionID) {
          if (!sessionID)
            return [];
          return Array.from(store2.sessions.get(sessionID)?.get(storeName)?.values() ?? []);
        },
        getOne(sessionID, id) {
          if (!sessionID)
            return void 0;
          return store2.sessions.get(sessionID)?.get(storeName)?.get(id);
        },
        set(sessionID, id, value) {
          const session = store2.sessions.get(sessionID) ?? /* @__PURE__ */ new Map();
          const namedStore = session.get(storeName) ?? /* @__PURE__ */ new Map();
          namedStore.set(id, value);
          session.set(storeName, namedStore);
          store2.sessions.set(sessionID, session);
        },
        update(sessionID, id, updater) {
          if (!sessionID)
            return;
          const current = this.getOne(sessionID, id);
          if (!current)
            return;
          this.set(sessionID, id, updater(current));
        },
        remove(sessionID, id) {
          if (!sessionID)
            return;
          store2.sessions.get(sessionID)?.get(storeName)?.delete(id);
        },
        clear(sessionID) {
          if (!sessionID)
            return;
          store2.sessions.get(sessionID)?.delete(storeName);
        }
      };
    }
  };
}

// dist/opito/index.js
var Opito;
(function(Opito2) {
  Opito2.store = {
    sessions: /* @__PURE__ */ new Map()
  };
  Opito2.state = createState(Opito2.store);
})(Opito || (Opito = {}));

// dist/system-prompt-injection/store.js
var store = Opito.state.createSessionStore("system-prompt-injection");
var SystemPromptInjectionStore;
(function(SystemPromptInjectionStore2) {
  function activate(sessionID, record) {
    if (!sessionID)
      return;
    const existing = store.getOne(sessionID, record.id);
    if (existing?.status === "applied" || existing?.status === "active") {
      return;
    }
    store.set(sessionID, record.id, {
      ...record,
      status: "active",
      detectedAt: Date.now()
    });
  }
  SystemPromptInjectionStore2.activate = activate;
  function active(sessionID) {
    return store.get(sessionID).filter((record) => record.status === "active" || record.status === "applied").sort((a, b) => a.priority - b.priority);
  }
  SystemPromptInjectionStore2.active = active;
  function markApplied(sessionID, id) {
    store.update(sessionID, id, (record) => ({
      ...record,
      status: "applied",
      appliedAt: record.appliedAt ?? Date.now()
    }));
  }
  SystemPromptInjectionStore2.markApplied = markApplied;
  function wasApplied(sessionID, id) {
    return store.getOne(sessionID, id)?.status === "applied";
  }
  SystemPromptInjectionStore2.wasApplied = wasApplied;
  function disable(sessionID, id) {
    store.update(sessionID, id, (record) => ({
      ...record,
      status: "disabled",
      disabledAt: Date.now()
    }));
  }
  SystemPromptInjectionStore2.disable = disable;
})(SystemPromptInjectionStore || (SystemPromptInjectionStore = {}));

// dist/system-prompt-injection/injections/explore.js
var exploreInjection = {
  id: "explore",
  version: 1,
  trigger: /(^|\s)(\/explore|EXPLORE:?)(?=\s|$)/,
  priority: 100,
  createPrompt: () => `
EXPLORE mode is active for this user request. You must run an investigation phase before answering or implementing.

During the investigation phase:
- Parse the user's request and identify the unknowns that must be resolved.
- Partition the investigation into focused OpenCode tasks.
- Decide which tasks can run in parallel and which tasks must run sequentially because they depend on earlier findings.
- Use OpenCode task/subagent execution for independent codebase investigation when available, especially the explore subagent.
- Summarize the task findings, dependencies, and recommended execution order before proceeding.
`.trim()
};

// dist/system-prompt-injection/injections/index.js
var systemPromptInjections = [exploreInjection];

// dist/system-prompt-injection/mapper.js
var TAG_NAME = "opito-context-injection";
function createMarker(definition) {
  return `${TAG_NAME} id="${definition.id}" version="${definition.version}"`;
}
function textForMatching(input) {
  const partText = input.parts.filter((part) => part.type === "text" && "text" in part && typeof part.text === "string").map((part) => part.text).join("\n");
  return partText;
}
function matches(definition, text) {
  definition.trigger.lastIndex = 0;
  return definition.trigger.test(text);
}
function mapInjections(input) {
  const text = textForMatching(input);
  if (!text.trim())
    return [];
  return systemPromptInjections.filter((definition) => matches(definition, text)).map((definition) => ({
    id: definition.id,
    version: definition.version,
    marker: createMarker(definition),
    prompt: definition.createPrompt(input),
    priority: definition.priority
  })).filter((applied) => !input.message.system?.includes(applied.marker)).sort((left, right) => left.priority - right.priority);
}

// dist/system-prompt-injection/renderer.js
var TAG_NAME2 = "opito-context-injection";
function renderAppliedInjection(applied) {
  return `<${applied.marker}>
${applied.prompt}
</${TAG_NAME2}>`;
}
function appendAppliedToSystem(system, appliedInjections) {
  const nextSystem = [...system];
  const inserted = [];
  for (const applied of appliedInjections) {
    if (nextSystem.some((section) => section.includes(applied.marker)))
      continue;
    nextSystem.push(renderAppliedInjection(applied));
    inserted.push(applied);
  }
  return {
    system: nextSystem,
    inserted
  };
}

// dist/system-prompt-injection/index.js
var SystemPromptInjection;
(function(SystemPromptInjection2) {
  function interceptMessage(input, output) {
    const applied = mapInjections({
      sessionID: input.sessionID,
      agent: input.agent,
      model: input.model,
      message: output.message,
      parts: output.parts
    });
    if (applied.length === 0)
      return [];
    for (const injection of applied) {
      SystemPromptInjectionStore.activate(input.sessionID, {
        id: injection.id,
        version: injection.version,
        marker: injection.marker,
        prompt: injection.prompt,
        priority: injection.priority,
        status: "active",
        detectedAt: Date.now()
      });
    }
    return applied;
  }
  SystemPromptInjection2.interceptMessage = interceptMessage;
  async function transformSystemPrompt(input, output) {
    const active = SystemPromptInjectionStore.active(input.sessionID);
    if (active.length === 0)
      return [];
    const appliedInjections = active.map((record) => ({
      id: record.id,
      version: record.version,
      marker: record.marker,
      prompt: record.prompt,
      priority: record.priority
    }));
    const result = appendAppliedToSystem(output.system, appliedInjections);
    if (result.inserted.length === 0)
      return [];
    output.system.splice(0, output.system.length, ...result.system);
    for (const injection of result.inserted) {
      SystemPromptInjectionStore.markApplied(input.sessionID, injection.id);
    }
    await notifyApplied(result.inserted);
    return result.inserted;
  }
  SystemPromptInjection2.transformSystemPrompt = transformSystemPrompt;
  async function notifyApplied(applied) {
    try {
      const plugin2 = RequestContext.plugin();
      await plugin2.client.tui.showToast({
        query: {
          directory: plugin2.directory
        },
        body: {
          title: "Opito",
          message: `System prompt injection applied: ${applied.map((injection) => injection.id).join(", ")}`,
          variant: "success",
          duration: 2500
        }
      });
    } catch {
    }
  }
})(SystemPromptInjection || (SystemPromptInjection = {}));

// dist/index.js
var plugin = async (ctx) => {
  console.log(`[opito] Plugin cargado. Logs: ${logger.getLogPath()}`);
  logger.info("plugin.loaded", {
    directory: ctx.directory,
    worktree: ctx.worktree,
    serverUrl: ctx.serverUrl?.toString()
  });
  const showToast = async (title, message, variant = "info", strategy = "default") => {
    logger.info("toast.attempt", { title, message, variant, strategy });
    try {
      await ctx.client.tui.showToast({
        body: {
          title,
          message,
          variant,
          duration: 3e3
        }
      });
      logger.info("toast.success", { title, strategy });
    } catch (err) {
      logger.error("toast.failed", err, { title, strategy });
    }
  };
  setTimeout(() => {
    void showToast("Opito", "Plugin activo!", "success", "delayed-2s");
  }, 2e3);
  return {
    event: async ({ event }) => {
      if (event.type === "server.connected" || event.type === "session.created" || event.type === "session.idle" || event.type === "tui.toast.show") {
        logger.info("event.received", { type: event.type });
      }
      if (event.type === "server.connected") {
        logger.info("server.connected", { directory: ctx.directory });
        await showToast("Opito", "Servidor conectado", "success", "server.connected");
      }
      if (event.type === "session.created") {
        logger.info("session.created");
        await showToast("Opito", "Nueva sesi\xF3n", "info", "session.created");
      }
      if (event.type === "session.idle") {
        logger.info("session.idle");
      }
    },
    "chat.message": async (input, output) => {
      logger.debug("chat.message", {
        sessionID: input.sessionID
      });
      RequestContext.set({ plugin: ctx }, () => {
        SystemPromptInjection.interceptMessage(input, output);
      });
    },
    "experimental.chat.system.transform": async (input, output) => {
      logger.debug("chat.system.transform", {
        sessionID: input.sessionID,
        systemLength: output.system.length
      });
      await RequestContext.set({ plugin: ctx }, () => {
        return SystemPromptInjection.transformSystemPrompt(input, output);
      });
    }
  };
};
var index_default = plugin;
export {
  Context,
  Opito,
  RequestContext,
  SystemPromptInjection,
  index_default as default,
  plugin
};
