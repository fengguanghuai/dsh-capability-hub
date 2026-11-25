import { AsyncLocalStorage } from 'node:async_hooks';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const name = 'capability-hub';

const API_ROUTE_PATH = '/api/capability-hub';
const MCP_TOOL_RE = /^mcp__([A-Za-z0-9_-]{1,32})__(.+)$/;
const SERVER_NAME_RE = /^[A-Za-z0-9_-]{1,32}$/;
const SKILL_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTEXT_BUDGET_CHARS = 8000;

function defaultStatePath() {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
  return join(dshHome, 'capability-hub', 'state.json');
}

function emptyState() {
  return {
    version: 1,
    seeded: false,
    bundles: [],
    skillModes: {},
    disabledServers: {},
    disabledTools: {},
    customServers: {},
    sessionOverrides: {},
  };
}

function loadState(filePath) {
  try {
    if (!existsSync(filePath)) return emptyState();
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return emptyState();
    const rawOverrides = raw.sessionOverrides && typeof raw.sessionOverrides === 'object' ? raw.sessionOverrides : {};
    const sessionOverrides = {};
    for (const [sid, list] of Object.entries(rawOverrides)) {
      if (Array.isArray(list)) {
        sessionOverrides[sid] = [...new Set(list.map(String).filter(Boolean))];
      }
    }
    return {
      version: 1,
      seeded: raw.seeded === true,
      bundles: Array.isArray(raw.bundles) ? raw.bundles : [],
      skillModes: raw.skillModes && typeof raw.skillModes === 'object' ? { ...raw.skillModes } : {},
      disabledServers: raw.disabledServers && typeof raw.disabledServers === 'object' ? { ...raw.disabledServers } : {},
      disabledTools: raw.disabledTools && typeof raw.disabledTools === 'object' ? { ...raw.disabledTools } : {},
      customServers: raw.customServers && typeof raw.customServers === 'object' ? { ...raw.customServers } : {},
      sessionOverrides,
    };
  } catch {
    return emptyState();
  }
}

function saveState(filePath, state) {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, filePath);
}

/**
 * Return an empty initial bundle list on first run so the plugin starts completely generic
 * with no preset personal groupings and never hides any active tools or skills.
 */
export function seedDefaultBundles() {
  return [];
}

/**
 * Resolve effective bundle activation for either global default view or a specific session.
 */
export function resolveEffectiveBundles(state, sessionId, resolveParentSessionId) {
  const rawBundles = Array.isArray(state.bundles) ? state.bundles : [];
  const overrides = state.sessionOverrides && typeof state.sessionOverrides === 'object' ? state.sessionOverrides : {};

  let overrideList = null;
  let overridden = false;
  if (sessionId) {
    const seen = new Set();
    let cur = sessionId;
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      if (Object.hasOwn(overrides, cur) && Array.isArray(overrides[cur])) {
        overrideList = overrides[cur];
        overridden = cur === sessionId;
        break;
      }
      cur = typeof resolveParentSessionId === 'function' ? resolveParentSessionId(cur) : undefined;
    }
  }

  const overrideSet = overrideList ? new Set(overrideList) : null;
  const bundles = rawBundles.map(b => {
    const globallyEnabled = b.enabled !== false;
    const defaultInject = b.defaultInject !== false;
    const active = globallyEnabled && (overrideSet ? overrideSet.has(b.id) : defaultInject);
    return {
      ...b,
      enabled: active,
      globallyEnabled,
      defaultInject,
    };
  });

  return {
    bundles,
    overridden,
    activeBundleIds: bundles.filter(b => b.enabled).map(b => b.id),
  };
}

/**
 * Pure policy evaluation shared by runtime enforcement, UI state, and tests.
 */
export function computeEffectivePolicy(state, allMcpToolsByServer, underlyingSkills, options = {}) {
  const { bundles, overridden, activeBundleIds } = resolveEffectiveBundles(
    state,
    options.sessionId,
    options.resolveParentSessionId,
  );
  const serverBundles = new Map();
  const skillBundles = new Map();

  for (const b of bundles) {
    for (const m of b.mcps || []) {
      if (!serverBundles.has(m)) serverBundles.set(m, []);
      serverBundles.get(m).push(b);
    }
    for (const s of b.skills || []) {
      if (!skillBundles.has(s)) skillBundles.set(s, []);
      skillBundles.get(s).push(b);
    }
  }

  const mutedByBundleServer = new Set();
  for (const [srv, list] of serverBundles) {
    if (list.length > 0 && list.every(b => b.enabled === false)) {
      mutedByBundleServer.add(srv);
    }
  }

  const mutedByBundleSkill = new Set();
  for (const [sk, list] of skillBundles) {
    if (list.length > 0 && list.every(b => b.enabled === false)) {
      mutedByBundleSkill.add(sk);
    }
  }

  const deniedTools = new Set();
  const serverEffectiveEnabled = new Map();
  for (const [srv, toolNames] of Object.entries(allMcpToolsByServer)) {
    const manuallyOff = state.disabledServers?.[srv] === true;
    const bundleOff = mutedByBundleServer.has(srv);
    const srvEnabled = !manuallyOff && !bundleOff;
    serverEffectiveEnabled.set(srv, {
      enabled: srvEnabled,
      reason: manuallyOff ? 'manual' : bundleOff ? 'bundle' : 'active',
    });
    for (const fullTool of toolNames) {
      if (!srvEnabled || state.disabledTools?.[fullTool] === true) {
        deniedTools.add(fullTool);
      }
    }
  }

  const skillOverrides = new Map();
  for (const sk of underlyingSkills) {
    const configured = state.skillModes?.[sk.name] || 'default';
    const bundleOff = mutedByBundleSkill.has(sk.name);
    let effectiveMode;
    let reason = 'default';
    if (configured === 'muted') {
      effectiveMode = 'muted';
      reason = 'manual';
    } else if (configured === 'manual') {
      effectiveMode = bundleOff ? 'muted' : 'manual';
      reason = bundleOff ? 'bundle' : 'manual';
    } else if (configured === 'auto') {
      effectiveMode = bundleOff ? 'muted' : 'auto';
      reason = bundleOff ? 'bundle' : 'manual';
    } else if (bundleOff) {
      effectiveMode = 'muted';
      reason = 'bundle';
    } else {
      const m = sk.invocation?.modelInvocable !== false;
      const u = sk.invocation?.userInvocable !== false;
      effectiveMode = m ? 'auto' : u ? 'manual' : 'muted';
    }

    const desiredInvocation =
      effectiveMode === 'auto'
        ? { modelInvocable: true, userInvocable: true }
        : effectiveMode === 'manual'
          ? { modelInvocable: false, userInvocable: true }
          : { modelInvocable: false, userInvocable: false };

    const baseM = sk.invocation?.modelInvocable !== false;
    const baseU = sk.invocation?.userInvocable !== false;
    const changed = desiredInvocation.modelInvocable !== baseM || desiredInvocation.userInvocable !== baseU;
    skillOverrides.set(sk.name, {
      configuredMode: configured,
      effectiveMode,
      reason,
      changed,
      invocation: desiredInvocation,
      bundles: (skillBundles.get(sk.name) || []).map(b => ({ id: b.id, name: b.name, enabled: b.enabled })),
    });
  }

  return {
    deniedTools,
    serverEffectiveEnabled,
    serverBundles,
    skillOverrides,
    overridden,
    activeBundleIds,
  };
}

function scanPatchHints(cwd) {
  const hints = new Map();
  const dirs = [];
  if (process.env.DSH_PROFILE_DIR) {
    dirs.push(join(process.env.DSH_PROFILE_DIR, 'node_modules'));
  }
  if (cwd) {
    dirs.push(join(cwd, '.dsh-bundles'));
  }
  for (const root of dirs) {
    try {
      if (!existsSync(root)) continue;
      for (const entry of readdirSync(root)) {
        const sub = join(root, entry);
        const candidates = entry.startsWith('@') && existsSync(sub)
          ? readdirSync(sub).map(c => join(sub, c, 'cordis.patch.yml'))
          : [join(sub, 'cordis.patch.yml')];
        for (const patchFile of candidates) {
          if (!existsSync(patchFile)) continue;
          const txt = readFileSync(patchFile, 'utf8');
          if (!txt.includes('dsh-mcp-client')) continue;
          const srvMatch = /serverName:\s*['"]?([A-Za-z0-9_-]{1,32})['"]?/.exec(txt);
          if (!srvMatch) continue;
          const trMatch = /transport:\s*['"]?(stdio|streamable-http)['"]?/.exec(txt);
          const urlMatch = /url:\s*['"]?([^\s'"]+)['"]?/.exec(txt);
          const cmdMatch = /command:\s*['"]?([^\s'"]+)['"]?/.exec(txt);
          hints.set(srvMatch[1], {
            transport: trMatch?.[1] || (urlMatch ? 'streamable-http' : 'stdio'),
            url: urlMatch?.[1] || '',
            command: cmdMatch?.[1] || '',
            patchPath: patchFile,
          });
        }
      }
    } catch {
      // Ignore unreadable bundle directories
    }
  }
  return hints;
}

function classifySkillScope(source) {
  if (source === 'project-dsh' || source === 'project-agents') return 'project';
  if (source === 'user-dsh' || source === 'user-agents' || source === 'custom') return 'user';
  return 'system';
}

function formatMcpJsonSnippet(srv) {
  const entry = srv.transport === 'stdio'
    ? {
        transport: 'stdio',
        command: srv.command || 'npx',
        ...(srv.args?.length ? { args: srv.args } : {}),
        ...(srv.cwd ? { cwd: srv.cwd } : {}),
      }
    : {
        transport: 'streamable-http',
        url: srv.url || 'https://example.com/mcp',
      };
  return JSON.stringify({ mcpServers: { [srv.name]: entry } }, null, 2);
}

export function apply(ctx) {
  const statePath = defaultStatePath();
  let state = loadState(statePath);
  const bypassSkillPolicy = new AsyncLocalStorage();

  // Disposers owned by this plugin instance
  const agentRestrictionDisposers = new Map();
  const agentRestrictionKeys = new Map();
  const sessionSkillDisposers = new Map();
  const sessionSkillInvalidators = new Map();
  const customMcpDisposers = new Map();
  let invalidateSkillPolicy = () => {};
  let disposed = false;

  ctx.effect(() => () => {
    disposed = true;
    for (const off of agentRestrictionDisposers.values()) {
      try { off(); } catch {}
    }
    agentRestrictionDisposers.clear();
    for (const off of sessionSkillDisposers.values()) {
      try { off(); } catch {}
    }
    sessionSkillDisposers.clear();
    sessionSkillInvalidators.clear();
    for (const off of customMcpDisposers.values()) {
      try { off(); } catch {}
    }
    customMcpDisposers.clear();
  }, 'capability-hub: teardown');

  function resolveParentSessionId(sessionId) {
    if (!sessionId) return undefined;
    try {
      const sessionsSvc = ctx.get('sessions');
      const s = sessionsSvc && typeof sessionsSvc.get === 'function' ? sessionsSvc.get(sessionId) : undefined;
      return s?.header?.parentSession || s?.meta?.parentSession;
    } catch {
      return undefined;
    }
  }

  function resolveDefaultCwd() {
    try {
      const ws = ctx.get('workspaceRegistry');
      if (ws && typeof ws.list === 'function') {
        const items = ws.list();
        if (Array.isArray(items) && items.length > 0) {
          const p = items[0]?.path || items[0]?.root || items[0]?.cwd;
          if (typeof p === 'string' && p) return p;
        }
      }
    } catch {}
    try {
      const agents = ctx.get('agents');
      const wd = ctx.get('workingDirectory');
      if (agents && typeof agents.list === 'function') {
        const list = agents.list();
        for (let i = list.length - 1; i >= 0; i -= 1) {
          const ag = list[i];
          const sessionCwd = ag?.session?.meta?.cwd;
          if (typeof sessionCwd === 'string' && sessionCwd) return sessionCwd;
          if (wd && typeof wd.peek === 'function') {
            const peeked = wd.peek(ag);
            if (typeof peeked === 'string' && peeked) return peeked;
          }
        }
      }
    } catch {}
    return process.cwd();
  }

  function listWorkspaces() {
    const found = new Set();
    try {
      const agents = ctx.get('agents');
      if (agents && typeof agents.list === 'function') {
        for (const ag of agents.list()) {
          const c = ag?.session?.meta?.cwd;
          if (typeof c === 'string' && c) found.add(c);
        }
      }
    } catch {}
    const def = resolveDefaultCwd();
    if (def) found.add(def);
    return [...found];
  }

  function collectMcpToolsMap() {
    const toolsSvc = ctx.get('tools');
    const byServer = {};
    const detailsByServer = {};
    if (toolsSvc && typeof toolsSvc.definitions === 'function') {
      for (const def of toolsSvc.definitions()) {
        const m = MCP_TOOL_RE.exec(def.name);
        if (!m) continue;
        const [, srv, shortName] = m;
        if (!byServer[srv]) {
          byServer[srv] = [];
          detailsByServer[srv] = [];
        }
        byServer[srv].push(def.name);
        detailsByServer[srv].push({
          name: def.name,
          shortName,
          description: (def.description || '').replace(/^This is a tool from the [^\n]+\n?/i, '').trim(),
        });
      }
    }
    const mgr = ctx.get('mcpManager');
    if (mgr && typeof mgr.list === 'function') {
      for (const item of mgr.list()) {
        if (!byServer[item.name]) {
          byServer[item.name] = [];
          detailsByServer[item.name] = [];
        }
      }
    }
    for (const srv of Object.keys(state.customServers || {})) {
      if (!byServer[srv]) {
        byServer[srv] = [];
        detailsByServer[srv] = [];
      }
    }
    return { byServer, detailsByServer };
  }

  async function listUnderlyingSkills(cwd) {
    const skillsSvc = ctx.get('skills');
    if (!skillsSvc || typeof skillsSvc.list !== 'function') return [];
    try {
      return await bypassSkillPolicy.run(true, () => skillsSvc.list({ ...(cwd ? { cwd } : {}), scope: {} }));
    } catch {
      return [];
    }
  }

  async function ensureSeeded(cwd) {
    if (state.seeded) return;
    const { byServer } = collectMcpToolsMap();
    const rawSkills = await listUnderlyingSkills(cwd);
    const mcpNames = Object.keys(byServer);
    const skillNames = rawSkills.map(s => s.name);
    if (mcpNames.length === 0 && skillNames.length === 0) return;
    state.bundles = seedDefaultBundles(mcpNames, skillNames);
    state.seeded = true;
    saveState(statePath, state);
  }

  function computeCurrentDeniedGlobalTools(sessionId) {
    const toolsSvc = ctx.get('tools');
    if (!toolsSvc || typeof toolsSvc.definitions !== 'function') return [];
    const { byServer } = collectMcpToolsMap();
    const { deniedTools } = computeEffectivePolicy(state, byServer, [], {
      sessionId,
      resolveParentSessionId,
    });
    const knownGlobals = new Set(toolsSvc.definitions().map(d => d.name));
    return [...deniedTools].filter(t => t !== 'run_code' && knownGlobals.has(t));
  }

  function syncAgentRestriction(agent) {
    if (disposed || !agent || !agent.ctx) return;
    const deny = computeCurrentDeniedGlobalTools(agent.id).sort();
    const key = JSON.stringify(deny);
    if (agentRestrictionKeys.get(agent.id) === key) return;
    agentRestrictionKeys.set(agent.id, key);
    const prev = agentRestrictionDisposers.get(agent.id);
    if (prev) {
      try { prev(); } catch {}
      agentRestrictionDisposers.delete(agent.id);
    }
    if (deny.length === 0) return;
    try {
      const off = agent.ctx.inject(['tools'], toolCtx => toolCtx.effect(
        () => toolCtx.tools.restrict({ deny }),
        'capability-hub: agent tool restriction',
      ));
      agentRestrictionDisposers.set(agent.id, off);
    } catch {
      agentRestrictionKeys.delete(agent.id);
      // Ignore if agent scope is disposing or tool list changed concurrently
    }
  }

  function buildSkillOverrideCandidates(underlying, policy, globalPolicy) {
    const candidates = [];
    for (const sk of underlying) {
      const ov = policy.skillOverrides.get(sk.name);
      if (!ov) continue;
      const globalChanged = globalPolicy ? globalPolicy.skillOverrides.get(sk.name)?.changed === true : false;
      if (!ov.changed && !globalChanged) continue;
      candidates.push({
        name: sk.name,
        description: sk.description,
        ...(sk.whenToUse !== undefined ? { whenToUse: sk.whenToUse } : {}),
        ...(sk.path !== undefined ? { path: sk.path } : {}),
        ...(sk.resourceBase !== undefined ? { resourceBase: sk.resourceBase } : {}),
        source: sk.source,
        provider: globalPolicy ? 'capability-hub-session-policy' : 'capability-hub-policy',
        invocation: ov.invocation,
        rank: 1,
        locator: { skillName: sk.name, invocation: ov.invocation },
      });
    }
    return candidates;
  }

  function syncAgentSkillPolicy(agent) {
    if (disposed || !agent?.ctx) return;
    if (sessionSkillDisposers.has(agent.id)) return;
    try {
      const off = agent.ctx.inject(['skills'], (skillCtx) => skillCtx.effect(() => {
        return skillCtx.skills.registerProvider((control) => {
          sessionSkillInvalidators.set(agent.id, () => control.invalidate());
          return {
            name: 'capability-hub-session-policy',
            async list(options) {
              if (bypassSkillPolicy.getStore() === true) return { candidates: [], complete: false };
              const underlying = await bypassSkillPolicy.run(true, () => skillCtx.skills.list({ ...options, scope: {} }));
              const globalPolicy = computeEffectivePolicy(state, {}, underlying);
              const sessionPolicy = computeEffectivePolicy(state, {}, underlying, {
                sessionId: agent.id,
                resolveParentSessionId,
              });
              return buildSkillOverrideCandidates(underlying, sessionPolicy, globalPolicy);
            },
            async get(candidate, options) {
              const def = await bypassSkillPolicy.run(true, () => skillCtx.skills.get(candidate.name, { ...options, scope: {} }));
              if (!def) return undefined;
              return {
                ...def,
                invocation: candidate.invocation,
                provider: 'capability-hub-session-policy',
              };
            },
          };
        });
      }, 'capability-hub: session skill policy provider'));
      sessionSkillDisposers.set(agent.id, off);
    } catch {
      // Ignore if agent scope is disposing
    }
  }

  function syncAllAgentRestrictions() {
    const agentsSvc = ctx.get('agents');
    if (!agentsSvc || typeof agentsSvc.list !== 'function') return;
    for (const agent of agentsSvc.list()) {
      syncAgentRestriction(agent);
      syncAgentSkillPolicy(agent);
    }
  }

  function syncCustomMcpRegistrations() {
    const mgr = ctx.get('mcpManager');
    if (!mgr || typeof mgr.register !== 'function' || disposed) return;

    const desired = state.customServers || {};
    for (const [srv, off] of [...customMcpDisposers.entries()]) {
      const cfg = desired[srv];
      if (!cfg || cfg.enabled === false || state.disabledServers?.[srv] === true) {
        try { off(); } catch {}
        customMcpDisposers.delete(srv);
      }
    }

    for (const [srv, cfg] of Object.entries(desired)) {
      if (!cfg || cfg.enabled === false || state.disabledServers?.[srv] === true) continue;
      if (customMcpDisposers.has(srv)) continue;
      try {
        const entry = cfg.transport === 'stdio'
          ? {
              transport: 'stdio',
              command: cfg.command || '',
              args: Array.isArray(cfg.args) ? cfg.args : [],
              env: cfg.env && typeof cfg.env === 'object' ? cfg.env : {},
              cwd: cfg.cwd || '',
            }
          : {
              transport: 'streamable-http',
              url: cfg.url || '',
              headers: cfg.headers && typeof cfg.headers === 'object' ? cfg.headers : {},
            };
        const off = mgr.register(srv, entry);
        customMcpDisposers.set(srv, off);
      } catch (err) {
        ctx.logger?.warn?.(`capability-hub: failed to register custom MCP "${srv}": ${err?.message || err}`);
      }
    }
  }

  function notifyClientSkillCatalog() {
    try {
      if (typeof ctx.emit === 'function') {
        ctx.emit('plugin-manager/changed', { reason: 'capability-hub' });
      }
    } catch {}
  }

  function persistAndReconcile(targetSessionId) {
    saveState(statePath, state);
    if (targetSessionId) {
      const agentsSvc = ctx.get('agents');
      if (agentsSvc && typeof agentsSvc.list === 'function') {
        for (const agent of agentsSvc.list()) {
          if (agent.id === targetSessionId || resolveParentSessionId(agent.id) === targetSessionId) {
            syncAgentRestriction(agent);
            syncAgentSkillPolicy(agent);
            const inv = sessionSkillInvalidators.get(agent.id);
            if (inv) inv();
          }
        }
      }
      notifyClientSkillCatalog();
      return;
    }
    syncCustomMcpRegistrations();
    syncAllAgentRestrictions();
    invalidateSkillPolicy();
    for (const inv of sessionSkillInvalidators.values()) {
      try { inv(); } catch {}
    }
    notifyClientSkillCatalog();
  }

  function buildSessionPolicySnapshot(sessionId, byServer, detailsByServer, rawSkills) {
    const policy = computeEffectivePolicy(state, byServer, rawSkills, {
      sessionId,
      resolveParentSessionId,
    });
    let activeToolCount = 0;
    let totalToolCount = 0;
    for (const [srvName, rawTools] of Object.entries(detailsByServer)) {
      const eff = policy.serverEffectiveEnabled.get(srvName) || { enabled: true };
      totalToolCount += rawTools.length;
      if (eff.enabled) {
        for (const t of rawTools) {
          if (state.disabledTools?.[t.name] !== true) activeToolCount += 1;
        }
      }
    }
    let autoSkills = 0;
    let usedSkillChars = 0;
    for (const sk of rawSkills) {
      const ov = policy.skillOverrides.get(sk.name);
      const mode = ov ? ov.effectiveMode : (sk.invocation?.modelInvocable !== false ? 'auto' : 'manual');
      if (mode === 'auto') {
        autoSkills += 1;
        usedSkillChars += sk.name.length + Math.min(500, (sk.description || '').length) + 8;
      }
    }
    const budgetPercent = Math.min(100, Math.round((usedSkillChars / CONTEXT_BUDGET_CHARS) * 100));
    return {
      sessionId,
      overridden: policy.overridden,
      activeBundleIds: policy.activeBundleIds,
      summary: {
        activeToolCount,
        totalToolCount,
        autoSkills,
        usedSkillChars,
        budgetMaxChars: CONTEXT_BUDGET_CHARS,
        budgetPercent,
      },
    };
  }

  async function buildStatus(cwdInput, sessionId) {
    const cwd = cwdInput || resolveDefaultCwd();
    await ensureSeeded(cwd);

    const { byServer, detailsByServer } = collectMcpToolsMap();
    const rawSkills = await listUnderlyingSkills(cwd);
    const policy = computeEffectivePolicy(state, byServer, rawSkills);
    const patchHints = scanPatchHints(cwd);

    const mgr = ctx.get('mcpManager');
    const managedViews = new Map();
    const managedConfigs = mgr?.config?.servers?.get?.() || {};
    if (mgr && typeof mgr.list === 'function') {
      for (const v of mgr.list()) managedViews.set(v.name, v);
    }

    const mcps = Object.keys(byServer).sort().map(srvName => {
      const customCfg = state.customServers?.[srvName];
      const managedCfg = managedConfigs[srvName];
      const hint = patchHints.get(srvName);
      const managedView = managedViews.get(srvName);
      const eff = policy.serverEffectiveEnabled.get(srvName) || { enabled: true, reason: 'active' };
      const rawTools = detailsByServer[srvName] || [];
      const tools = rawTools.map(t => ({
        ...t,
        enabled: eff.enabled && state.disabledTools?.[t.name] !== true,
        individuallyDisabled: state.disabledTools?.[t.name] === true,
      }));

      let connState = 'connected';
      let lastError = '';
      if (!eff.enabled) {
        connState = 'disabled';
      } else if (managedView?.status?.state) {
        connState = managedView.status.state;
        if (managedView.status.lastError) lastError = managedView.status.lastError;
      } else if (tools.length === 0 && customCfg) {
        connState = 'connecting';
      }

      const transport = customCfg?.transport || managedCfg?.transport || hint?.transport || 'streamable-http';
      const url = customCfg?.url || managedCfg?.url || hint?.url || '';
      const command = customCfg?.command || managedCfg?.command || hint?.command || '';
      const args = customCfg?.args || managedCfg?.args || [];
      const srvCwd = customCfg?.cwd || managedCfg?.cwd || '';
      const source = customCfg ? 'custom' : managedView?.configured ? 'settings' : 'bundle';

      const srvRecord = {
        name: srvName,
        source,
        transport,
        url,
        command,
        args,
        cwd: srvCwd,
        patchPath: hint?.patchPath || '',
        enabled: eff.enabled,
        disableReason: eff.reason,
        connectionState: connState,
        lastError,
        canRestart: Boolean(managedView),
        isCustom: Boolean(customCfg),
        totalTools: tools.length,
        activeTools: tools.filter(t => t.enabled).length,
        bundles: (policy.serverBundles.get(srvName) || []).map(b => ({ id: b.id, name: b.name, enabled: b.enabled })),
        tools,
      };
      return {
        ...srvRecord,
        mcpJsonSnippet: formatMcpJsonSnippet(srvRecord),
      };
    });

    const skills = rawSkills.map(sk => {
      const ov = policy.skillOverrides.get(sk.name) || {
        configuredMode: 'default',
        effectiveMode: sk.invocation?.modelInvocable !== false ? 'auto' : 'manual',
        reason: 'default',
        bundles: [],
      };
      return {
        name: sk.name,
        description: sk.description || '',
        whenToUse: sk.whenToUse || '',
        source: sk.source || 'user-agents',
        scopeGroup: classifySkillScope(sk.source),
        path: sk.path || '',
        provider: sk.provider || 'filesystem',
        configuredMode: ov.configuredMode,
        effectiveMode: ov.effectiveMode,
        reason: ov.reason,
        bundles: ov.bundles,
      };
    });

    const mcpMap = new Map(mcps.map(m => [m.name, m]));
    const skillMap = new Map(skills.map(s => [s.name, s]));

    const bundles = state.bundles.map(b => {
      const bMcps = (b.mcps || []).map(n => mcpMap.get(n) || {
        name: n,
        source: 'missing',
        transport: 'streamable-http',
        enabled: false,
        connectionState: 'missing',
        totalTools: 0,
        activeTools: 0,
        tools: [],
      });
      const bSkills = (b.skills || []).map(n => skillMap.get(n) || {
        name: n,
        description: '当前工作区未扫描到此技能',
        source: 'missing',
        scopeGroup: 'user',
        effectiveMode: 'muted',
      });
      const hasIssue = b.enabled && bMcps.some(m => m.connectionState === 'failed' || m.connectionState === 'reconnecting');
      return {
        ...b,
        defaultInject: b.defaultInject !== false,
        mcpDetails: bMcps,
        skillDetails: bSkills,
        hasIssue,
      };
    });

    const autoSkills = skills.filter(s => s.effectiveMode === 'auto');
    const usedSkillChars = autoSkills.reduce((acc, s) => acc + s.name.length + Math.min(500, (s.description || '').length) + 8, 0);
    const activeToolCount = mcps.reduce((acc, m) => acc + m.activeTools, 0);
    const totalToolCount = mcps.reduce((acc, m) => acc + m.totalTools, 0);
    const budgetPercent = Math.min(100, Math.round((usedSkillChars / CONTEXT_BUDGET_CHARS) * 100));
    const session = sessionId ? buildSessionPolicySnapshot(sessionId, byServer, detailsByServer, rawSkills) : undefined;

    return {
      ok: true,
      cwd,
      workspaces: listWorkspaces(),
      ...(session ? { session } : {}),
      summary: {
        totalBundles: bundles.length,
        enabledBundles: bundles.filter(b => b.enabled).length,
        totalSkills: skills.length,
        autoSkills: autoSkills.length,
        manualSkills: skills.filter(s => s.effectiveMode === 'manual').length,
        mutedSkills: skills.filter(s => s.effectiveMode === 'muted').length,
        totalMcps: mcps.length,
        enabledMcps: mcps.filter(m => m.enabled).length,
        hasMcpIssues: mcps.some(m => m.enabled && (m.connectionState === 'failed' || m.connectionState === 'reconnecting')),
        activeToolCount,
        totalToolCount,
        usedSkillChars,
        budgetMaxChars: CONTEXT_BUDGET_CHARS,
        budgetPercent,
      },
      bundles,
      skills,
      mcps,
    };
  }

  async function executeAction(action, payload = {}) {
    await ensureSeeded(payload.cwd);

    switch (action) {
      case 'status':
        return buildStatus(payload.cwd, payload.sessionId);

      case 'read_skill': {
        const skillName = String(payload.skillName || '').trim();
        if (!SKILL_NAME_RE.test(skillName)) {
          return { ok: false, error: `无效的技能名称: ${skillName}` };
        }
        const skillsSvc = ctx.get('skills');
        if (!skillsSvc || typeof skillsSvc.get !== 'function') {
          return { ok: false, error: '当前宿主未挂载 skills 服务' };
        }
        const cwd = payload.cwd || resolveDefaultCwd();
        const def = await bypassSkillPolicy.run(true, () => skillsSvc.get(skillName, { ...(cwd ? { cwd } : {}), scope: {} }));
        if (!def) {
          return { ok: false, error: `未找到技能 "${skillName}"` };
        }
        return {
          ok: true,
          skill: {
            name: def.name,
            description: def.description || '',
            whenToUse: def.whenToUse || '',
            source: def.source || '',
            path: def.path || '',
            content: def.content || '',
          },
        };
      }

      case 'toggle_bundle': {
        const bundleId = String(payload.bundleId || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        const nextEnabled = typeof payload.enabled === 'boolean' ? payload.enabled : !state.bundles[idx].enabled;
        state.bundles[idx] = { ...state.bundles[idx], enabled: nextEnabled };
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'set_bundle_default_inject': {
        const bundleId = String(payload.bundleId || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        const nextDefaultInject = typeof payload.defaultInject === 'boolean'
          ? payload.defaultInject
          : state.bundles[idx].defaultInject === false;
        state.bundles[idx] = { ...state.bundles[idx], defaultInject: nextDefaultInject };
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'set_session_bundles': {
        const sessionId = String(payload.sessionId || '').trim();
        if (!sessionId) return { ok: false, error: 'sessionId 不能为空' };
        if (payload.bundleIds === null || payload.reset === true) {
          delete state.sessionOverrides[sessionId];
        } else if (Array.isArray(payload.bundleIds)) {
          const validIds = new Set(state.bundles.filter(b => b.enabled !== false).map(b => b.id));
          state.sessionOverrides[sessionId] = [...new Set(payload.bundleIds.map(String).filter(id => validIds.has(id)))];
          // Keep sessionOverrides bounded to the 200 most recent entries
          const keys = Object.keys(state.sessionOverrides);
          if (keys.length > 200) {
            for (const oldKey of keys.slice(0, keys.length - 200)) {
              delete state.sessionOverrides[oldKey];
            }
          }
        } else {
          return { ok: false, error: 'bundleIds 必须为数组或 null' };
        }
        persistAndReconcile(sessionId);
        return buildStatus(payload.cwd, sessionId);
      }

      case 'save_bundle': {
        const title = String(payload.name || '').trim();
        if (!title) return { ok: false, error: '套件名称不能为空' };
        const id = String(payload.bundleId || '').trim() || `suite-${Date.now().toString(36)}`;
        const slug = String(payload.slug || title)
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, '-')
          .replace(/^-+|-+$/g, '') || id;
        const mcps = Array.isArray(payload.mcps) ? [...new Set(payload.mcps.map(String).filter(Boolean))] : [];
        const skills = Array.isArray(payload.skills) ? [...new Set(payload.skills.map(String).filter(Boolean))] : [];
        const existingIdx = state.bundles.findIndex(b => b.id === id);
        const record = {
          id,
          name: title,
          slug,
          description: String(payload.description || '').trim() || '自定义 MCP 与 Skills 组合套件',
          icon: String(payload.icon || 'layers'),
          color: String(payload.color || '#2563eb'),
          enabled: typeof payload.enabled === 'boolean' ? payload.enabled : (existingIdx >= 0 ? state.bundles[existingIdx].enabled : true),
          defaultInject: typeof payload.defaultInject === 'boolean'
            ? payload.defaultInject
            : (existingIdx >= 0 ? state.bundles[existingIdx].defaultInject !== false : true),
          mcps,
          skills,
        };
        if (existingIdx >= 0) {
          state.bundles[existingIdx] = record;
        } else {
          state.bundles.unshift(record);
        }
        persistAndReconcile();
        return { ...(await buildStatus(payload.cwd)), savedBundleId: id };
      }

      case 'delete_bundle': {
        const bundleId = String(payload.bundleId || '').trim();
        const before = state.bundles.length;
        state.bundles = state.bundles.filter(b => b.id !== bundleId);
        if (state.bundles.length === before) return { ok: false, error: `未找到套件 "${bundleId}"` };
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'set_skill_mode': {
        const skillName = String(payload.skillName || '').trim();
        const mode = String(payload.mode || 'default');
        if (!skillName) return { ok: false, error: '技能名称不能为空' };
        if (!['default', 'auto', 'manual', 'muted'].includes(mode)) {
          return { ok: false, error: `不支持的技能模式: ${mode}` };
        }
        if (mode === 'default') delete state.skillModes[skillName];
        else state.skillModes[skillName] = mode;
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'toggle_mcp_server': {
        const serverName = String(payload.serverName || '').trim();
        if (!serverName) return { ok: false, error: 'MCP 服务名不能为空' };
        const enabled = Boolean(payload.enabled);
        if (enabled) {
          delete state.disabledServers[serverName];
          if (state.customServers[serverName]) state.customServers[serverName].enabled = true;
        } else {
          state.disabledServers[serverName] = true;
        }
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'toggle_mcp_tool': {
        const toolName = String(payload.toolName || '').trim();
        if (!toolName) return { ok: false, error: '工具名不能为空' };
        const enabled = Boolean(payload.enabled);
        if (enabled) delete state.disabledTools[toolName];
        else state.disabledTools[toolName] = true;
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'batch_mcp_tools': {
        const serverName = String(payload.serverName || '').trim();
        const enabled = Boolean(payload.enabled);
        const { byServer } = collectMcpToolsMap();
        for (const t of byServer[serverName] || []) {
          if (enabled) delete state.disabledTools[t];
          else state.disabledTools[t] = true;
        }
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'save_custom_mcp': {
        const serverName = String(payload.serverName || '').trim();
        if (!SERVER_NAME_RE.test(serverName)) {
          return { ok: false, error: 'MCP 服务名称仅支持字母、数字、下划线或连字符（1-32位）' };
        }
        const transport = payload.transport === 'stdio' ? 'stdio' : 'streamable-http';
        if (transport === 'streamable-http') {
          const url = String(payload.url || '').trim();
          if (!/^https?:\/\//i.test(url)) {
            return { ok: false, error: 'Streamable HTTP 需要有效的 http(s):// 地址' };
          }
          state.customServers[serverName] = {
            transport: 'streamable-http',
            url,
            headers: payload.headers && typeof payload.headers === 'object' ? payload.headers : {},
            enabled: payload.enabled !== false,
          };
        } else {
          const command = String(payload.command || '').trim();
          if (!command) return { ok: false, error: 'STDIO 模式需要填写启动命令 (command)' };
          const args = Array.isArray(payload.args)
            ? payload.args.map(String)
            : String(payload.argsText || '').trim()
              ? String(payload.argsText).trim().split(/\s+/)
              : [];
          state.customServers[serverName] = {
            transport: 'stdio',
            command,
            args,
            env: payload.env && typeof payload.env === 'object' ? payload.env : {},
            cwd: String(payload.serverCwd || '').trim(),
            enabled: payload.enabled !== false,
          };
        }
        delete state.disabledServers[serverName];
        const prevOff = customMcpDisposers.get(serverName);
        if (prevOff) {
          try { prevOff(); } catch {}
          customMcpDisposers.delete(serverName);
        }
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'delete_custom_mcp': {
        const serverName = String(payload.serverName || '').trim();
        if (!state.customServers[serverName]) {
          return { ok: false, error: `仅可删除在此面板新增的自定义 MCP 服务 (${serverName})` };
        }
        const off = customMcpDisposers.get(serverName);
        if (off) {
          try { off(); } catch {}
          customMcpDisposers.delete(serverName);
        }
        delete state.customServers[serverName];
        delete state.disabledServers[serverName];
        persistAndReconcile();
        return buildStatus(payload.cwd);
      }

      case 'restart_mcp': {
        const serverName = String(payload.serverName || '').trim();
        const mgr = ctx.get('mcpManager');
        if (mgr && typeof mgr.restart === 'function') {
          try {
            await mgr.restart(serverName);
          } catch (err) {
            return { ok: false, error: err?.message || String(err) };
          }
        }
        return buildStatus(payload.cwd);
      }

      default:
        return { ok: false, error: `未知操作: ${String(action)}` };
    }
  }

  // 1. Skill Policy Provider (rank 1 override without dirtying SKILL.md files on disk)
  ctx.inject(['skills'], (skillCtx) => {
    skillCtx.effect(() => {
      return skillCtx.skills.registerProvider((control) => {
        invalidateSkillPolicy = () => control.invalidate();
        return {
          name: 'capability-hub-policy',
          async list(options) {
            if (bypassSkillPolicy.getStore() === true) return { candidates: [], complete: false };
            const hasBundleOff = state.bundles.some(
              b => (b.enabled === false || b.defaultInject === false) && Array.isArray(b.skills) && b.skills.length > 0,
            );
            const hasManualSkillModes = Object.keys(state.skillModes || {}).length > 0;
            if (!hasBundleOff && !hasManualSkillModes) return [];

            const underlying = await bypassSkillPolicy.run(true, () => skillCtx.skills.list({ ...options, scope: {} }));
            const policy = computeEffectivePolicy(state, {}, underlying);
            return buildSkillOverrideCandidates(underlying, policy, null);
          },
          async get(candidate, options) {
            const def = await bypassSkillPolicy.run(true, () => skillCtx.skills.get(candidate.name, { ...options, scope: {} }));
            if (!def) return undefined;
            return {
              ...def,
              invocation: candidate.invocation,
              provider: 'capability-hub-policy',
            };
          },
        };
      });
    }, 'capability-hub: skill policy provider');
  });

  // 2. Per-Agent Tool Restriction Enforcement + Agent Tool Registration ("One operation, two callers")
  ctx.inject(['tools', 'agents'], (taCtx) => {
    taCtx.on('agent/created', ({ agent }) => {
      syncAgentRestriction(agent);
      syncAgentSkillPolicy(agent);
    });
    taCtx.on('agent/disposed', ({ agent }) => {
      agentRestrictionKeys.delete(agent.id);
      const off = agentRestrictionDisposers.get(agent.id);
      if (off) {
        try { off(); } catch {}
        agentRestrictionDisposers.delete(agent.id);
      }
      const skillOff = sessionSkillDisposers.get(agent.id);
      if (skillOff) {
        try { skillOff(); } catch {}
        sessionSkillDisposers.delete(agent.id);
      }
      sessionSkillInvalidators.delete(agent.id);
    });
    taCtx.on('tools/change', () => {
      syncAllAgentRestrictions();
    });

    taCtx.effect(() => {
      syncAllAgentRestrictions();
      return taCtx.tools.register({
        name: 'capability_hub',
        description: 'Inspect and manage capability bundles (MCP + Skills suites), session-level bundle injection, skill invocation modes, and MCP server/tool visibility.',
        parameters: {
          type: 'object',
          additionalProperties: false,
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              enum: [
                'status',
                'read_skill',
                'toggle_bundle',
                'set_bundle_default_inject',
                'set_session_bundles',
                'save_bundle',
                'delete_bundle',
                'set_skill_mode',
                'toggle_mcp_server',
                'toggle_mcp_tool',
                'batch_mcp_tools',
                'save_custom_mcp',
                'delete_custom_mcp',
                'restart_mcp',
              ],
              description: 'Management operation to execute.',
            },
            cwd: { type: 'string', description: 'Optional workspace directory for project-scoped skill lookup.' },
            bundleId: { type: 'string', description: 'Target bundle ID for toggle_bundle, save_bundle, or delete_bundle.' },
            name: { type: 'string', description: 'Bundle display name for save_bundle.' },
            description: { type: 'string', description: 'Bundle summary description for save_bundle.' },
            icon: { type: 'string', description: 'Icon key (bolt, layers, spark, terminal, globe, code) for save_bundle.' },
            color: { type: 'string', description: 'Hex accent color for save_bundle.' },
            mcps: { type: 'array', items: { type: 'string' }, description: 'MCP server names included in the bundle.' },
            skills: { type: 'array', items: { type: 'string' }, description: 'Skill names included in the bundle.' },
            enabled: { type: 'boolean', description: 'Target enabled state for toggle operations or save_bundle.' },
            defaultInject: { type: 'boolean', description: 'Whether new sessions inject this bundle by default.' },
            sessionId: { type: 'string', description: 'Target session ID for set_session_bundles or status.' },
            bundleIds: { type: 'array', items: { type: 'string' }, description: 'Bundle IDs active in the target session.' },
            reset: { type: 'boolean', description: 'Reset session bundle overrides back to global defaults.' },
            skillName: { type: 'string', description: 'Target kebab-case skill name for set_skill_mode or read_skill.' },
            mode: {
              type: 'string',
              enum: ['default', 'auto', 'manual', 'muted'],
              description: 'Skill invocation mode: auto (model + /skill), manual (/skill only), muted (hidden), or default.',
            },
            serverName: { type: 'string', description: 'MCP server name ([A-Za-z0-9_-]{1,32}).' },
            toolName: { type: 'string', description: 'Full MCP tool name (mcp__<server>__<tool>) for toggle_mcp_tool.' },
            transport: { type: 'string', enum: ['streamable-http', 'stdio'], description: 'Transport for save_custom_mcp.' },
            url: { type: 'string', description: 'Endpoint URL for streamable-http save_custom_mcp.' },
            command: { type: 'string', description: 'Executable command for stdio save_custom_mcp.' },
            args: { type: 'array', items: { type: 'string' }, description: 'Command arguments for stdio save_custom_mcp.' },
          },
        },
        output: {
          schema: {
            type: 'object',
            required: ['ok'],
            properties: {
              ok: { type: 'boolean' },
            },
          },
          render(_args, value) {
            return [{ type: 'text', text: JSON.stringify(value, null, 2) }];
          },
        },
        async execute(args, exec) {
          let cwd = args?.cwd;
          if (!cwd && exec?.agent) {
            try {
              const wd = taCtx.get('workingDirectory');
              if (wd && typeof wd.ensure === 'function') {
                cwd = await wd.ensure(exec.agent, exec.signal);
              }
            } catch {}
          }
          const sessionId = args?.sessionId || exec?.agent?.id;
          const res = await executeAction(args?.action, { ...args, cwd, sessionId });
          if (res?.ok === false) {
            return { ok: false, error: res.error || 'Operation failed' };
          }
          if (args?.action === 'status') {
            return {
              ok: true,
              cwd: res.cwd,
              ...(res.session ? { session: res.session } : {}),
              summary: res.summary,
              bundles: res.bundles.map(b => ({
                id: b.id,
                name: b.name,
                enabled: b.enabled,
                defaultInject: b.defaultInject,
                mcps: b.mcps,
                skills: b.skills,
              })),
              mcps: res.mcps.map(m => ({
                name: m.name,
                enabled: m.enabled,
                connectionState: m.connectionState,
                activeTools: m.activeTools,
                totalTools: m.totalTools,
              })),
              mutedOrManualSkills: res.skills
                .filter(s => s.effectiveMode !== 'auto')
                .map(s => ({ name: s.name, effectiveMode: s.effectiveMode, reason: s.reason })),
            };
          }
          return res;
        },
      });
    }, 'capability-hub: agent tool');
  });

  // 3. Sync custom MCP servers with mcpManager when available
  ctx.inject(['mcpManager'], (mcpCtx) => {
    mcpCtx.effect(() => {
      syncCustomMcpRegistrations();
      return () => {};
    }, 'capability-hub: custom mcp sync');
  });

  // 4. Shared Owner-Authenticated Fetch Route for Web & Desktop Client UI
  ctx.inject(['connection'], (connCtx) => {
    connCtx.effect(() => {
      return connCtx.connection.fetch.register({
        path: API_ROUTE_PATH,
        methods: ['GET', 'POST'],
        requestBody: 'buffered',
        async fetch(request) {
          try {
            const url = new URL(request.url);
            if (request.method === 'GET') {
              const action = url.searchParams.get('action') || 'status';
              const cwd = url.searchParams.get('cwd') || undefined;
              const skillName = url.searchParams.get('skillName') || undefined;
              const sessionId = url.searchParams.get('sessionId') || undefined;
              const data = await executeAction(action, { cwd, skillName, sessionId });
              return Response.json(data, {
                status: data.ok === false ? 400 : 200,
                headers: { 'cache-control': 'no-store' },
              });
            }
            const body = await request.json();
            const action = body?.action || 'status';
            const data = await executeAction(action, body || {});
            return Response.json(data, {
              status: data.ok === false ? 400 : 200,
              headers: { 'cache-control': 'no-store' },
            });
          } catch (err) {
            return Response.json(
              { ok: false, error: err instanceof Error ? err.message : String(err) },
              { status: 500, headers: { 'cache-control': 'no-store' } },
            );
          }
        },
      });
    }, 'capability-hub: /api/capability-hub route');
  });
}
