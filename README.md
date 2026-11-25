# @fengguanghuai/dsh-capability-hub

Codex-style unified capability hub for DeepSeek Harness (`sidebar.panellist` + `main` + `capability_hub` agent tool).

## Installation

In DeepSeek Harness, open **Plugins → Install** and enter:

```text
github:fengguanghuai/dsh-capability-hub
```

or:

```text
https://github.com/fengguanghuai/dsh-capability-hub.git
```

## Features

- **Top-left sidebar entry (`能力套件` / `Capability suites`)**: One-click global panel right below **New Session**.
- **Switchable capability bundles**: Group related MCP servers and Skills into project/scenario suites and toggle them together without dirtying repository `SKILL.md` files.
- **Granular Skill & MCP control**: Inspect `SKILL.md` instructions, switch skills between automatic, `/skill`-only, and muted states, toggle individual `mcp__<server>__<tool>` tools across live and new sessions, and connect custom `stdio` / `streamable-http` MCP servers.
