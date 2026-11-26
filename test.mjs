import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeEffectivePolicy,
  extractZipEntries,
  formatMcpJsonSnippet,
  formatSkillMarkdown,
  hasCredentialTemplate,
  isWritableSkillLocation,
  maskKeyValueMap,
  maskSecretValue,
  parseSkillMarkdown,
  resolveSkillRootDir,
  sanitizeKeyValueMap,
  seedDefaultBundles,
} from './index.js';

const root = dirname(fileURLToPath(import.meta.url));

// 1. Validate manifest and locales
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, '@fengguanghuai/dsh-capability-hub');
const zh = JSON.parse(readFileSync(join(root, 'locale/zh.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'locale/en.json'), 'utf8'));
assert.ok(zh.meta?.title && zh.meta?.description);
assert.ok(en.meta?.title && en.meta?.description);
assert.ok(readFileSync(join(root, 'icon.svg'), 'utf8').includes('<svg'));

// 2. Validate default bundle seeding starts completely empty and generic
const seeded = seedDefaultBundles(
  ['mcp_alpha', 'mcp_beta'],
  ['skill-alpha', 'skill-beta', 'skill-gamma'],
);
assert.deepEqual(seeded, []);

// 3. Validate effective policy: bundle mute, shared item protection, per-tool & per-skill override
const toolsByServer = {
  mcp_alpha: ['mcp__mcp_alpha__projects', 'mcp__mcp_alpha__logQuery'],
  mcp_beta: ['mcp__mcp_beta__publish'],
};
const skills = [
  { name: 'skill-alpha', invocation: { modelInvocable: true, userInvocable: true } },
  { name: 'skill-beta', invocation: { modelInvocable: true, userInvocable: true } },
];

// Turn off Alpha bundle -> its MCP tools and skills become muted, while Beta bundle stays active
const stateOff = {
  bundles: [
    { id: 'b1', name: 'Alpha', enabled: false, mcps: ['mcp_alpha'], skills: ['skill-alpha'] },
    { id: 'b2', name: 'Beta', enabled: true, mcps: ['mcp_beta'], skills: ['skill-beta'] },
  ],
  skillModes: { 'skill-beta': 'manual' },
  disabledServers: {},
  disabledTools: {},
};
const policy = computeEffectivePolicy(stateOff, toolsByServer, skills);
assert.ok(policy.deniedTools.has('mcp__mcp_alpha__projects'));
assert.ok(policy.deniedTools.has('mcp__mcp_alpha__logQuery'));
assert.ok(!policy.deniedTools.has('mcp__mcp_beta__publish'));

const alphaOv = policy.skillOverrides.get('skill-alpha');
assert.equal(alphaOv.effectiveMode, 'muted');
assert.equal(alphaOv.changed, true);
assert.deepEqual(alphaOv.invocation, { modelInvocable: false, userInvocable: false });

const betaOv = policy.skillOverrides.get('skill-beta');
assert.equal(betaOv.effectiveMode, 'manual');
assert.equal(betaOv.changed, true);
assert.deepEqual(betaOv.invocation, { modelInvocable: false, userInvocable: true });

// If another enabled bundle ALSO references skill-alpha, it stays active
const stateShared = {
  ...stateOff,
  bundles: [
    ...stateOff.bundles,
    { id: 'b3', name: 'Shared', enabled: true, mcps: [], skills: ['skill-alpha'] },
  ],
};
const sharedPolicy = computeEffectivePolicy(stateShared, toolsByServer, skills);
assert.equal(sharedPolicy.skillOverrides.get('skill-alpha').effectiveMode, 'auto');

// 4. Validate defaultInject=false and per-session overrides + parent inheritance
const stateSession = {
  bundles: [
    { id: 'b-alpha', name: 'Alpha', enabled: true, defaultInject: false, mcps: ['mcp_alpha'], skills: ['skill-alpha'] },
    { id: 'b-beta', name: 'Beta', enabled: true, defaultInject: true, mcps: ['mcp_beta'], skills: ['skill-beta'] },
  ],
  skillModes: {},
  disabledServers: {},
  disabledTools: {},
  sessionOverrides: {
    'sess-alpha': ['b-alpha', 'b-beta'],
    'sess-empty': [],
  },
};

// Default session (no override): b-alpha is excluded, b-beta is included
const defaultSessPolicy = computeEffectivePolicy(stateSession, toolsByServer, skills, { sessionId: 'sess-new' });
assert.equal(defaultSessPolicy.overridden, false);
assert.deepEqual(defaultSessPolicy.activeBundleIds, ['b-beta']);
assert.ok(defaultSessPolicy.deniedTools.has('mcp__mcp_alpha__projects'));
assert.ok(!defaultSessPolicy.deniedTools.has('mcp__mcp_beta__publish'));
assert.equal(defaultSessPolicy.skillOverrides.get('skill-alpha').effectiveMode, 'muted');
assert.equal(defaultSessPolicy.skillOverrides.get('skill-beta').effectiveMode, 'auto');

// Session with Alpha enabled: b-alpha is active and its tools/skills are exposed
const alphaSessPolicy = computeEffectivePolicy(stateSession, toolsByServer, skills, { sessionId: 'sess-alpha' });
assert.equal(alphaSessPolicy.overridden, true);
assert.deepEqual(alphaSessPolicy.activeBundleIds, ['b-alpha', 'b-beta']);
assert.ok(!alphaSessPolicy.deniedTools.has('mcp__mcp_alpha__projects'));
assert.equal(alphaSessPolicy.skillOverrides.get('skill-alpha').effectiveMode, 'auto');

// Subagent session inherits parentSession override when it has no own override
const childSessPolicy = computeEffectivePolicy(stateSession, toolsByServer, skills, {
  sessionId: 'sess-child',
  resolveParentSessionId: sid => (sid === 'sess-child' ? 'sess-alpha' : undefined),
});
assert.equal(childSessPolicy.overridden, false);
assert.deepEqual(childSessPolicy.activeBundleIds, ['b-alpha', 'b-beta']);
assert.ok(!childSessPolicy.deniedTools.has('mcp__mcp_alpha__projects'));

// Session explicitly cleared
const emptySessPolicy = computeEffectivePolicy(stateSession, toolsByServer, skills, { sessionId: 'sess-empty' });
assert.equal(emptySessPolicy.overridden, true);
assert.deepEqual(emptySessPolicy.activeBundleIds, []);
assert.ok(emptySessPolicy.deniedTools.has('mcp__mcp_beta__publish'));

// 5. Validate SKILL.md serialization/parsing and writable location checks
const formatted = formatSkillMarkdown({
  name: 'demo-skill',
  description: 'A demo skill: handles tasks cleanly',
  whenToUse: 'Use for demos',
  content: '# Demo\n\nFollow these steps.',
});
const parsed = parseSkillMarkdown(formatted);
assert.equal(parsed.name, 'demo-skill');
assert.equal(parsed.description, 'A demo skill: handles tasks cleanly');
assert.equal(parsed.whenToUse, 'Use for demos');
assert.equal(parsed.content, '# Demo\n\nFollow these steps.');

const userAgentsRoot = resolveSkillRootDir('user-agents', '/tmp/work');
assert.equal(isWritableSkillLocation(`${userAgentsRoot}/demo-skill/SKILL.md`, 'user-agents', '/tmp/work'), true);
assert.equal(isWritableSkillLocation(`${userAgentsRoot}/demo-skill/SKILL.md`, 'bundled', '/tmp/work'), false);
assert.equal(isWritableSkillLocation('/Applications/DeepSeek Harness.app/dsh-doc/SKILL.md', 'bundled', '/tmp/work'), false);

// 6. Validate pure-Node ZIP extraction
function buildStoredZip(filename, contentStr) {
  const nameBuf = Buffer.from(filename, 'utf8');
  const dataBuf = Buffer.from(contentStr, 'utf8');
  const local = Buffer.alloc(30 + nameBuf.length + dataBuf.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 8);
  local.writeUInt32LE(dataBuf.length, 18);
  local.writeUInt32LE(dataBuf.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  nameBuf.copy(local, 30);
  dataBuf.copy(local, 30 + nameBuf.length);

  const cd = Buffer.alloc(46 + nameBuf.length);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 10);
  cd.writeUInt32LE(dataBuf.length, 20);
  cd.writeUInt32LE(dataBuf.length, 24);
  cd.writeUInt16LE(nameBuf.length, 28);
  cd.writeUInt32LE(0, 42);
  nameBuf.copy(cd, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(local.length, 16);
  return Buffer.concat([local, cd, eocd]);
}
const zipBuf = buildStoredZip('demo-skill/SKILL.md', formatted);
const zipEntries = extractZipEntries(zipBuf);
assert.equal(zipEntries.length, 1);
assert.equal(zipEntries[0].path, 'demo-skill/SKILL.md');
assert.equal(zipEntries[0].content.toString('utf8'), formatted);

// 7. Validate MCP auth helpers: sanitize, secret masking, credential templates, JSON snippet
assert.deepEqual(
  sanitizeKeyValueMap({ Authorization: 'Bearer tok', ' ': 'x', Empty: '   ', __proto__: 'bad' }),
  { Authorization: 'Bearer tok' },
);
assert.equal(maskSecretValue('Bearer sk-1234567890abcd'), 'Bearer sk-1****abcd');
assert.equal(maskSecretValue('short'), '****');
assert.equal(maskSecretValue('Bearer ${credential:MCP_TOKEN}'), 'Bearer ${credential:MCP_TOKEN}');
assert.deepEqual(
  maskKeyValueMap({ Authorization: 'Bearer sk-1234567890abcd', 'X-API-Key': '${credential:API_KEY}' }),
  { Authorization: 'Bearer sk-1****abcd', 'X-API-Key': '${credential:API_KEY}' },
);
assert.equal(hasCredentialTemplate({ headers: { Authorization: 'Bearer ${credential:MCP_TOKEN}' } }), true);
assert.equal(hasCredentialTemplate({ headers: { Authorization: 'Bearer plain-secret-token' } }), false);
const httpSnippet = JSON.parse(formatMcpJsonSnippet({
  name: 'remote_api',
  transport: 'streamable-http',
  url: 'https://mcp.example.com/mcp',
  headers: { Authorization: 'Bearer sk-1234567890abcd' },
}));
assert.equal(httpSnippet.mcpServers.remote_api.headers.Authorization, 'Bearer sk-1****abcd');
const stdioSnippet = JSON.parse(formatMcpJsonSnippet({
  name: 'gh_local',
  transport: 'stdio',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_TOKEN: '${credential:GITHUB_TOKEN}' },
}));
assert.equal(stdioSnippet.mcpServers.gh_local.env.GITHUB_TOKEN, '${credential:GITHUB_TOKEN}');
assert.equal(stdioSnippet.mcpServers.gh_local.expandTemplates, true);

// 8. Validate Option B: per-bundle independent skill modes, MCP pause, and MCP tool subsets
const sharedToolsByServer = {
  ftd_mcp: ['mcp__ftd_mcp__query', 'mcp__ftd_mcp__logs', 'mcp__ftd_mcp__deploy'],
};
const sharedSkills = [
  { name: 'skill-ops', invocation: { modelInvocable: true, userInvocable: true } },
  { name: 'skill-audit', invocation: { modelInvocable: true, userInvocable: true } },
];
const statePerBundle = {
  bundles: [
    {
      id: 'b-readonly',
      name: 'Readonly',
      enabled: true,
      defaultInject: false,
      mcps: ['ftd_mcp'],
      skills: ['skill-ops', 'skill-audit'],
      skillModes: { 'skill-ops': 'manual', 'skill-audit': 'auto' },
      disabledTools: { mcp__ftd_mcp__deploy: true, mcp__ftd_mcp__logs: false },
    },
    {
      id: 'b-deploy',
      name: 'Deploy',
      enabled: true,
      defaultInject: false,
      mcps: ['ftd_mcp'],
      skills: ['skill-ops'],
      skillModes: { 'skill-ops': 'auto' },
      disabledTools: { mcp__ftd_mcp__query: true, mcp__ftd_mcp__logs: true },
    },
    {
      id: 'b-paused-mcp',
      name: 'PausedMCP',
      enabled: true,
      defaultInject: false,
      mcps: ['ftd_mcp'],
      skills: ['skill-ops'],
      skillModes: { 'skill-ops': 'muted' },
      disabledMcps: { ftd_mcp: true },
    },
  ],
  skillModes: { 'skill-audit': 'muted' }, // global mute, overridden to auto in b-readonly
  disabledServers: {},
  disabledTools: { mcp__ftd_mcp__logs: true }, // global disable, overridden to false (enabled) in b-readonly
  sessionOverrides: {
    'sess-ro': ['b-readonly'],
    'sess-dep': ['b-deploy'],
    'sess-both': ['b-readonly', 'b-deploy'],
    'sess-paused': ['b-paused-mcp'],
  },
};

// Session with only Readonly suite: query & logs allowed (logs overrides global disable), deploy denied; skill-ops=manual, skill-audit=auto (overrides global mute)
const roPolicy = computeEffectivePolicy(statePerBundle, sharedToolsByServer, sharedSkills, { sessionId: 'sess-ro' });
assert.equal(roPolicy.serverEffectiveEnabled.get('ftd_mcp').enabled, true);
assert.equal(roPolicy.deniedTools.has('mcp__ftd_mcp__query'), false);
assert.equal(roPolicy.deniedTools.has('mcp__ftd_mcp__logs'), false);
assert.equal(roPolicy.deniedTools.has('mcp__ftd_mcp__deploy'), true);
assert.equal(roPolicy.skillOverrides.get('skill-ops').effectiveMode, 'manual');
assert.equal(roPolicy.skillOverrides.get('skill-audit').effectiveMode, 'auto');

// Session with only Deploy suite: deploy allowed, query & logs denied; skill-ops=auto, skill-audit=muted (not in b-deploy)
const depPolicy = computeEffectivePolicy(statePerBundle, sharedToolsByServer, sharedSkills, { sessionId: 'sess-dep' });
assert.equal(depPolicy.deniedTools.has('mcp__ftd_mcp__query'), true);
assert.equal(depPolicy.deniedTools.has('mcp__ftd_mcp__logs'), true);
assert.equal(depPolicy.deniedTools.has('mcp__ftd_mcp__deploy'), false);
assert.equal(depPolicy.skillOverrides.get('skill-ops').effectiveMode, 'auto');
assert.equal(depPolicy.skillOverrides.get('skill-audit').effectiveMode, 'muted');

// Session with BOTH Readonly + Deploy: union of allowed tools (all 3 allowed), highest skill mode wins (auto > manual)
const bothPolicy = computeEffectivePolicy(statePerBundle, sharedToolsByServer, sharedSkills, { sessionId: 'sess-both' });
assert.equal(bothPolicy.deniedTools.has('mcp__ftd_mcp__query'), false);
assert.equal(bothPolicy.deniedTools.has('mcp__ftd_mcp__logs'), false);
assert.equal(bothPolicy.deniedTools.has('mcp__ftd_mcp__deploy'), false);
assert.equal(bothPolicy.skillOverrides.get('skill-ops').effectiveMode, 'auto');
assert.equal(bothPolicy.skillOverrides.get('skill-audit').effectiveMode, 'auto');

// Session with PausedMCP suite: MCP disabled inside suite -> server disabled with bundle-override reason; skill-ops muted with bundle-override
const pausedPolicy = computeEffectivePolicy(statePerBundle, sharedToolsByServer, sharedSkills, { sessionId: 'sess-paused' });
assert.equal(pausedPolicy.serverEffectiveEnabled.get('ftd_mcp').enabled, false);
assert.equal(pausedPolicy.serverEffectiveEnabled.get('ftd_mcp').reason, 'bundle-override');
assert.equal(pausedPolicy.deniedTools.has('mcp__ftd_mcp__query'), true);
assert.equal(pausedPolicy.skillOverrides.get('skill-ops').effectiveMode, 'muted');
assert.equal(pausedPolicy.skillOverrides.get('skill-ops').reason, 'bundle-override');

console.log('ALL_CHECKS_PASSED');
