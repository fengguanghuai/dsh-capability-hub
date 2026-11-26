import { AsyncLocalStorage } from 'node:async_hooks';
import { execFile } from 'node:child_process';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { inflateRawSync } from 'node:zlib';

const execFileAsync = promisify(execFile);

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

function sanitizeBundleSkillModes(raw, allowedSkills) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const allowSet = Array.isArray(allowedSkills) ? new Set(allowedSkills) : null;
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k || '').trim();
    if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (allowSet && !allowSet.has(key)) continue;
    if (v === 'auto' || v === 'manual' || v === 'muted') {
      out[key] = v;
    }
  }
  return out;
}

function sanitizeBundleDisabledMcps(raw, allowedMcps) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const allowSet = Array.isArray(allowedMcps) ? new Set(allowedMcps) : null;
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k || '').trim();
    if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (allowSet && !allowSet.has(key)) continue;
    if (v === true) out[key] = true;
  }
  return out;
}

function sanitizeBundleDisabledTools(raw, allowedMcps) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const allowSet = Array.isArray(allowedMcps) ? new Set(allowedMcps) : null;
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k || '').trim();
    if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    if (allowSet) {
      const m = MCP_TOOL_RE.exec(key);
      if (m && !allowSet.has(m[1])) continue;
    }
    if (typeof v === 'boolean') out[key] = v;
  }
  return out;
}

function normalizeBundle(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const mcps = Array.isArray(raw.mcps) ? [...new Set(raw.mcps.map(String).filter(Boolean))] : [];
  const skills = Array.isArray(raw.skills) ? [...new Set(raw.skills.map(String).filter(Boolean))] : [];
  const skillModes = sanitizeBundleSkillModes(raw.skillModes, skills);
  const disabledMcps = sanitizeBundleDisabledMcps(raw.disabledMcps, mcps);
  const disabledTools = sanitizeBundleDisabledTools(raw.disabledTools, mcps);
  return {
    ...raw,
    mcps,
    skills,
    ...(Object.keys(skillModes).length ? { skillModes } : {}),
    ...(Object.keys(disabledMcps).length ? { disabledMcps } : {}),
    ...(Object.keys(disabledTools).length ? { disabledTools } : {}),
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
      bundles: Array.isArray(raw.bundles) ? raw.bundles.map(normalizeBundle).filter(Boolean) : [],
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

const SKILL_MODE_RANK = { muted: 0, manual: 1, auto: 2 };

export function resolveSkillBaselineMode(sk, globalSkillModes) {
  const configured = globalSkillModes?.[sk.name] || 'default';
  if (configured === 'auto' || configured === 'manual' || configured === 'muted') {
    return { mode: configured, source: 'manual' };
  }
  const m = sk.invocation?.modelInvocable !== false;
  const u = sk.invocation?.userInvocable !== false;
  return { mode: m ? 'auto' : u ? 'manual' : 'muted', source: 'default' };
}

export function resolveBundleSkillMode(bundle, sk, globalSkillModes) {
  const configured = bundle?.skillModes?.[sk.name] || 'default';
  const baseline = resolveSkillBaselineMode(sk, globalSkillModes);
  if (configured === 'auto' || configured === 'manual' || configured === 'muted') {
    return {
      configuredMode: configured,
      effectiveMode: configured,
      source: 'bundle-override',
      globalDefaultMode: baseline.mode,
    };
  }
  return {
    configuredMode: 'default',
    effectiveMode: baseline.mode,
    source: baseline.source,
    globalDefaultMode: baseline.mode,
  };
}

export function isBundleToolEnabled(bundle, fullTool, globalDisabledTools) {
  if (bundle?.disabledTools && Object.hasOwn(bundle.disabledTools, fullTool)) {
    return bundle.disabledTools[fullTool] !== true;
  }
  return globalDisabledTools?.[fullTool] !== true;
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

  const deniedTools = new Set();
  const serverEffectiveEnabled = new Map();
  for (const [srv, toolNames] of Object.entries(allMcpToolsByServer)) {
    const manuallyOff = state.disabledServers?.[srv] === true;
    const list = serverBundles.get(srv) || [];
    if (list.length === 0) {
      const srvEnabled = !manuallyOff;
      serverEffectiveEnabled.set(srv, {
        enabled: srvEnabled,
        reason: manuallyOff ? 'manual' : 'active',
      });
      for (const fullTool of toolNames) {
        if (!srvEnabled || state.disabledTools?.[fullTool] === true) {
          deniedTools.add(fullTool);
        }
      }
      continue;
    }

    const activeBundles = list.filter(b => b.enabled !== false);
    const servingBundles = activeBundles.filter(b => b.disabledMcps?.[srv] !== true);
    const bundleOff = servingBundles.length === 0;
    const srvEnabled = !manuallyOff && !bundleOff;
    const bundleReason = activeBundles.length > 0 && servingBundles.length === 0 ? 'bundle-override' : 'bundle';
    serverEffectiveEnabled.set(srv, {
      enabled: srvEnabled,
      reason: manuallyOff ? 'manual' : bundleOff ? bundleReason : 'active',
    });

    for (const fullTool of toolNames) {
      if (!srvEnabled) {
        deniedTools.add(fullTool);
        continue;
      }
      const allowedByAnyBundle = servingBundles.some(b => isBundleToolEnabled(b, fullTool, state.disabledTools));
      if (!allowedByAnyBundle) {
        deniedTools.add(fullTool);
      }
    }
  }

  const skillOverrides = new Map();
  for (const sk of underlyingSkills) {
    const configured = state.skillModes?.[sk.name] || 'default';
    const list = skillBundles.get(sk.name) || [];
    let effectiveMode;
    let reason = 'default';

    if (list.length === 0) {
      const baseline = resolveSkillBaselineMode(sk, state.skillModes);
      effectiveMode = baseline.mode;
      reason = baseline.source;
    } else {
      const activeBundles = list.filter(b => b.enabled !== false);
      if (activeBundles.length === 0) {
        effectiveMode = 'muted';
        reason = configured === 'muted' ? 'manual' : 'bundle';
      } else {
        let best = null;
        let allMutedByBundleOverride = true;
        for (const b of activeBundles) {
          const resolved = resolveBundleSkillMode(b, sk, state.skillModes);
          if (resolved.configuredMode !== 'muted') allMutedByBundleOverride = false;
          if (!best || SKILL_MODE_RANK[resolved.effectiveMode] > SKILL_MODE_RANK[best.effectiveMode]) {
            best = resolved;
          }
        }
        effectiveMode = best.effectiveMode;
        if (effectiveMode === 'muted') {
          reason = allMutedByBundleOverride ? 'bundle-override' : best.source;
        } else {
          reason = best.source;
        }
      }
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
      bundles: list.map(b => ({ id: b.id, name: b.name, enabled: b.enabled })),
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

function unquoteYamlValue(raw) {
  const s = String(raw || '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * Parse a SKILL.md string with optional YAML frontmatter into metadata and body.
 */
export function parseSkillMarkdown(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n');
  const fmMatch = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!fmMatch) {
    return { name: '', description: '', whenToUse: '', content: text.trim() };
  }
  const meta = {};
  for (const line of fmMatch[1].split('\n')) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (kv) meta[kv[1]] = unquoteYamlValue(kv[2]);
  }
  return {
    name: String(meta.name || '').trim(),
    description: String(meta.description || '').trim(),
    whenToUse: String(meta['when-to-use'] || meta.whenToUse || '').trim(),
    content: fmMatch[2].trim(),
  };
}

function yamlScalar(val) {
  const s = String(val || '').replace(/\r?\n/g, ' ').trim();
  if (!s) return '""';
  if (/[:#"'{}[\],&*!|>%@`]|^\s|\s$/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}

/**
 * Serialize a skill definition into standard SKILL.md frontmatter + markdown body.
 */
export function formatSkillMarkdown({ name: skillName, description, whenToUse, content }) {
  const lines = [
    '---',
    `name: ${String(skillName || '').trim()}`,
    `description: ${yamlScalar(description)}`,
  ];
  if (whenToUse && String(whenToUse).trim()) {
    lines.push(`when-to-use: ${yamlScalar(whenToUse)}`);
  }
  lines.push('---', '');
  const body = String(content || '').trim();
  if (body) lines.push(body, '');
  return lines.join('\n');
}

export function resolveSkillRootDir(scope, cwd) {
  const home = homedir();
  const dshHome = process.env.DSH_HOME || join(home, '.dsh');
  switch (scope) {
    case 'user-dsh':
      return join(dshHome, 'skills');
    case 'project-agents':
      return cwd ? join(cwd, '.agents', 'skills') : '';
    case 'project-dsh':
      return cwd ? join(cwd, '.dsh', 'skills') : '';
    case 'user-agents':
    default:
      return join(home, '.agents', 'skills');
  }
}

function isWithinRoot(targetPath, rootDir) {
  if (!targetPath || !rootDir) return false;
  const rel = resolve(targetPath);
  const root = resolve(rootDir);
  return rel === root || rel.startsWith(`${root}/`) || rel.startsWith(`${root}\\`);
}

export function isWritableSkillLocation(skillPath, source, cwd) {
  if (!skillPath || source === 'bundled' || source === 'runtime') return false;
  const roots = [
    resolveSkillRootDir('user-agents', cwd),
    resolveSkillRootDir('user-dsh', cwd),
    resolveSkillRootDir('project-agents', cwd),
    resolveSkillRootDir('project-dsh', cwd),
  ].filter(Boolean);
  return roots.some(r => isWithinRoot(skillPath, r));
}

function resolveSkillDirFromPath(skillPath) {
  if (!skillPath) return '';
  return basename(skillPath).toLowerCase() === 'skill.md' ? dirname(skillPath) : skillPath;
}

/**
 * Pure Node.js ZIP reader (supports stored=0 and deflate=8) with path-traversal checks.
 */
export function extractZipEntries(buf) {
  const data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  let eocdOffset = -1;
  const minOffset = Math.max(0, data.length - 65557);
  for (let i = data.length - 22; i >= minOffset; i -= 1) {
    if (data.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('无效的 ZIP 压缩包（未找到目录尾）');

  const totalEntries = data.readUInt16LE(eocdOffset + 10);
  let cdOffset = data.readUInt32LE(eocdOffset + 16);
  const entries = [];

  for (let idx = 0; idx < totalEntries; idx += 1) {
    if (cdOffset + 46 > data.length || data.readUInt32LE(cdOffset) !== 0x02014b50) {
      throw new Error('无效的 ZIP 中央目录记录');
    }
    const method = data.readUInt16LE(cdOffset + 10);
    const compSize = data.readUInt32LE(cdOffset + 20);
    const nameLen = data.readUInt16LE(cdOffset + 28);
    const extraLen = data.readUInt16LE(cdOffset + 30);
    const commentLen = data.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = data.readUInt32LE(cdOffset + 42);
    const rawName = data.slice(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8').replace(/\\/g, '/');
    cdOffset += 46 + nameLen + extraLen + commentLen;

    if (!rawName || rawName.endsWith('/')) continue;
    const parts = rawName.split('/').filter(Boolean);
    if (parts.length === 0 || parts.some(p => p === '..' || p === '.')) continue;
    if (parts[0] === '__MACOSX') continue;

    if (localHeaderOffset + 30 > data.length || data.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`无效的 ZIP 本地文件头: ${rawName}`);
    }
    const lNameLen = data.readUInt16LE(localHeaderOffset + 26);
    const lExtraLen = data.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const compressed = data.slice(dataStart, dataStart + compSize);

    let content;
    if (method === 0) content = compressed;
    else if (method === 8) content = inflateRawSync(compressed);
    else throw new Error(`不支持的 ZIP 压缩算法 (${method}): ${rawName}`);

    entries.push({ path: parts.join('/'), content });
  }
  return entries;
}

function parseRepoInstallArgs(input) {
  const raw = String(input || '').trim();
  if (!raw) return [];
  let normalized = raw
    .replace(/^npx\s+(-y\s+)?skills\s+add\s+/i, '')
    .replace(/^skills\s+add\s+/i, '')
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

const CREDENTIAL_TEMPLATE_RE = /\$\{credential:[^}]+\}/;

export function sanitizeKeyValueMap(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k || '').trim();
    if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    const val = v == null ? '' : String(v);
    if (!val.trim()) continue;
    out[key] = val;
  }
  return out;
}

export function maskSecretValue(raw) {
  const str = String(raw || '');
  if (!str) return '';
  if (CREDENTIAL_TEMPLATE_RE.test(str)) return str;
  const bearerMatch = /^(Bearer\s+)(.+)$/i.exec(str);
  if (bearerMatch) {
    return `${bearerMatch[1]}${maskSecretValue(bearerMatch[2])}`;
  }
  if (str.length <= 8) return '****';
  return `${str.slice(0, 4)}****${str.slice(-4)}`;
}

export function maskKeyValueMap(raw) {
  const clean = sanitizeKeyValueMap(raw);
  const out = {};
  for (const [k, v] of Object.entries(clean)) {
    out[k] = maskSecretValue(v);
  }
  return out;
}

export function hasCredentialTemplate(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  const values = [
    cfg.url,
    cfg.command,
    cfg.cwd,
    ...(Array.isArray(cfg.args) ? cfg.args : []),
    ...Object.values(cfg.headers && typeof cfg.headers === 'object' ? cfg.headers : {}),
    ...Object.values(cfg.env && typeof cfg.env === 'object' ? cfg.env : {}),
  ];
  return values.some(v => typeof v === 'string' && CREDENTIAL_TEMPLATE_RE.test(v));
}

export function formatMcpJsonSnippet(srv) {
  const maskedHeaders = maskKeyValueMap(srv.headers);
  const maskedEnv = maskKeyValueMap(srv.env);
  const expand = Boolean(srv.expandTemplates) || hasCredentialTemplate(srv);
  const entry = srv.transport === 'stdio'
    ? {
        transport: 'stdio',
        command: srv.command || 'npx',
        ...(srv.args?.length ? { args: srv.args } : {}),
        ...(Object.keys(maskedEnv).length ? { env: maskedEnv } : {}),
        ...(srv.cwd ? { cwd: srv.cwd } : {}),
        ...(expand ? { expandTemplates: true } : {}),
      }
    : {
        transport: 'streamable-http',
        url: srv.url || 'https://example.com/mcp',
        ...(Object.keys(maskedHeaders).length ? { headers: maskedHeaders } : {}),
        ...(expand ? { expandTemplates: true } : {}),
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

  function disposeHandle(handle) {
    if (!handle) return;
    try {
      if (typeof handle === 'function') handle();
      else if (typeof handle.dispose === 'function') handle.dispose();
    } catch {}
  }

  ctx.effect(() => () => {
    disposed = true;
    for (const off of agentRestrictionDisposers.values()) {
      disposeHandle(off);
    }
    agentRestrictionDisposers.clear();
    for (const off of sessionSkillDisposers.values()) {
      disposeHandle(off);
    }
    sessionSkillDisposers.clear();
    sessionSkillInvalidators.clear();
    for (const off of customMcpDisposers.values()) {
      disposeHandle(off);
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
      disposeHandle(prev);
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
        const expandTemplates = Boolean(cfg.expandTemplates) || hasCredentialTemplate(cfg);
        const entry = cfg.transport === 'stdio'
          ? {
              transport: 'stdio',
              command: cfg.command || '',
              args: Array.isArray(cfg.args) ? cfg.args : [],
              env: sanitizeKeyValueMap(cfg.env),
              cwd: cfg.cwd || '',
              ...(expandTemplates ? { expandTemplates: true } : {}),
            }
          : {
              transport: 'streamable-http',
              url: cfg.url || '',
              headers: sanitizeKeyValueMap(cfg.headers),
              ...(expandTemplates ? { expandTemplates: true } : {}),
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
          if (!policy.deniedTools.has(t.name)) activeToolCount += 1;
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
        enabled: eff.enabled && !policy.deniedTools.has(t.name),
        individuallyDisabled: state.disabledTools?.[t.name] === true,
      }));

      let connState = 'connected';
      let lastError = '';
      const rawStatus = managedView?.status;
      if (eff.reason === 'manual') {
        connState = 'disabled';
      } else if (rawStatus?.state) {
        connState = rawStatus.state;
        if (rawStatus.lastError) lastError = rawStatus.lastError;
      } else if (!eff.enabled) {
        connState = 'disabled';
      } else if (tools.length === 0 && customCfg) {
        connState = 'connecting';
      }
      const connectionAttempt = typeof rawStatus?.attempt === 'number' ? rawStatus.attempt : undefined;
      const connectionMaxAttempts = typeof rawStatus?.maxAttempts === 'number' ? rawStatus.maxAttempts : undefined;

      const transport = customCfg?.transport || managedCfg?.transport || hint?.transport || 'streamable-http';
      const url = customCfg?.url || managedCfg?.url || hint?.url || '';
      const command = customCfg?.command || managedCfg?.command || hint?.command || '';
      const args = customCfg?.args || managedCfg?.args || [];
      const srvCwd = customCfg?.cwd || managedCfg?.cwd || '';
      const rawHeaders = customCfg?.headers || managedCfg?.headers || {};
      const rawEnv = customCfg?.env || managedCfg?.env || {};
      const maskedHeaders = maskKeyValueMap(rawHeaders);
      const maskedEnv = maskKeyValueMap(rawEnv);
      const hasAuth = Object.keys(maskedHeaders).length > 0 || Object.keys(maskedEnv).length > 0;
      const expandTemplates = Boolean(customCfg?.expandTemplates || managedCfg?.expandTemplates) || hasCredentialTemplate({
        url,
        command,
        args,
        cwd: srvCwd,
        headers: rawHeaders,
        env: rawEnv,
      });
      const source = customCfg ? 'custom' : managedView?.configured ? 'settings' : 'bundle';

      const srvRecord = {
        name: srvName,
        source,
        transport,
        url,
        command,
        args,
        cwd: srvCwd,
        headers: maskedHeaders,
        env: maskedEnv,
        hasAuth,
        expandTemplates,
        patchPath: hint?.patchPath || '',
        enabled: eff.enabled,
        disableReason: eff.reason,
        connectionState: connState,
        ...(connectionAttempt !== undefined ? { connectionAttempt } : {}),
        ...(connectionMaxAttempts !== undefined ? { connectionMaxAttempts } : {}),
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
      const writable = isWritableSkillLocation(sk.path || '', sk.source || '', cwd);
      return {
        name: sk.name,
        description: sk.description || '',
        whenToUse: sk.whenToUse || '',
        source: sk.source || 'user-agents',
        scopeGroup: classifySkillScope(sk.source),
        path: sk.path || '',
        skillDir: writable ? resolveSkillDirFromPath(sk.path || '') : '',
        writable,
        provider: sk.provider || 'filesystem',
        configuredMode: ov.configuredMode,
        effectiveMode: ov.effectiveMode,
        reason: ov.reason,
        bundles: ov.bundles,
      };
    });

    const mcpMap = new Map(mcps.map(m => [m.name, m]));
    const skillMap = new Map(skills.map(s => [s.name, s]));
    const rawSkillMap = new Map(rawSkills.map(s => [s.name, s]));

    const bundles = state.bundles.map(b => {
      const bMcps = (b.mcps || []).map(n => {
        const base = mcpMap.get(n) || {
          name: n,
          source: 'missing',
          transport: 'streamable-http',
          enabled: false,
          connectionState: 'missing',
          totalTools: 0,
          activeTools: 0,
          tools: [],
        };
        const globallyDisabled = state.disabledServers?.[n] === true;
        const bundleEnabled = b.disabledMcps?.[n] !== true;
        const bundleTools = (base.tools || []).map(t => {
          const hasBundleOverride = Boolean(b.disabledTools && Object.hasOwn(b.disabledTools, t.name));
          const toolEnabled = isBundleToolEnabled(b, t.name, state.disabledTools);
          return {
            ...t,
            bundleEnabled: toolEnabled,
            hasBundleOverride,
          };
        });
        const bundleActiveTools = bundleEnabled && !globallyDisabled
          ? bundleTools.filter(t => t.bundleEnabled).length
          : 0;
        return {
          ...base,
          bundleEnabled,
          globallyDisabled,
          bundleActiveTools,
          tools: bundleTools,
        };
      });
      const bSkills = (b.skills || []).map(n => {
        const base = skillMap.get(n) || {
          name: n,
          description: '当前工作区未扫描到此技能',
          source: 'missing',
          scopeGroup: 'user',
          effectiveMode: 'muted',
        };
        const rawSk = rawSkillMap.get(n) || { name: n };
        const resolved = resolveBundleSkillMode(b, rawSk, state.skillModes);
        return {
          ...base,
          bundleConfiguredMode: resolved.configuredMode,
          bundleEffectiveMode: base.source === 'missing' ? 'muted' : resolved.effectiveMode,
          globalDefaultMode: resolved.globalDefaultMode,
        };
      });
      const hasIssue = b.enabled && bMcps.some(
        m => m.bundleEnabled !== false && (m.connectionState === 'failed' || m.connectionState === 'reconnecting'),
      );
      return {
        ...b,
        defaultInject: b.defaultInject !== false,
        skillModes: b.skillModes ? { ...b.skillModes } : {},
        disabledMcps: b.disabledMcps ? { ...b.disabledMcps } : {},
        disabledTools: b.disabledTools ? { ...b.disabledTools } : {},
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

      case 'set_bundle_state': {
        const bundleId = String(payload.bundleId || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        const target = String(payload.state || '').trim();
        if (target === 'default') {
          state.bundles[idx] = { ...state.bundles[idx], enabled: true, defaultInject: true };
        } else if (target === 'on_demand') {
          state.bundles[idx] = { ...state.bundles[idx], enabled: true, defaultInject: false };
        } else if (target === 'disabled') {
          state.bundles[idx] = { ...state.bundles[idx], enabled: false };
        } else {
          return { ok: false, error: `不支持的套件状态: ${target}` };
        }
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
        const prev = existingIdx >= 0 ? state.bundles[existingIdx] : null;
        const skillModes = sanitizeBundleSkillModes(payload.skillModes ?? prev?.skillModes, skills);
        const disabledMcps = sanitizeBundleDisabledMcps(payload.disabledMcps ?? prev?.disabledMcps, mcps);
        const disabledTools = sanitizeBundleDisabledTools(payload.disabledTools ?? prev?.disabledTools, mcps);
        const record = {
          id,
          name: title,
          slug,
          description: String(payload.description || '').trim() || '自定义 MCP 与 Skills 组合套件',
          icon: String(payload.icon || 'layers'),
          color: String(payload.color || '#2563eb'),
          enabled: typeof payload.enabled === 'boolean' ? payload.enabled : (prev ? prev.enabled : true),
          defaultInject: typeof payload.defaultInject === 'boolean'
            ? payload.defaultInject
            : (prev ? prev.defaultInject !== false : true),
          mcps,
          skills,
          ...(Object.keys(skillModes).length ? { skillModes } : {}),
          ...(Object.keys(disabledMcps).length ? { disabledMcps } : {}),
          ...(Object.keys(disabledTools).length ? { disabledTools } : {}),
        };
        if (existingIdx >= 0) {
          state.bundles[existingIdx] = record;
        } else {
          state.bundles.unshift(record);
        }
        persistAndReconcile();
        return { ...(await buildStatus(payload.cwd, payload.sessionId)), savedBundleId: id };
      }

      case 'set_bundle_skill_mode': {
        const bundleId = String(payload.bundleId || '').trim();
        const skillName = String(payload.skillName || '').trim();
        const mode = String(payload.mode || 'default');
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        if (!skillName) return { ok: false, error: '技能名称不能为空' };
        if (!['default', 'auto', 'manual', 'muted'].includes(mode)) {
          return { ok: false, error: `不支持的技能模式: ${mode}` };
        }
        const b = state.bundles[idx];
        if (!Array.isArray(b.skills) || !b.skills.includes(skillName)) {
          return { ok: false, error: `套件 "${b.name}" 中未包含技能 "${skillName}"` };
        }
        const nextModes = { ...(b.skillModes || {}) };
        if (mode === 'default') delete nextModes[skillName];
        else nextModes[skillName] = mode;
        const updated = { ...b };
        if (Object.keys(nextModes).length > 0) updated.skillModes = nextModes;
        else delete updated.skillModes;
        state.bundles[idx] = updated;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'batch_bundle_skills': {
        const bundleId = String(payload.bundleId || '').trim();
        const mode = String(payload.mode || 'default');
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        if (!['default', 'auto', 'manual', 'muted'].includes(mode)) {
          return { ok: false, error: `不支持的技能模式: ${mode}` };
        }
        const b = state.bundles[idx];
        const updated = { ...b };
        if (mode === 'default') {
          delete updated.skillModes;
        } else {
          const nextModes = {};
          for (const sk of b.skills || []) nextModes[sk] = mode;
          if (Object.keys(nextModes).length > 0) updated.skillModes = nextModes;
          else delete updated.skillModes;
        }
        state.bundles[idx] = updated;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'toggle_bundle_mcp': {
        const bundleId = String(payload.bundleId || '').trim();
        const serverName = String(payload.serverName || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        if (!serverName) return { ok: false, error: 'MCP 服务名不能为空' };
        const b = state.bundles[idx];
        if (!Array.isArray(b.mcps) || !b.mcps.includes(serverName)) {
          return { ok: false, error: `套件 "${b.name}" 中未包含 MCP "${serverName}"` };
        }
        const enabled = Boolean(payload.enabled);
        const nextDisabled = { ...(b.disabledMcps || {}) };
        if (enabled) delete nextDisabled[serverName];
        else nextDisabled[serverName] = true;
        const updated = { ...b };
        if (Object.keys(nextDisabled).length > 0) updated.disabledMcps = nextDisabled;
        else delete updated.disabledMcps;
        state.bundles[idx] = updated;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'toggle_bundle_mcp_tool': {
        const bundleId = String(payload.bundleId || '').trim();
        const toolName = String(payload.toolName || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        if (!toolName) return { ok: false, error: '工具名不能为空' };
        const b = state.bundles[idx];
        const m = MCP_TOOL_RE.exec(toolName);
        if (m && (!Array.isArray(b.mcps) || !b.mcps.includes(m[1]))) {
          return { ok: false, error: `套件 "${b.name}" 中未包含 MCP "${m[1]}"` };
        }
        const enabled = Boolean(payload.enabled);
        const nextTools = { ...(b.disabledTools || {}) };
        if (enabled) {
          if (state.disabledTools?.[toolName] === true) nextTools[toolName] = false;
          else delete nextTools[toolName];
        } else {
          nextTools[toolName] = true;
        }
        const updated = { ...b };
        if (Object.keys(nextTools).length > 0) updated.disabledTools = nextTools;
        else delete updated.disabledTools;
        state.bundles[idx] = updated;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'batch_bundle_mcp_tools': {
        const bundleId = String(payload.bundleId || '').trim();
        const serverName = String(payload.serverName || '').trim();
        const idx = state.bundles.findIndex(b => b.id === bundleId);
        if (idx === -1) return { ok: false, error: `未找到套件 "${bundleId}"` };
        if (!serverName) return { ok: false, error: 'MCP 服务名不能为空' };
        const b = state.bundles[idx];
        if (!Array.isArray(b.mcps) || !b.mcps.includes(serverName)) {
          return { ok: false, error: `套件 "${b.name}" 中未包含 MCP "${serverName}"` };
        }
        const enabled = Boolean(payload.enabled);
        const { byServer } = collectMcpToolsMap();
        const nextTools = { ...(b.disabledTools || {}) };
        for (const t of byServer[serverName] || []) {
          if (enabled) {
            if (state.disabledTools?.[t] === true) nextTools[t] = false;
            else delete nextTools[t];
          } else {
            nextTools[t] = true;
          }
        }
        const updated = { ...b };
        if (Object.keys(nextTools).length > 0) updated.disabledTools = nextTools;
        else delete updated.disabledTools;
        state.bundles[idx] = updated;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
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
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'save_skill': {
        const cwd = payload.cwd || resolveDefaultCwd();
        let parsed = { name: '', description: '', whenToUse: '', content: '' };
        if (payload.rawMarkdown) {
          parsed = parseSkillMarkdown(payload.rawMarkdown);
        }
        const skillName = String(payload.skillName || parsed.name || '').trim();
        const description = String(payload.description ?? parsed.description ?? '').trim();
        const whenToUse = String(payload.whenToUse ?? parsed.whenToUse ?? '').trim();
        const content = String(payload.content ?? parsed.content ?? '').trim();
        const overwrite = Boolean(payload.overwrite);
        const scope = String(payload.scope || 'user-agents');

        if (!SKILL_NAME_RE.test(skillName)) {
          return { ok: false, error: '技能名称仅支持小写字母、数字与连字符（kebab-case，如 my-skill）' };
        }
        if (!description) {
          return { ok: false, error: '技能描述（description）不能为空' };
        }

        let targetFile = '';
        if (overwrite && payload.targetPath && isWritableSkillLocation(payload.targetPath, 'user-agents', cwd)) {
          targetFile = payload.targetPath;
        } else {
          const rootDir = resolveSkillRootDir(scope, cwd);
          if (!rootDir) return { ok: false, error: '当前没有可用的工作区目录，无法写入项目级技能' };
          const skillDir = join(rootDir, skillName);
          targetFile = join(skillDir, 'SKILL.md');
          if (!overwrite && existsSync(targetFile)) {
            return { ok: false, error: `技能 "${skillName}" 已存在于 ${skillDir}` };
          }
        }

        mkdirSync(dirname(targetFile), { recursive: true });
        writeFileSync(targetFile, formatSkillMarkdown({ name: skillName, description, whenToUse, content }), 'utf8');
        persistAndReconcile();
        return { ...(await buildStatus(cwd, payload.sessionId)), savedSkillName: skillName, savedPath: targetFile };
      }

      case 'import_skill': {
        const cwd = payload.cwd || resolveDefaultCwd();
        const sourceType = String(payload.sourceType || 'repo');
        const scope = String(payload.scope || 'user-agents');
        const overwrite = Boolean(payload.overwrite);

        if (sourceType === 'repo') {
          const cliArgs = parseRepoInstallArgs(payload.repoSpec);
          if (cliArgs.length === 0) {
            return { ok: false, error: '请填写仓库地址或包名（例如 owner/repo 或 GitHub URL）' };
          }
          const isProjectScope = scope === 'project-agents' || scope === 'project-dsh';
          const finalArgs = ['-y', 'skills', 'add', ...cliArgs, '-y'];
          if (!isProjectScope && !finalArgs.includes('-g') && !finalArgs.includes('--global')) {
            finalArgs.push('-g');
          }
          try {
            const { stdout, stderr } = await execFileAsync('npx', finalArgs, {
              cwd: cwd || homedir(),
              timeout: 120000,
              maxBuffer: 4 * 1024 * 1024,
            });
            persistAndReconcile();
            return {
              ...(await buildStatus(cwd, payload.sessionId)),
              installOutput: [stdout, stderr].filter(Boolean).join('\n').trim(),
            };
          } catch (err) {
            return { ok: false, error: `仓库安装失败: ${err?.stderr || err?.message || String(err)}` };
          }
        }

        const rootDir = resolveSkillRootDir(scope, cwd);
        if (!rootDir) return { ok: false, error: '当前没有可用的工作区目录，无法写入项目级技能' };
        mkdirSync(rootDir, { recursive: true });
        const imported = [];
        const skipped = [];

        if (sourceType === 'zip') {
          const b64 = String(payload.zipBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
          if (!b64) return { ok: false, error: '请上传有效的 .zip 压缩包' };
          let entries;
          try {
            entries = extractZipEntries(Buffer.from(b64, 'base64'));
          } catch (err) {
            return { ok: false, error: err?.message || String(err) };
          }

          const skillRoots = new Map();
          for (const e of entries) {
            const parts = e.path.split('/');
            if (parts[parts.length - 1].toLowerCase() === 'skill.md') {
              const prefix = parts.slice(0, -1).join('/');
              skillRoots.set(prefix, e.content.toString('utf8'));
            }
          }
          if (skillRoots.size === 0) {
            return { ok: false, error: '压缩包中未找到任何 SKILL.md 文件' };
          }

          for (const [prefix, mdText] of skillRoots.entries()) {
            const parsed = parseSkillMarkdown(mdText);
            const fallbackName = prefix ? prefix.split('/').pop() : '';
            const skillName = (parsed.name || fallbackName || '').trim().toLowerCase();
            if (!SKILL_NAME_RE.test(skillName) || !parsed.description) {
              skipped.push({ name: skillName || prefix || 'unknown', reason: '缺少合法的 name 或 description' });
              continue;
            }
            const destDir = join(rootDir, skillName);
            if (!overwrite && existsSync(destDir)) {
              skipped.push({ name: skillName, reason: '目标目录已存在同名技能' });
              continue;
            }
            mkdirSync(destDir, { recursive: true });
            for (const e of entries) {
              if (prefix && !e.path.startsWith(`${prefix}/`)) continue;
              const rel = prefix ? e.path.slice(prefix.length + 1) : e.path;
              if (!rel) continue;
              const outFile = join(destDir, rel);
              if (!isWithinRoot(outFile, destDir)) continue;
              mkdirSync(dirname(outFile), { recursive: true });
              writeFileSync(outFile, e.content);
            }
            imported.push(skillName);
          }
        } else if (sourceType === 'local') {
          const rawPath = String(payload.localPath || '').trim();
          const expanded = rawPath.startsWith('~/') ? join(homedir(), rawPath.slice(2)) : rawPath;
          if (!expanded || !isAbsolute(expanded) || !existsSync(expanded)) {
            return { ok: false, error: `本地路径不存在或不是绝对路径: ${rawPath}` };
          }

          const candidateDirs = [];
          if (existsSync(join(expanded, 'SKILL.md'))) {
            candidateDirs.push(expanded);
          } else {
            for (const ent of readdirSync(expanded, { withFileTypes: true })) {
              if (!ent.isDirectory() && !ent.isSymbolicLink()) continue;
              const sub = join(expanded, ent.name);
              if (existsSync(join(sub, 'SKILL.md'))) candidateDirs.push(sub);
            }
          }
          if (candidateDirs.length === 0) {
            return { ok: false, error: '所选本地目录及子目录中未找到 SKILL.md' };
          }

          for (const dir of candidateDirs) {
            const parsed = parseSkillMarkdown(readFileSync(join(dir, 'SKILL.md'), 'utf8'));
            const skillName = (parsed.name || basename(dir)).trim().toLowerCase();
            if (!SKILL_NAME_RE.test(skillName) || !parsed.description) {
              skipped.push({ name: skillName || basename(dir), reason: '缺少合法的 name 或 description' });
              continue;
            }
            const destDir = join(rootDir, skillName);
            if (!overwrite && existsSync(destDir)) {
              skipped.push({ name: skillName, reason: '目标目录已存在同名技能' });
              continue;
            }
            cpSync(dir, destDir, { recursive: true, force: overwrite, dereference: true });
            imported.push(skillName);
          }
        } else {
          return { ok: false, error: `不支持的导入来源: ${sourceType}` };
        }

        if (imported.length === 0 && skipped.length > 0) {
          return { ok: false, error: `未导入任何技能：${skipped.map(s => `${s.name}(${s.reason})`).join('；')}` };
        }
        persistAndReconcile();
        return { ...(await buildStatus(cwd, payload.sessionId)), imported, skipped };
      }

      case 'delete_skill': {
        const cwd = payload.cwd || resolveDefaultCwd();
        const skillName = String(payload.skillName || '').trim();
        const mode = payload.mode === 'permanent' ? 'permanent' : 'archive';
        if (!SKILL_NAME_RE.test(skillName)) {
          return { ok: false, error: `无效的技能名称: ${skillName}` };
        }

        const rawSkills = await listUnderlyingSkills(cwd);
        const target = rawSkills.find(s => s.name === skillName);
        if (!target) {
          return { ok: false, error: `未找到技能 "${skillName}"` };
        }
        if (!isWritableSkillLocation(target.path || '', target.source || '', cwd)) {
          return { ok: false, error: `内置或只读技能 "${skillName}" 不支持卸载，请改用「静默隐藏」` };
        }

        const targetDir = resolveSkillDirFromPath(target.path);
        const stat = lstatSync(targetDir);
        if (mode === 'permanent') {
          if (stat.isSymbolicLink()) unlinkSync(targetDir);
          else rmSync(targetDir, { recursive: true, force: true });
        } else {
          const disabledRoot = join(homedir(), '.agents', 'skills-disabled');
          mkdirSync(disabledRoot, { recursive: true });
          let dest = join(disabledRoot, skillName);
          if (existsSync(dest)) dest = join(disabledRoot, `${skillName}-${Date.now()}`);
          try {
            renameSync(targetDir, dest);
          } catch {
            if (stat.isSymbolicLink()) unlinkSync(targetDir);
            else {
              cpSync(targetDir, dest, { recursive: true, dereference: false });
              rmSync(targetDir, { recursive: true, force: true });
            }
          }
        }

        delete state.skillModes[skillName];
        for (const b of state.bundles) {
          if (Array.isArray(b.skills) && b.skills.includes(skillName)) {
            b.skills = b.skills.filter(s => s !== skillName);
          }
          if (b.skillModes && Object.hasOwn(b.skillModes, skillName)) {
            delete b.skillModes[skillName];
            if (Object.keys(b.skillModes).length === 0) delete b.skillModes;
          }
        }
        persistAndReconcile();
        return { ...(await buildStatus(cwd, payload.sessionId)), deletedSkillName: skillName, deleteMode: mode };
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
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'toggle_mcp_tool': {
        if (payload.bundleId) {
          return executeAction('toggle_bundle_mcp_tool', payload);
        }
        const toolName = String(payload.toolName || '').trim();
        if (!toolName) return { ok: false, error: '工具名不能为空' };
        const enabled = Boolean(payload.enabled);
        if (enabled) delete state.disabledTools[toolName];
        else state.disabledTools[toolName] = true;
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'batch_mcp_tools': {
        if (payload.bundleId) {
          return executeAction('batch_bundle_mcp_tools', payload);
        }
        const serverName = String(payload.serverName || '').trim();
        const enabled = Boolean(payload.enabled);
        const { byServer } = collectMcpToolsMap();
        for (const t of byServer[serverName] || []) {
          if (enabled) delete state.disabledTools[t];
          else state.disabledTools[t] = true;
        }
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
      }

      case 'save_custom_mcp': {
        const serverName = String(payload.serverName || '').trim();
        if (!SERVER_NAME_RE.test(serverName)) {
          return { ok: false, error: 'MCP 服务名称仅支持字母、数字、下划线或连字符（1-32位）' };
        }
        const prevCfg = state.customServers[serverName] || {};
        const resolveMapWithKeep = (incoming, prevMap) => {
          const clean = sanitizeKeyValueMap(incoming);
          const merged = {};
          for (const [k, v] of Object.entries(clean)) {
            if (v === '__KEEP__' && prevMap && typeof prevMap[k] === 'string') {
              merged[k] = prevMap[k];
            } else if (v !== '__KEEP__') {
              merged[k] = v;
            }
          }
          return merged;
        };
        const transport = payload.transport === 'stdio' ? 'stdio' : 'streamable-http';
        if (transport === 'streamable-http') {
          const url = String(payload.url || '').trim();
          if (!/^https?:\/\//i.test(url)) {
            return { ok: false, error: 'Streamable HTTP 需要有效的 http(s):// 地址' };
          }
          const headers = resolveMapWithKeep(payload.headers, prevCfg.headers);
          state.customServers[serverName] = {
            transport: 'streamable-http',
            url,
            headers,
            expandTemplates: Boolean(payload.expandTemplates) || hasCredentialTemplate({ url, headers }),
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
          const env = resolveMapWithKeep(payload.env, prevCfg.env);
          const serverCwd = String(payload.serverCwd || '').trim();
          state.customServers[serverName] = {
            transport: 'stdio',
            command,
            args,
            env,
            cwd: serverCwd,
            expandTemplates: Boolean(payload.expandTemplates) || hasCredentialTemplate({ command, args, env, cwd: serverCwd }),
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
        for (const b of state.bundles) {
          if (Array.isArray(b.mcps) && b.mcps.includes(serverName)) {
            b.mcps = b.mcps.filter(m => m !== serverName);
          }
          if (b.disabledMcps && Object.hasOwn(b.disabledMcps, serverName)) {
            delete b.disabledMcps[serverName];
            if (Object.keys(b.disabledMcps).length === 0) delete b.disabledMcps;
          }
          if (b.disabledTools) {
            for (const key of Object.keys(b.disabledTools)) {
              const m = MCP_TOOL_RE.exec(key);
              if (m && m[1] === serverName) delete b.disabledTools[key];
            }
            if (Object.keys(b.disabledTools).length === 0) delete b.disabledTools;
          }
        }
        persistAndReconcile();
        return buildStatus(payload.cwd, payload.sessionId);
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
            const hasBundleSkillModes = state.bundles.some(
              b => b.skillModes && Object.keys(b.skillModes).length > 0,
            );
            const hasManualSkillModes = Object.keys(state.skillModes || {}).length > 0;
            if (!hasBundleOff && !hasBundleSkillModes && !hasManualSkillModes) return [];

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
        disposeHandle(off);
        agentRestrictionDisposers.delete(agent.id);
      }
      const skillOff = sessionSkillDisposers.get(agent.id);
      if (skillOff) {
        disposeHandle(skillOff);
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
                'set_bundle_skill_mode',
                'batch_bundle_skills',
                'toggle_bundle_mcp',
                'toggle_bundle_mcp_tool',
                'batch_bundle_mcp_tools',
                'set_skill_mode',
                'save_skill',
                'import_skill',
                'delete_skill',
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
            skillName: { type: 'string', description: 'Target kebab-case skill name for set_skill_mode, read_skill, save_skill, or delete_skill.' },
            mode: {
              type: 'string',
              enum: ['default', 'auto', 'manual', 'muted', 'archive', 'permanent'],
              description: 'Skill mode (auto/manual/muted/default) or delete_skill mode (archive/permanent).',
            },
            whenToUse: { type: 'string', description: 'Optional routing hint for save_skill.' },
            content: { type: 'string', description: 'Markdown body for save_skill.' },
            rawMarkdown: { type: 'string', description: 'Full SKILL.md text with frontmatter for save_skill.' },
            scope: {
              type: 'string',
              enum: ['user-agents', 'user-dsh', 'project-agents', 'project-dsh'],
              description: 'Target directory scope for save_skill or import_skill.',
            },
            overwrite: { type: 'boolean', description: 'Overwrite existing skill when editing or importing.' },
            targetPath: { type: 'string', description: 'Existing SKILL.md path when editing in place.' },
            sourceType: { type: 'string', enum: ['repo', 'local', 'zip'], description: 'Import source type for import_skill.' },
            repoSpec: { type: 'string', description: 'Repository or skills package spec for import_skill(repo).' },
            localPath: { type: 'string', description: 'Local directory path for import_skill(local).' },
            zipBase64: { type: 'string', description: 'Base64-encoded .zip archive for import_skill(zip).' },
            serverName: { type: 'string', description: 'MCP server name ([A-Za-z0-9_-]{1,32}).' },
            toolName: { type: 'string', description: 'Full MCP tool name (mcp__<server>__<tool>) for toggle_mcp_tool.' },
            transport: { type: 'string', enum: ['streamable-http', 'stdio'], description: 'Transport for save_custom_mcp.' },
            url: { type: 'string', description: 'Endpoint URL for streamable-http save_custom_mcp.' },
            headers: {
              type: 'object',
              description: 'Optional HTTP request headers for streamable-http authentication (e.g. {"Authorization": "Bearer ${credential:MCP_TOKEN}"}).',
            },
            command: { type: 'string', description: 'Executable command for stdio save_custom_mcp.' },
            args: { type: 'array', items: { type: 'string' }, description: 'Command arguments for stdio save_custom_mcp.' },
            env: {
              type: 'object',
              description: 'Optional environment variables for stdio authentication (e.g. {"GITHUB_TOKEN": "${credential:GITHUB_TOKEN}"}).',
            },
            serverCwd: { type: 'string', description: 'Optional working directory for stdio save_custom_mcp.' },
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
