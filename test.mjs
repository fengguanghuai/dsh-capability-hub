import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeEffectivePolicy, seedDefaultBundles } from './index.js';

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

console.log('ALL_CHECKS_PASSED');
