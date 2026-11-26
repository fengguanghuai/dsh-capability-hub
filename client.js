window.__ModuleLoader__.load({
  id: '@fengguanghuai/dsh-capability-hub',
  factory(require) {
    const React = require('react');
    const ReactDOM = (() => {
      try {
        return require('react-dom');
      } catch {
        return null;
      }
    })();
    const h = React.createElement;
    const { useState, useEffect, useMemo, useCallback, useRef } = React;

    const NS = 'capability-hub';
    const PANEL_ID = 'capability-hub';
    const API_URL = 'api/capability-hub';

    const zh = {
      'nav': '能力中心',
      'header.title': '能力中心',
      'hero.title': '按你的方式编排能力',
      'hero.subtitle': '统一管理场景套件、本地与全局 Skills 及 MCP 工具集，切换工作场景时一键收起无关上下文。',
      'btn.newBundle': '+ 新建套件',
      'btn.addSkill': '+ 添加 Skill',
      'btn.connectMcp': '+ 连接 MCP',
      'btn.refresh': '刷新',
      'btn.back': '← 返回套件列表',
      'btn.editBundle': '编辑套件',
      'btn.edit': '编辑',
      'btn.deleteBundle': '删除',
      'btn.save': '保存更改',
      'btn.create': '创建并启用',
      'btn.cancel': '取消',
      'btn.copy': '复制 JSON',
      'btn.copied': '已复制',
      'btn.copyPath': '复制路径',
      'btn.restart': '重连服务',
      'btn.enableAll': '全部开启',
      'btn.disableAll': '全部关闭',
      'tab.bundles': '套件',
      'tab.skills': 'Skills',
      'tab.mcps': 'MCPs',
      'subtab.skills': 'Skills',
      'subtab.mcps': 'MCPs',
      'search.placeholder': '搜索套件、Skill 或 MCP 工具…',
      'filter.all': '全部',
      'filter.enabled': '已启用',
      'filter.muted': '已静默',
      'filter.project': '当前项目 (.dsh / .agents)',
      'filter.user': '用户全局 (~/.agents)',
      'filter.system': '内置与运行时',
      'filter.nonAuto': '仅手动 / 已静默',
      'filter.bundleMcp': '插件内置 (Bundle)',
      'filter.customMcp': '自定义连接',
      'budget.label': '自动暴露 {skills} 技能 · {tools} 工具',
      'budget.ratio': '预算 {pct}%',
      'status.active': '已启用',
      'status.muted': '已静默',
      'status.mutedByBundle': '随套件静默',
      'status.connected': '已连接',
      'status.connecting': '连接中',
      'status.reconnecting': '重连中',
      'status.failed': '连接异常',
      'btn.restarting': '连接中…',
      'mode.default': '跟随默认',
      'mode.auto': '自动触发',
      'mode.manual': '仅手动 /skill',
      'mode.muted': '静默隐藏',
      'scope.project': '项目级',
      'scope.user': '用户全局',
      'scope.system': '内置',
      'empty.list': '没有匹配的条目',
      'loading': '正在加载能力目录…',
      'defaultInject.on': '默认注入',
      'defaultInject.off': '仅按需',
      'composer.suites': '套件',
      'composer.title': '本会话注入套件',
      'composer.reset': '恢复默认',
      'composer.usingDefault': '使用默认策略',
      'composer.footerHint': '仅影响当前会话',
      'suiteState.default': '默认开启',
      'suiteState.onDemand': '按需',
      'suiteState.disabled': '停用',
      'mcp.globalStop': '全局停用',
      'mcp.globalRestore': '恢复全局',
      'modal.globalStopTitle': '全局停用「{name}」？',
      'modal.globalStopBody': '停用后所有套件与会话都会暂停该 MCP（适合服务异常或鉴权失效时紧急断流）。若只想在单个场景关闭，去对应套件关掉即可。',
      'modal.deleteSuiteTitle': '删除套件「{name}」？',
      'modal.deleteSuiteBody': '仅删除套件分组配置，不会删除本地 Skill 文件或 MCP 连接。',
      'modal.keepCurrent': '取消',
      'modal.confirmGlobalStop': '确认停用',
      'modal.confirmDelete': '确认删除',
      'toast.mcpGlobalStopped': '已全局停用 {name}',
      'toast.mcpGlobalRestored': '已恢复 {name}',
    };

    const en = {
      'nav': 'Capability Hub',
      'header.title': 'Capability Hub',
      'hero.title': 'Make Harness work your way',
      'hero.subtitle': 'Organize switchable bundles, local and global skills, and MCP tools in one quiet workspace.',
      'btn.newBundle': '+ New suite',
      'btn.addSkill': '+ Add Skill',
      'btn.connectMcp': '+ Connect MCP',
      'btn.refresh': 'Refresh',
      'btn.back': '← Back to suites',
      'btn.editBundle': 'Edit suite',
      'btn.edit': 'Edit',
      'btn.deleteBundle': 'Delete',
      'btn.save': 'Save changes',
      'btn.create': 'Create suite',
      'btn.cancel': 'Cancel',
      'btn.copy': 'Copy JSON',
      'btn.copied': 'Copied',
      'btn.copyPath': 'Copy path',
      'btn.restart': 'Reconnect',
      'btn.enableAll': 'Enable all',
      'btn.disableAll': 'Disable all',
      'tab.bundles': 'Suites',
      'tab.skills': 'Skills',
      'tab.mcps': 'MCPs',
      'subtab.skills': 'Metadata & skills',
      'subtab.mcps': 'MCPs',
      'search.placeholder': 'Search suites, skills, or MCP tools…',
      'filter.all': 'All',
      'filter.enabled': 'Enabled',
      'filter.muted': 'Muted',
      'filter.project': 'Project (.dsh / .agents)',
      'filter.user': 'User global (~/.agents)',
      'filter.system': 'Built-in & runtime',
      'filter.nonAuto': 'Manual / Muted',
      'filter.bundleMcp': 'Bundle MCP',
      'filter.customMcp': 'Custom MCP',
      'budget.label': '{skills} auto skills · {tools} tools',
      'budget.ratio': 'Budget {pct}%',
      'status.active': 'Enabled',
      'status.muted': 'Muted',
      'status.mutedByBundle': 'Muted by suite',
      'status.connected': 'Connected',
      'status.connecting': 'Connecting',
      'status.reconnecting': 'Reconnecting',
      'status.failed': 'Issue',
      'btn.restarting': 'Connecting…',
      'mode.default': 'Default',
      'mode.auto': 'Auto',
      'mode.manual': 'Manual /skill',
      'mode.muted': 'Muted',
      'scope.project': 'Project',
      'scope.user': 'User',
      'scope.system': 'Built-in',
      'empty.list': 'No matching items found',
      'loading': 'Loading capability catalog…',
      'defaultInject.on': 'Default on',
      'defaultInject.off': 'On-demand',
      'composer.suites': 'Suites',
      'composer.title': 'Session suites',
      'composer.reset': 'Reset default',
      'composer.usingDefault': 'Using defaults',
      'composer.footerHint': 'Applies to this session only',
      'suiteState.default': 'Default',
      'suiteState.onDemand': 'On-demand',
      'suiteState.disabled': 'Off',
      'mcp.globalStop': 'Disable globally',
      'mcp.globalRestore': 'Restore',
      'modal.globalStopTitle': 'Disable "{name}" globally?',
      'modal.globalStopBody': 'This pauses the MCP across all suites and sessions. To disable it for one workflow only, turn it off inside that suite.',
      'modal.deleteSuiteTitle': 'Delete suite "{name}"?',
      'modal.deleteSuiteBody': 'Only the suite grouping is removed. Local Skill files and MCP connections are kept.',
      'modal.keepCurrent': 'Cancel',
      'modal.confirmGlobalStop': 'Disable',
      'modal.confirmDelete': 'Delete',
      'toast.mcpGlobalStopped': 'Disabled {name} globally',
      'toast.mcpGlobalRestored': 'Restored {name}',
    };

    const STYLES = `
      .ch-root {
        position: relative;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-width: 0;
        box-sizing: border-box;
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary, #1f2328);
        font-size: 13px;
        line-height: 1.5;
        overflow: hidden;
      }
      .ch-root *, .ch-root *::before, .ch-root *::after {
        box-sizing: border-box;
      }
      .ch-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 48px;
        padding: 8px 24px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        flex-shrink: 0;
        flex-wrap: wrap;
      }
      .ch-breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #1f2328);
        min-width: 0;
      }
      .ch-breadcrumb-muted {
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        font-weight: 500;
        cursor: pointer;
      }
      .ch-breadcrumb-muted:hover {
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-topbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ch-budget-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 28px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.08));
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.12));
        font-size: 11.5px;
        color: var(--dsw-alias-label-secondary, #5c6570);
        white-space: nowrap;
      }
      .ch-meter-track {
        width: 44px;
        height: 5px;
        border-radius: 999px;
        background: var(--dsw-alias-border-l2, rgba(127,127,127,0.22));
        overflow: hidden;
      }
      .ch-meter-fill {
        height: 100%;
        border-radius: 999px;
        background: var(--dsw-alias-state-success-primary, #18794e);
        transition: width 0.2s ease;
      }
      .ch-meter-fill.warn {
        background: var(--dsw-alias-state-warn-primary, #d97706);
      }
      .ch-scroll {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 28px 32px 56px;
        box-sizing: border-box;
      }
      .ch-container {
        max-width: 920px;
        margin: 0 auto;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
      }
      .ch-hero {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 22px;
        flex-wrap: wrap;
      }
      .ch-hero-title {
        margin: 0;
        font-size: 22px;
        font-weight: 650;
        letter-spacing: -0.02em;
        line-height: 1.25;
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-hero-sub {
        margin: 6px 0 0;
        font-size: 13px;
        color: var(--dsw-alias-label-secondary, #5c6570);
      }
      .ch-hero-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ch-btn {
        height: 32px;
        padding: 0 12px;
        border-radius: 8px;
        font: inherit;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        white-space: nowrap;
        border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2));
        background: var(--dsw-alias-bg-base, transparent);
        color: var(--dsw-alias-label-primary, #1f2328);
        transition: background-color 0.12s, border-color 0.12s, opacity 0.12s;
      }
      .ch-btn:hover:not(:disabled) {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.08));
      }
      .ch-btn:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .ch-btn-primary {
        background: var(--dsw-alias-button-contrast-fill, var(--dsw-alias-label-primary, #141416));
        color: var(--dsw-alias-bg-base, #ffffff);
        border-color: transparent;
      }
      .ch-btn-primary:hover:not(:disabled) {
        opacity: 0.88;
        background: var(--dsw-alias-button-contrast-fill, var(--dsw-alias-label-primary, #141416));
      }
      .ch-btn-sm {
        height: 26px;
        padding: 0 9px;
        font-size: 12px;
        border-radius: 6px;
      }
      .ch-btn-danger {
        color: var(--dsw-alias-state-error-primary, #e5484d);
        border-color: var(--dsw-alias-border-l2, rgba(229,72,77,0.3));
      }
      .ch-btn-danger:hover:not(:disabled) {
        background: var(--dsw-alias-interactive-bg-hover-danger, rgba(229,72,77,0.1));
      }
      .ch-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .ch-tabs {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .ch-tab {
        position: relative;
        height: 38px;
        padding: 0 2px;
        border: none;
        background: transparent;
        font: inherit;
        font-size: 13.5px;
        font-weight: 500;
        color: var(--dsw-alias-label-secondary, #5c6570);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .ch-tab:hover {
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-tab.active {
        color: var(--dsw-alias-label-primary, #1f2328);
        font-weight: 600;
      }
      .ch-tab.active::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: -1px;
        height: 2px;
        border-radius: 2px;
        background: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-tab-count {
        font-size: 11.5px;
        font-weight: 500;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
      }
      .ch-dot-warn {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--dsw-alias-state-warn-primary, #ea580c);
        display: inline-block;
      }
      .ch-filters {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 6px;
        flex-wrap: wrap;
      }
      .ch-search-wrap {
        position: relative;
        display: inline-flex;
        align-items: center;
      }
      .ch-search-icon {
        position: absolute;
        left: 9px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        pointer-events: none;
        display: inline-flex;
      }
      .ch-input, .ch-select, .ch-textarea {
        font: inherit;
        font-size: 12.5px;
        color: var(--dsw-alias-label-primary, #1f2328);
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.07));
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.16));
        border-radius: 8px;
        outline: none;
        transition: border-color 0.12s, background-color 0.12s;
      }
      .ch-input:focus, .ch-select:focus, .ch-textarea:focus {
        border-color: var(--dsw-alias-border-selected, var(--dsw-alias-brand-primary, #3b6fd8));
        background: var(--dsw-alias-bg-base, transparent);
      }
      .ch-search-input {
        height: 30px;
        width: 210px;
        padding: 0 10px 0 28px;
        border-radius: 999px;
      }
      .ch-select {
        height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        cursor: pointer;
      }
      .ch-state-seg {
        display: inline-flex;
        align-items: center;
        padding: 3px;
        border-radius: 9px;
        background: rgba(127, 127, 127, 0.11);
        gap: 2px;
        flex-shrink: 0;
      }
      .ch-state-btn {
        height: 24px;
        padding: 0 10px;
        border: none;
        border-radius: 6.5px;
        background: transparent;
        color: var(--dsw-alias-label-tertiary, #717680);
        font: inherit;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: background-color 0.14s, color 0.14s, box-shadow 0.14s;
      }
      .ch-state-btn:hover {
        color: var(--dsw-alias-label-primary, #18181b);
      }
      .ch-state-btn.active {
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary, #18181b);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06);
      }
      .ch-state-btn.active.is-disabled {
        color: var(--dsw-alias-label-secondary, #59636e);
      }
      .ch-suite-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 26px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(127, 127, 127, 0.26);
        background: rgba(127, 127, 127, 0.06);
        color: var(--dsw-alias-label-secondary, #424a53);
        font: inherit;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: background-color 0.12s, border-color 0.12s, color 0.12s;
      }
      .ch-suite-chip:hover {
        background: rgba(127, 127, 127, 0.12);
        border-color: rgba(127, 127, 127, 0.42);
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-suite-menu {
        position: fixed;
        z-index: 90;
        min-width: 210px;
        max-width: 280px;
        padding: 5px;
        border-radius: 12px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid rgba(127, 127, 127, 0.22);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ch-suite-menu-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        padding: 7px 10px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--dsw-alias-label-primary, #1f2328);
        font: inherit;
        font-size: 12.5px;
        text-align: left;
        cursor: pointer;
      }
      .ch-suite-menu-item:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.09));
      }
      .ch-suite-menu-state {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        flex-shrink: 0;
      }
      .ch-detail-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      .ch-section-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 4px 8px;
        font-size: 11.5px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
      }
      .ch-list {
        display: flex;
        flex-direction: column;
      }
      .ch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 8px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.12));
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.12s;
      }
      .ch-row:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.05));
      }
      .ch-row-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        flex: 1;
      }
      .ch-squircle {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.1));
        color: var(--dsw-alias-label-secondary, #5c6570);
      }
      .ch-squircle.lg {
        width: 48px;
        height: 48px;
        border-radius: 12px;
      }
      .ch-row-meta {
        min-width: 0;
        flex: 1;
      }
      .ch-row-title-line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ch-row-name {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-mono {
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
      }
      .ch-slug {
        font-size: 11.5px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
      }
      .ch-row-desc {
        margin-top: 2px;
        font-size: 12.5px;
        color: var(--dsw-alias-label-secondary, #5c6570);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ch-row-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }
      .ch-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 21px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.1));
        color: var(--dsw-alias-label-secondary, #5c6570);
      }
      .ch-pill.ok {
        background: var(--dsw-alias-state-success-tertiary, rgba(24,121,78,0.13));
        color: var(--dsw-alias-state-success-primary, #18794e);
      }
      .ch-pill.warn {
        background: var(--dsw-alias-state-warn-tertiary, rgba(217,119,6,0.14));
        color: var(--dsw-alias-state-warn-primary, #b45309);
      }
      .ch-pill.info {
        background: var(--dsw-alias-state-business-tertiary, rgba(37,99,235,0.12));
        color: var(--dsw-alias-state-business-primary, #2563eb);
      }
      @keyframes ch-spin {
        to { transform: rotate(360deg); }
      }
      .ch-spinner {
        display: inline-block;
        width: 11px;
        height: 11px;
        border: 1.8px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: ch-spin 0.75s linear infinite;
        flex-shrink: 0;
      }
      .ch-switch {
        position: relative;
        width: 34px;
        height: 20px;
        border-radius: 999px;
        border: none;
        padding: 0;
        cursor: pointer;
        background: var(--dsw-alias-border-l1, rgba(127,127,127,0.32));
        transition: background-color 0.16s ease;
        flex-shrink: 0;
      }
      .ch-switch.on {
        background: var(--dsw-alias-state-success-primary, #18794e);
      }
      .ch-switch.muted {
        opacity: 0.65;
      }
      .ch-switch::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--dsw-alias-switch-thumb, #ffffff);
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        transition: transform 0.16s cubic-bezier(0.2, 0, 0, 1);
      }
      .ch-switch.on::after {
        transform: translateX(14px);
      }
      .ch-detail-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 20px;
        margin: 14px 0 20px;
        flex-wrap: wrap;
      }
      .ch-detail-id {
        display: flex;
        align-items: flex-start;
        gap: 14px;
        flex: 1;
        min-width: 240px;
      }
      .ch-status-cols {
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .ch-status-col {
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: flex-start;
      }
      .ch-status-label {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
      }
      .ch-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .ch-table th {
        text-align: left;
        font-size: 11.5px;
        font-weight: 500;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        padding: 8px 8px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.16));
        box-sizing: border-box;
      }
      .ch-table td {
        padding: 11px 8px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.1));
        font-size: 12.5px;
        vertical-align: middle;
        box-sizing: border-box;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .ch-table-nowrap {
        white-space: nowrap;
        overflow-wrap: normal;
        word-break: normal;
      }
      .ch-table-desc {
        color: var(--dsw-alias-label-secondary, #5c6570);
        overflow-wrap: anywhere;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .ch-table tr.clickable {
        cursor: pointer;
      }
      .ch-table tr.clickable:hover td {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.05));
      }
      .ch-backdrop {
        position: absolute;
        inset: 0;
        background: var(--dsw-alias-bg-mask-1, rgba(0,0,0,0.24));
        z-index: 20;
      }
      .ch-drawer {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 450px;
        max-width: 92%;
        background: var(--dsw-alias-bg-base, #ffffff);
        border-left: 1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.2));
        box-shadow: -12px 0 32px rgba(0,0,0,0.14);
        z-index: 30;
        display: flex;
        flex-direction: column;
      }
      .ch-drawer-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        flex-shrink: 0;
      }
      .ch-drawer-title {
        font-size: 14px;
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ch-drawer-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      .ch-drawer-foot {
        padding: 12px 18px;
        border-top: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        flex-shrink: 0;
      }
      .ch-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
      }
      .ch-label {
        font-size: 12px;
        font-weight: 500;
        color: var(--dsw-alias-label-secondary, #5c6570);
      }
      .ch-field-input {
        height: 34px;
        padding: 0 10px;
        width: 100%;
      }
      .ch-textarea {
        padding: 8px 10px;
        width: 100%;
        min-height: 66px;
        resize: vertical;
      }
      .ch-seg {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        padding: 3px;
        border-radius: 8px;
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.1));
      }
      .ch-seg-btn {
        min-height: 28px;
        padding: 4px 6px;
        border: none;
        border-radius: 6px;
        background: transparent;
        font: inherit;
        font-size: 11.5px;
        line-height: 1.25;
        color: var(--dsw-alias-label-secondary, #5c6570);
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ch-seg-btn.active {
        background: var(--dsw-alias-bg-base, #ffffff);
        color: var(--dsw-alias-label-primary, #1f2328);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      }
      .ch-code-box {
        border-radius: 8px;
        background: var(--dsw-alias-markdown-code-block, var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.08)));
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        overflow: hidden;
      }
      .ch-code-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.12));
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
      }
      .ch-pre {
        margin: 0;
        padding: 10px 12px;
        font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
        font-size: 11.5px;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 280px;
        overflow-y: auto;
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-checklist {
        max-height: 175px;
        overflow-y: auto;
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.16));
        border-radius: 8px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ch-check-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
      }
      .ch-check-item:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.06));
      }
      .ch-swatches {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ch-swatch {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 2px solid transparent;
        cursor: pointer;
      }
      .ch-swatch.selected {
        border-color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-empty {
        padding: 40px 16px;
        text-align: center;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        font-size: 13px;
      }
      .ch-banner-err {
        padding: 8px 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        background: var(--dsw-alias-state-warn-tertiary, rgba(229,72,77,0.1));
        color: var(--dsw-alias-state-error-primary, #e5484d);
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ch-toast {
        position: absolute;
        left: 50%;
        top: 62px;
        transform: translateX(-50%);
        z-index: 60;
        width: max-content;
        max-width: min(520px, calc(100% - 32px));
        padding: 9px 14px;
        border-radius: 999px;
        background: var(--dsw-alias-label-primary, #1f2328);
        color: var(--dsw-alias-bg-base, #ffffff);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
        font-size: 12.5px;
        line-height: 1.4;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .ch-toast-close {
        border: none;
        background: transparent;
        color: inherit;
        opacity: 0.72;
        cursor: pointer;
        padding: 0 2px;
        font-size: 12px;
        line-height: 1;
      }
      .ch-toast-close:hover {
        opacity: 1;
      }
      .ch-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 80;
        background: rgba(15, 23, 42, 0.34);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .ch-modal {
        width: min(440px, 100%);
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.16));
        border-radius: 20px;
        padding: 24px 26px 22px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }
      .ch-modal-title {
        margin: 0;
        font-size: 16.5px;
        font-weight: 650;
        line-height: 1.4;
      }
      .ch-modal-close {
        border: none;
        background: transparent;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        cursor: pointer;
        padding: 2px 4px;
        font-size: 16px;
        line-height: 1;
        border-radius: 6px;
      }
      .ch-modal-close:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.08));
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-modal-body {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.65;
        color: var(--dsw-alias-label-secondary, #424a53);
      }
      .ch-modal-suites {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
      }
      .ch-modal-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-top: 22px;
        flex-wrap: wrap;
      }
      .ch-modal-btn-primary {
        border: none;
        border-radius: 10px;
        padding: 9px 20px;
        background: var(--dsw-alias-label-primary, #1f2328);
        color: var(--dsw-alias-bg-base, #ffffff);
        font: inherit;
        font-size: 13px;
        font-weight: 550;
        cursor: pointer;
        transition: opacity 0.12s;
      }
      .ch-modal-btn-primary:hover {
        opacity: 0.88;
      }
      .ch-modal-btn-secondary {
        border: none;
        border-radius: 10px;
        padding: 9px 16px;
        background: transparent;
        color: var(--dsw-alias-label-primary, #1f2328);
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.12s;
      }
      .ch-modal-btn-secondary:hover {
        background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,0.09));
      }
      .ch-default-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.2));
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.06));
        color: var(--dsw-alias-label-secondary, #5c6570);
        font: inherit;
        font-size: 11px;
        cursor: pointer;
        white-space: nowrap;
        transition: background .12s, border-color .12s, color .12s;
      }
      .ch-default-pill:hover {
        border-color: var(--dsw-alias-border-l2, rgba(127,127,127,0.35));
      }
      .ch-default-pill.on {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.35);
        color: #059669;
      }
      .ch-default-pill.off {
        background: rgba(245, 158, 11, 0.12);
        border-color: rgba(245, 158, 11, 0.35);
        color: #b45309;
      }
      .ch-composer-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 28px;
        padding: 0 9px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--dsw-alias-label-secondary, #5c6570);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
        white-space: nowrap;
        transition: background .12s, border-color .12s, color .12s;
      }
      .ch-composer-btn:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.1));
        color: var(--dsw-alias-label-primary, #1f2328);
      }
      .ch-composer-btn.overridden {
        background: rgba(37, 99, 235, 0.10);
        border-color: rgba(37, 99, 235, 0.28);
        color: #2563eb;
      }
      .ch-session-popover {
        position: fixed;
        width: 340px;
        max-width: calc(100vw - 24px);
        max-height: 420px;
        display: flex;
        flex-direction: column;
        border-radius: 12px;
        background: var(--dsw-alias-bg-base, #ffffff);
        border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,127,0.22));
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);
        color: var(--dsw-alias-label-primary, #1f2328);
        z-index: 9999;
        overflow: hidden;
        font-family: inherit;
      }
      .ch-sp-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        font-size: 12.5px;
        font-weight: 600;
      }
      .ch-sp-reset {
        border: none;
        background: transparent;
        color: #2563eb;
        font: inherit;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 6px;
      }
      .ch-sp-reset:hover {
        background: rgba(37, 99, 235, 0.10);
      }
      .ch-sp-list {
        overflow-y: auto;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ch-sp-item {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background .1s;
      }
      .ch-sp-item:hover {
        background: var(--dsw-alias-bg-layer-2, rgba(127,127,127,0.08));
      }
      .ch-sp-item input {
        margin-top: 2px;
        accent-color: #2563eb;
        cursor: pointer;
      }
      .ch-sp-info {
        flex: 1;
        min-width: 0;
      }
      .ch-sp-name {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        font-weight: 500;
      }
      .ch-sp-meta {
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        margin-top: 2px;
      }
      .ch-sp-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 12px;
        border-top: 1px solid var(--dsw-alias-border-l3, rgba(127,127,127,0.14));
        font-size: 11px;
        color: var(--dsw-alias-label-tertiary, #8b93a1);
        background: var(--dsw-alias-bg-layer-1, rgba(127,127,127,0.03));
      }
    `;

    function HubSidebarIcon({ size = 16 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('rect', { x: 2, y: 2, width: 5.2, height: 5.2, rx: 1.3 }),
        h('rect', { x: 8.8, y: 2, width: 5.2, height: 5.2, rx: 1.3 }),
        h('rect', { x: 2, y: 8.8, width: 5.2, height: 5.2, rx: 1.3 }),
        h('path', { d: 'M11.4 9.2v4.4M9.2 11.4h4.4' }),
      );
    }

    function SuiteGlyph({ kind = 'layers', size = 18 }) {
      const common = {
        width: size,
        height: size,
        viewBox: '0 0 20 20',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.65,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
      };
      if (kind === 'bolt') {
        return h('svg', common, h('path', { d: 'M11 2L4.5 11H10l-1 7 6.5-9H10l1-7z' }));
      }
      if (kind === 'spark') {
        return h('svg', common, h('path', { d: 'M10 2.5l1.9 5.1 5.1 1.9-5.1 1.9L10 16.5l-1.9-5.1-5.1-1.9 5.1-1.9L10 2.5z' }));
      }
      if (kind === 'terminal') {
        return h('svg', common, h('rect', { x: 2.5, y: 3.5, width: 15, height: 13, rx: 2.5 }), h('path', { d: 'M6 8l2.5 2L6 12m4.5 0h3.5' }));
      }
      if (kind === 'skill') {
        return h('svg', common, h('path', { d: 'M4 3.5h9.5A2.5 2.5 0 0 1 16 6v10.5H6.5A2.5 2.5 0 0 1 4 14V3.5z' }), h('path', { d: 'M4 14a2 2 0 0 1 2-2h10' }));
      }
      if (kind === 'mcp') {
        return h('svg', common, h('path', { d: 'M7 6v4a3 3 0 0 0 6 0V6M8.5 3v3m3-3v3M10 13v4' }));
      }
      return h('svg', common, h('path', { d: 'M10 3L3 6.8 10 10.6l7-3.8L10 3zM3 10.2l7 3.8 7-3.8M3 13.6l7 3.8 7-3.8' }));
    }

    function Switch({ checked, onChange, label, disabled, title, muted }) {
      const cls = checked ? 'ch-switch on' : muted ? 'ch-switch muted' : 'ch-switch';
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': Boolean(checked),
        'aria-label': label || 'Toggle',
        title,
        disabled: Boolean(disabled),
        className: cls,
        onClick: (e) => {
          e.stopPropagation();
          if (!disabled && onChange) onChange(!checked);
        },
      });
    }

    async function callHubGet(params = {}) {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(qs ? `${API_URL}?${qs}` : API_URL, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    }

    async function callHubPost(payload) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    }

    function copyText(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
      }
      return Promise.resolve(false);
    }

    function ensureHubStyles() {
      if (typeof document === 'undefined') return;
      const id = 'capability-hub-styles';
      let el = document.getElementById(id);
      if (!el) {
        el = document.createElement('style');
        el.id = id;
        document.head.appendChild(el);
      }
      if (el.textContent !== STYLES) {
        el.textContent = STYLES;
      }
    }

    const hubChangeListeners = new Set();
    function subscribeHubChange(fn) {
      hubChangeListeners.add(fn);
      return () => hubChangeListeners.delete(fn);
    }
    function notifyHubChange() {
      for (const fn of hubChangeListeners) {
        try { fn(); } catch {}
      }
    }

    function CapabilityHubView({ t }) {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [notice, setNotice] = useState(null); // null | { text }
      const [modal, setModal] = useState(null); // null | { kind: 'confirm-global-stop', serverName } | { kind: 'confirm-delete-suite', bundleId, bundleName }
      const [suiteMenu, setSuiteMenu] = useState(null); // null | { key, bundles, subTab, top, right }
      const noticeTimerRef = useRef(null);
      const [cwd, setCwd] = useState('');

      const [activeTab, setActiveTab] = useState('bundles'); // 'bundles' | 'skills' | 'mcps'
      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all');

      const [selectedBundleId, setSelectedBundleId] = useState(null);
      const [detailSubTab, setDetailSubTab] = useState('skills'); // 'skills' | 'mcps'
      const [detailMcpName, setDetailMcpName] = useState('');
      const [detailSkillQuery, setDetailSkillQuery] = useState('');
      const [detailToolQuery, setDetailToolQuery] = useState('');

      // Drawer state: null | { kind: 'skill', name } | { kind: 'mcp', name } | { kind: 'bundle-form', bundle? } | { kind: 'connect-mcp' }
      const [drawer, setDrawer] = useState(null);
      const [skillDoc, setSkillDoc] = useState({ loading: false, content: '', path: '', error: '' });
      const [drawerToolQuery, setDrawerToolQuery] = useState('');
      const [copiedKey, setCopiedKey] = useState('');
      const [restartingServers, setRestartingServers] = useState({});
      const prevConnectingRef = useRef(false);

      // Bundle form state
      const [bfId, setBfId] = useState('');
      const [bfName, setBfName] = useState('');
      const [bfDesc, setBfDesc] = useState('');
      const [bfIcon, setBfIcon] = useState('layers');
      const [bfColor, setBfColor] = useState('#2563eb');
      const [bfMcps, setBfMcps] = useState([]);
      const [bfSkills, setBfSkills] = useState([]);
      const [bfSkillFilter, setBfSkillFilter] = useState('');

      // Custom MCP form state
      const [cmEditing, setCmEditing] = useState(false);
      const [cmName, setCmName] = useState('');
      const [cmTransport, setCmTransport] = useState('streamable-http');
      const [cmUrl, setCmUrl] = useState('');
      const [cmAuthType, setCmAuthType] = useState('none'); // 'none' | 'bearer' | 'api-key' | 'custom'
      const [cmBearerToken, setCmBearerToken] = useState('');
      const [cmApiKeyHeader, setCmApiKeyHeader] = useState('X-API-Key');
      const [cmApiKeyValue, setCmApiKeyValue] = useState('');
      const [cmHeadersText, setCmHeadersText] = useState('');
      const [cmKeepHeaders, setCmKeepHeaders] = useState({}); // { key: maskedValue }
      const [cmCommand, setCmCommand] = useState('npx');
      const [cmArgs, setCmArgs] = useState('');
      const [cmEnvText, setCmEnvText] = useState('');
      const [cmKeepEnv, setCmKeepEnv] = useState({}); // { key: maskedValue }
      const [cmCwd, setCmCwd] = useState('');
      const [cmShowSecret, setCmShowSecret] = useState(false);

      // Skill add / edit / import / delete state
      const [skModeTab, setSkModeTab] = useState('create'); // 'create' | 'import'
      const [skOverwrite, setSkOverwrite] = useState(false);
      const [skTargetPath, setSkTargetPath] = useState('');
      const [skName, setSkName] = useState('');
      const [skDesc, setSkDesc] = useState('');
      const [skWhen, setSkWhen] = useState('');
      const [skBody, setSkBody] = useState('');
      const [skScope, setSkScope] = useState('user-agents');
      const [skImportKind, setSkImportKind] = useState('repo'); // 'repo' | 'local' | 'zip'
      const [skRepoSpec, setSkRepoSpec] = useState('');
      const [skLocalPath, setSkLocalPath] = useState('');
      const [skZipName, setSkZipName] = useState('');
      const [skZipB64, setSkZipB64] = useState('');
      const [skConfirmDelete, setSkConfirmDelete] = useState(false);
      const [skBusy, setSkBusy] = useState(false);

      const refresh = useCallback(async (targetCwd) => {
        try {
          setError('');
          const next = await callHubGet(targetCwd ? { action: 'status', cwd: targetCwd } : { action: 'status' });
          setData(next);
          if (!targetCwd && next.cwd) setCwd(next.cwd);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      }, []);

      useEffect(() => {
        refresh(cwd || undefined);
      }, [cwd, refresh]);

      const hasConnectingMcp = useMemo(
        () => (data?.mcps || []).some((m) => m.connectionState === 'connecting' || m.connectionState === 'reconnecting'),
        [data],
      );

      useEffect(() => {
        if (prevConnectingRef.current && !hasConnectingMcp) {
          notifyHubChange();
        }
        prevConnectingRef.current = hasConnectingMcp;
        if (!hasConnectingMcp) return undefined;
        const timer = setInterval(() => {
          refresh(cwd || undefined);
        }, 1500);
        return () => clearInterval(timer);
      }, [hasConnectingMcp, cwd, refresh]);

      useEffect(() => {
        if (!drawer && !modal && !suiteMenu) return undefined;
        const onKey = (e) => {
          if (e.key === 'Escape') {
            if (suiteMenu) setSuiteMenu(null);
            else if (modal) setModal(null);
            else setDrawer(null);
          }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [drawer, modal, suiteMenu]);

      useEffect(() => {
        if (!suiteMenu) return undefined;
        const close = () => setSuiteMenu(null);
        window.addEventListener('pointerdown', close);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
          window.removeEventListener('pointerdown', close);
          window.removeEventListener('scroll', close, true);
          window.removeEventListener('resize', close);
        };
      }, [suiteMenu]);

      useEffect(() => () => {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      }, []);

      const pauseNoticeTimer = useCallback(() => {
        if (noticeTimerRef.current) {
          clearTimeout(noticeTimerRef.current);
          noticeTimerRef.current = null;
        }
      }, []);

      const startNoticeTimer = useCallback((ms = 3500) => {
        if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = setTimeout(() => {
          noticeTimerRef.current = null;
          setNotice(null);
        }, ms);
      }, []);

      const showNotice = useCallback((nextNotice) => {
        pauseNoticeTimer();
        setNotice(nextNotice);
        if (nextNotice) {
          startNoticeTimer(2500);
        }
      }, [pauseNoticeTimer, startNoticeTimer]);

      const jumpToSuite = useCallback((bundleId, subTab) => {
        if (!bundleId) return;
        setActiveTab('bundles');
        setSelectedBundleId(bundleId);
        if (subTab) setDetailSubTab(subTab);
        setDetailSkillQuery('');
        setDetailToolQuery('');
        setDrawer(null);
        setModal(null);
        setSuiteMenu(null);
        showNotice(null);
      }, [showNotice]);

      const getSuiteState = (b) => {
        if (b.enabled === false) return 'disabled';
        return b.defaultInject === false ? 'on_demand' : 'default';
      };

      const renderSuiteStateControl = (b) => {
        const cur = getSuiteState(b);
        return h(
          'div',
          {
            className: 'ch-state-seg',
            role: 'group',
            'aria-label': b.name,
            onClick: (e) => e.stopPropagation(),
          },
          [
            { id: 'default', label: t('suiteState.default'), cls: 'is-default' },
            { id: 'on_demand', label: t('suiteState.onDemand'), cls: 'is-on-demand' },
            { id: 'disabled', label: t('suiteState.disabled'), cls: 'is-disabled' },
          ].map((opt) =>
            h(
              'button',
              {
                key: opt.id,
                type: 'button',
                'aria-pressed': cur === opt.id,
                className: cur === opt.id ? `ch-state-btn active ${opt.cls}` : 'ch-state-btn',
                onClick: () => {
                  if (cur === opt.id) return;
                  runMutation({ action: 'set_bundle_state', bundleId: b.id, state: opt.id });
                },
              },
              opt.label,
            ),
          ),
        );
      };

      const renderSuiteJumpChip = (bundles, subTab, itemKey) => {
        const list = Array.isArray(bundles) ? bundles : [];
        if (list.length === 0) return null;
        const first = list[0];
        const multi = list.length > 1;
        const label = multi ? `${first.name} +${list.length - 1} ▾` : `${first.name} ›`;
        return h(
          'button',
          {
            type: 'button',
            className: 'ch-suite-chip',
            title: list.map((b) => b.name).join(' / '),
            onPointerDown: (e) => multi && e.stopPropagation(),
            onClick: (e) => {
              e.stopPropagation();
              if (!multi) {
                jumpToSuite(first.id, subTab);
                return;
              }
              const menuKey = `${subTab}:${itemKey || first.id}`;
              if (suiteMenu && suiteMenu.key === menuKey) {
                setSuiteMenu(null);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              const top = Math.min(window.innerHeight - 16 - list.length * 36, rect.bottom + 6);
              const right = Math.max(12, window.innerWidth - rect.right);
              setSuiteMenu({ key: menuKey, bundles: list, subTab, top: Math.max(12, top), right });
            },
          },
          label,
        );
      };

      const runMutation = useCallback(async (payload) => {
        try {
          setError('');
          const next = await callHubPost({ ...payload, cwd: cwd || undefined });
          setData(next);
          notifyHubChange();
          return next;
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
          return null;
        }
      }, [cwd]);

      const handleRestartMcp = useCallback(async (serverName) => {
        if (!serverName) return;
        setRestartingServers((prev) => ({ ...prev, [serverName]: true }));
        try {
          await runMutation({ action: 'restart_mcp', serverName });
        } finally {
          setRestartingServers((prev) => {
            const next = { ...prev };
            delete next[serverName];
            return next;
          });
        }
      }, [runMutation]);

      const isMcpBusy = (m) =>
        Boolean(restartingServers[m?.name]) ||
        m?.connectionState === 'connecting' ||
        m?.connectionState === 'reconnecting';

      const renderMcpConnPill = (m) => {
        if (!m) return null;
        if (m.globallyDisabled || m.disableReason === 'manual' || m.connectionState === 'disabled') {
          return h('span', { className: 'ch-pill' }, t('status.muted'));
        }
        if (restartingServers[m.name] || m.connectionState === 'connecting' || m.connectionState === 'reconnecting') {
          const isReconnect = m.connectionState === 'reconnecting';
          const progress = isReconnect && m.connectionAttempt && m.connectionMaxAttempts
            ? ` (${m.connectionAttempt}/${m.connectionMaxAttempts})`
            : '…';
          return h(
            'span',
            { className: 'ch-pill info' },
            h('span', { className: 'ch-spinner', 'aria-hidden': 'true' }),
            `${isReconnect ? t('status.reconnecting') : t('status.connecting')}${progress}`,
          );
        }
        if (m.connectionState === 'failed') {
          return h('span', { className: 'ch-pill warn' }, t('status.failed'));
        }
        if (m.connectionState === 'missing' || m.source === 'missing') {
          return h('span', { className: 'ch-pill warn' }, '未安装');
        }
        return h('span', { className: 'ch-pill ok' }, t('status.connected'));
      };

      const openSkillDrawer = useCallback((skillName) => {
        setSkConfirmDelete(false);
        setDrawer({ kind: 'skill', name: skillName });
        setSkillDoc({ loading: true, content: '', path: '', error: '' });
        callHubGet({ action: 'read_skill', skillName, ...(cwd ? { cwd } : {}) })
          .then((res) => {
            setSkillDoc({
              loading: false,
              content: res.skill?.content || '',
              path: res.skill?.path || '',
              error: '',
            });
          })
          .catch((err) => {
            setSkillDoc({
              loading: false,
              content: '',
              path: '',
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }, [cwd]);

      const openMcpDrawer = useCallback((serverName) => {
        setDrawerToolQuery('');
        setDrawer({ kind: 'mcp', name: serverName });
      }, []);

      const openBundleForm = useCallback((bundle = null) => {
        setBfId(bundle?.id || '');
        setBfName(bundle?.name || '');
        setBfDesc(bundle?.description || '');
        setBfIcon(bundle?.icon || 'layers');
        setBfColor(bundle?.color || '#2563eb');
        setBfMcps(bundle?.mcps ? [...bundle.mcps] : []);
        setBfSkills(bundle?.skills ? [...bundle.skills] : []);
        setBfSkillFilter('');
        setDrawer({ kind: 'bundle-form' });
      }, []);

      const openConnectMcp = useCallback((existing = null) => {
        setCmShowSecret(false);
        if (existing && typeof existing === 'object' && typeof existing.name === 'string' && existing.name) {
          setCmEditing(true);
          setCmName(existing.name || '');
          const tr = existing.transport === 'stdio' ? 'stdio' : 'streamable-http';
          setCmTransport(tr);
          setCmUrl(existing.url || '');
          setCmCommand(existing.command || 'npx');
          setCmArgs(Array.isArray(existing.args) ? existing.args.join(' ') : '');
          setCmCwd(existing.cwd || '');
          const existingHeaders = existing.headers && typeof existing.headers === 'object' ? { ...existing.headers } : {};
          const existingEnv = existing.env && typeof existing.env === 'object' ? { ...existing.env } : {};
          setCmKeepHeaders(existingHeaders);
          setCmKeepEnv(existingEnv);
          setCmBearerToken('');
          setCmApiKeyValue('');
          setCmHeadersText('');
          setCmEnvText('');
          const hKeys = Object.keys(existingHeaders);
          if (hKeys.length === 0) {
            setCmAuthType('none');
            setCmApiKeyHeader('X-API-Key');
          } else if (hKeys.length === 1 && /^authorization$/i.test(hKeys[0]) && /^bearer\s+/i.test(existingHeaders[hKeys[0]] || '')) {
            setCmAuthType('bearer');
            setCmApiKeyHeader('X-API-Key');
          } else if (hKeys.length === 1) {
            setCmAuthType('api-key');
            setCmApiKeyHeader(hKeys[0]);
          } else {
            setCmAuthType('custom');
            setCmApiKeyHeader('X-API-Key');
          }
        } else {
          setCmEditing(false);
          setCmName('');
          setCmTransport('streamable-http');
          setCmUrl('');
          setCmAuthType('none');
          setCmBearerToken('');
          setCmApiKeyHeader('X-API-Key');
          setCmApiKeyValue('');
          setCmHeadersText('');
          setCmKeepHeaders({});
          setCmCommand('npx');
          setCmArgs('');
          setCmEnvText('');
          setCmKeepEnv({});
          setCmCwd('');
        }
        setDrawer({ kind: 'connect-mcp' });
      }, []);

      const openAddSkill = useCallback((existing = null, existingContent = '') => {
        setSkConfirmDelete(false);
        setSkBusy(false);
        setSkModeTab('create');
        if (existing) {
          setSkOverwrite(true);
          setSkTargetPath(existing.path || '');
          setSkName(existing.name || '');
          setSkDesc(existing.description || '');
          setSkWhen(existing.whenToUse || '');
          setSkBody(existingContent || '');
          setSkScope(existing.source || 'user-agents');
        } else {
          setSkOverwrite(false);
          setSkTargetPath('');
          setSkName('');
          setSkDesc('');
          setSkWhen('');
          setSkBody('');
          setSkScope('user-agents');
        }
        setSkImportKind('repo');
        setSkRepoSpec('');
        setSkLocalPath('');
        setSkZipName('');
        setSkZipB64('');
        setDrawer({ kind: 'add-skill' });
      }, []);

      const handleSkillBodyPaste = useCallback((text) => {
        const normalized = String(text || '').replace(/\r\n/g, '\n');
        const fmMatch = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
        if (!fmMatch) {
          setSkBody(text);
          return;
        }
        for (const line of fmMatch[1].split('\n')) {
          const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line.trim());
          if (!kv) continue;
          const val = kv[2].trim().replace(/^["']|["']$/g, '');
          if (kv[1] === 'name' && !skOverwrite) setSkName(val);
          else if (kv[1] === 'description') setSkDesc(val);
          else if (kv[1] === 'when-to-use' || kv[1] === 'whenToUse') setSkWhen(val);
        }
        setSkBody(fmMatch[2].trim());
      }, [skOverwrite]);

      const triggerCopy = useCallback((key, text) => {
        copyText(text).then((ok) => {
          if (!ok) return;
          setCopiedKey(key);
          setTimeout(() => setCopiedKey((prev) => (prev === key ? '' : prev)), 1500);
        });
      }, []);

      const selectedBundle = useMemo(() => {
        if (!selectedBundleId || !data?.bundles) return null;
        return data.bundles.find((b) => b.id === selectedBundleId) || null;
      }, [data, selectedBundleId]);

      useEffect(() => {
        if (selectedBundle && selectedBundle.mcpDetails?.length > 0) {
          if (!selectedBundle.mcpDetails.some((m) => m.name === detailMcpName)) {
            setDetailMcpName(selectedBundle.mcpDetails[0].name);
          }
        }
      }, [selectedBundle, detailMcpName]);

      const q = search.trim().toLowerCase();

      const filteredBundles = useMemo(() => {
        const list = data?.bundles || [];
        return list.filter((b) => {
          if (filter === 'enabled' && !b.enabled) return false;
          if (filter === 'muted' && b.enabled) return false;
          if (!q) return true;
          return (
            b.name.toLowerCase().includes(q)
            || (b.description || '').toLowerCase().includes(q)
            || (b.mcps || []).some((m) => m.toLowerCase().includes(q))
            || (b.skills || []).some((s) => s.toLowerCase().includes(q))
          );
        });
      }, [data, filter, q]);

      const filteredSkills = useMemo(() => {
        const list = data?.skills || [];
        return list.filter((s) => {
          if (filter === 'project' && s.scopeGroup !== 'project') return false;
          if (filter === 'user' && s.scopeGroup !== 'user') return false;
          if (filter === 'system' && s.scopeGroup !== 'system') return false;
          if (filter === 'nonAuto' && s.effectiveMode === 'auto') return false;
          if (!q) return true;
          return (
            s.name.toLowerCase().includes(q)
            || (s.description || '').toLowerCase().includes(q)
            || (s.path || '').toLowerCase().includes(q)
          );
        });
      }, [data, filter, q]);

      const filteredMcps = useMemo(() => {
        const list = data?.mcps || [];
        return list.filter((m) => {
          if (filter === 'enabled' && !m.enabled) return false;
          if (filter === 'muted' && m.enabled) return false;
          if (filter === 'bundleMcp' && m.source !== 'bundle') return false;
          if (filter === 'customMcp' && !m.isCustom) return false;
          if (!q) return true;
          return (
            m.name.toLowerCase().includes(q)
            || (m.url || '').toLowerCase().includes(q)
            || (m.command || '').toLowerCase().includes(q)
            || (m.tools || []).some((tl) => tl.shortName.toLowerCase().includes(q) || (tl.description || '').toLowerCase().includes(q))
          );
        });
      }, [data, filter, q]);

      const summary = data?.summary || {
        autoSkills: 0,
        activeToolCount: 0,
        budgetPercent: 0,
        hasMcpIssues: false,
      };

      const renderSkillModePill = (sk) => {
        if (sk.effectiveMode === 'auto') return h('span', { className: 'ch-pill ok' }, t('mode.auto'));
        if (sk.effectiveMode === 'manual') return h('span', { className: 'ch-pill info' }, t('mode.manual'));
        return h('span', { className: 'ch-pill' }, t('mode.muted'));
      };

      const renderScopeLabel = (scopeGroup) => {
        if (scopeGroup === 'project') return t('scope.project');
        if (scopeGroup === 'system') return t('scope.system');
        return t('scope.user');
      };

      const renderMainContent = () => {
        if (loading && !data) {
          return h('div', { className: 'ch-empty' }, t('loading'));
        }

        if (selectedBundle) {
          const currentMcp = selectedBundle.mcpDetails?.find((m) => m.name === detailMcpName) || selectedBundle.mcpDetails?.[0];
          const dsq = detailSkillQuery.trim().toLowerCase();
          const filteredBundleSkills = (selectedBundle.skillDetails || []).filter(
            (sk) => !dsq || sk.name.toLowerCase().includes(dsq) || (sk.description || '').toLowerCase().includes(dsq),
          );
          const dtq = detailToolQuery.trim().toLowerCase();
          const filteredBundleTools = (currentMcp?.tools || []).filter(
            (tl) => !dtq || tl.shortName.toLowerCase().includes(dtq) || (tl.description || '').toLowerCase().includes(dtq),
          );
          return h(
            'div',
            null,
            h(
              'div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setSelectedBundleId(null) }, t('btn.back')),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => openBundleForm(selectedBundle) }, t('btn.editBundle')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ch-btn ch-btn-sm ch-btn-danger',
                    onClick: () => setModal({ kind: 'confirm-delete-suite', bundleId: selectedBundle.id, bundleName: selectedBundle.name }),
                  },
                  t('btn.deleteBundle'),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ch-detail-head' },
              h(
                'div',
                { className: 'ch-detail-id' },
                h(
                  'div',
                  {
                    className: 'ch-squircle lg',
                    style: { background: `${selectedBundle.color || '#2563eb'}18`, color: selectedBundle.color || '#2563eb' },
                  },
                  h(SuiteGlyph, { kind: selectedBundle.icon || 'layers', size: 22 }),
                ),
                h(
                  'div',
                  { style: { minWidth: 0 } },
                  h(
                    'div',
                    { className: 'ch-row-title-line' },
                    h('h2', { style: { margin: 0, fontSize: 19, fontWeight: 650 } }, selectedBundle.name),
                    h('span', { className: 'ch-slug ch-mono' }, selectedBundle.slug),
                  ),
                  h('p', { style: { margin: '6px 0 0', color: 'var(--dsw-alias-label-secondary)', fontSize: 13 } }, selectedBundle.description),
                ),
              ),
              renderSuiteStateControl(selectedBundle),
            ),
            h(
              'div',
              { className: 'ch-toolbar', style: { marginBottom: 14 } },
              h(
                'div',
                { className: 'ch-tabs', role: 'tablist' },
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': detailSubTab === 'skills',
                    className: detailSubTab === 'skills' ? 'ch-tab active' : 'ch-tab',
                    onClick: () => setDetailSubTab('skills'),
                  },
                  t('subtab.skills'),
                  h('span', { className: 'ch-tab-count' }, selectedBundle.skillDetails.length),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    role: 'tab',
                    'aria-selected': detailSubTab === 'mcps',
                    className: detailSubTab === 'mcps' ? 'ch-tab active' : 'ch-tab',
                    onClick: () => setDetailSubTab('mcps'),
                  },
                  t('subtab.mcps'),
                  h('span', { className: 'ch-tab-count' }, selectedBundle.mcpDetails.length),
                  selectedBundle.hasIssue ? h('span', { className: 'ch-dot-warn' }) : null,
                ),
              ),
            ),
            detailSubTab === 'skills'
              ? (selectedBundle.skillDetails.length === 0
                  ? h('div', { className: 'ch-empty' }, '此套件暂未关联 Skill，点击右上角「编辑套件」可勾选添加。')
                  : h(
                      'div',
                      null,
                      selectedBundle.skillDetails.length > 5
                        ? h(
                            'div',
                            { style: { marginBottom: 10 } },
                            h('input', {
                              type: 'search',
                              className: 'ch-input',
                              style: { height: 28, padding: '0 10px', width: 240, maxWidth: '100%' },
                              placeholder: '筛选 Skill…',
                              value: detailSkillQuery,
                              onChange: (e) => setDetailSkillQuery(e.target.value),
                            }),
                          )
                        : null,
                      filteredBundleSkills.length === 0
                        ? h('div', { className: 'ch-empty' }, t('empty.list'))
                        : h(
                            'table',
                            { className: 'ch-table' },
                            h(
                              'thead',
                              null,
                              h(
                                'tr',
                                null,
                                h('th', { style: { width: '26%' } }, 'Skill'),
                                h('th', { className: 'ch-table-nowrap', style: { width: '11%' } }, '来源'),
                                h('th', null, '用途说明'),
                                h('th', { className: 'ch-table-nowrap', style: { width: 72, textAlign: 'right' } }, '启用'),
                              ),
                            ),
                            h(
                              'tbody',
                              null,
                              filteredBundleSkills.map((sk) => {
                                const bEff = sk.bundleEffectiveMode || sk.effectiveMode || 'auto';
                                const isOn = sk.source !== 'missing' && bEff !== 'muted';
                                return h(
                                  'tr',
                                  { key: sk.name, className: 'clickable', onClick: () => sk.source !== 'missing' && openSkillDrawer(sk.name) },
                                  h(
                                    'td',
                                    null,
                                    h(
                                      'div',
                                      { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                                      h('span', { className: 'ch-mono', style: { fontWeight: 600 } }, sk.name),
                                      isOn && bEff === 'manual'
                                        ? h('span', { className: 'ch-slug' }, '仅手动')
                                        : null,
                                    ),
                                  ),
                                  h('td', { className: 'ch-table-nowrap', style: { color: 'var(--dsw-alias-label-tertiary)' } }, renderScopeLabel(sk.scopeGroup)),
                                  h('td', null, h('div', { className: 'ch-table-desc', title: sk.description }, sk.description)),
                                  h(
                                    'td',
                                    {
                                      className: 'ch-table-nowrap',
                                      style: { textAlign: 'right' },
                                      onClick: (e) => e.stopPropagation(),
                                    },
                                    h(Switch, {
                                      checked: isOn,
                                      disabled: sk.source === 'missing',
                                      label: sk.name,
                                      onChange: (next) => {
                                        const nextMode = next
                                          ? (sk.globalDefaultMode && sk.globalDefaultMode !== 'muted' ? 'default' : 'auto')
                                          : 'muted';
                                        runMutation({
                                          action: 'set_bundle_skill_mode',
                                          bundleId: selectedBundle.id,
                                          skillName: sk.name,
                                          mode: nextMode,
                                        });
                                      },
                                    }),
                                  ),
                                );
                              }),
                            ),
                          ),
                    ))
              : (selectedBundle.mcpDetails.length === 0
                  ? h('div', { className: 'ch-empty' }, '此套件暂未关联 MCP 服务，点击右上角「编辑套件」可勾选添加。')
                  : h(
                      'div',
                      null,
                      h(
                        'div',
                        { className: 'ch-detail-bar' },
                        h(
                          'div',
                          { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
                          selectedBundle.mcpDetails.length > 1
                            ? h(
                                'select',
                                {
                                  className: 'ch-select ch-mono',
                                  value: currentMcp?.name || '',
                                  onChange: (e) => {
                                    setDetailMcpName(e.target.value);
                                    setDetailToolQuery('');
                                  },
                                },
                                selectedBundle.mcpDetails.map((m) =>
                                  h('option', { key: m.name, value: m.name }, `${m.name} (${m.bundleActiveTools ?? m.activeTools}/${m.totalTools})`),
                                ),
                              )
                            : h('span', { className: 'ch-mono', style: { fontWeight: 600, fontSize: 13.5 } }, currentMcp?.name),
                          currentMcp ? renderMcpConnPill(currentMcp) : null,
                          currentMcp
                            ? h(
                                'span',
                                {
                                  className:
                                    currentMcp.bundleEnabled !== false &&
                                    !currentMcp.globallyDisabled &&
                                    currentMcp.connectionState === 'connected' &&
                                    currentMcp.totalTools > 0
                                      ? 'ch-pill ok'
                                      : 'ch-pill',
                                },
                                `${currentMcp.bundleActiveTools ?? currentMcp.activeTools}/${currentMcp.totalTools} tools`,
                              )
                            : null,
                          currentMcp && currentMcp.source !== 'missing'
                            ? h(Switch, {
                                checked: currentMcp.bundleEnabled !== false && !currentMcp.globallyDisabled,
                                disabled: Boolean(currentMcp.globallyDisabled),
                                label: currentMcp.name,
                                onChange: (next) => runMutation({
                                  action: 'toggle_bundle_mcp',
                                  bundleId: selectedBundle.id,
                                  serverName: currentMcp.name,
                                  enabled: next,
                                }),
                              })
                            : null,
                        ),
                        h(
                          'div',
                          { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                          currentMcp && currentMcp.tools?.length > 0
                            ? h(
                                React.Fragment,
                                null,
                                h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: 'ch-btn ch-btn-sm',
                                    disabled: currentMcp.bundleEnabled === false || Boolean(currentMcp.globallyDisabled),
                                    onClick: () => runMutation({
                                      action: 'batch_bundle_mcp_tools',
                                      bundleId: selectedBundle.id,
                                      serverName: currentMcp.name,
                                      enabled: true,
                                    }),
                                  },
                                  t('btn.enableAll'),
                                ),
                                h(
                                  'button',
                                  {
                                    type: 'button',
                                    className: 'ch-btn ch-btn-sm',
                                    disabled: currentMcp.bundleEnabled === false || Boolean(currentMcp.globallyDisabled),
                                    onClick: () => runMutation({
                                      action: 'batch_bundle_mcp_tools',
                                      bundleId: selectedBundle.id,
                                      serverName: currentMcp.name,
                                      enabled: false,
                                    }),
                                  },
                                  t('btn.disableAll'),
                                ),
                              )
                            : null,
                          currentMcp && currentMcp.canRestart && !currentMcp.globallyDisabled
                            ? h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'ch-btn ch-btn-sm',
                                  disabled: isMcpBusy(currentMcp),
                                  style: { display: 'inline-flex', alignItems: 'center', gap: 5 },
                                  onClick: () => handleRestartMcp(currentMcp.name),
                                },
                                isMcpBusy(currentMcp) ? h('span', { className: 'ch-spinner', 'aria-hidden': 'true' }) : null,
                                isMcpBusy(currentMcp) ? t('btn.restarting') : t('btn.restart'),
                              )
                            : null,
                          currentMcp
                            ? h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => openMcpDrawer(currentMcp.name) }, '配置 ›')
                            : null,
                        ),
                      ),
                      currentMcp && currentMcp.lastError
                        ? h('div', { className: 'ch-banner-err', style: { marginBottom: 10 } }, currentMcp.lastError)
                        : null,
                      currentMcp && (currentMcp.tools || []).length > 5
                        ? h(
                            'div',
                            { style: { marginBottom: 10 } },
                            h('input', {
                              type: 'search',
                              className: 'ch-input',
                              style: { height: 28, padding: '0 10px', width: 240, maxWidth: '100%' },
                              placeholder: '筛选 Tool…',
                              value: detailToolQuery,
                              onChange: (e) => setDetailToolQuery(e.target.value),
                            }),
                          )
                        : null,
                      currentMcp && currentMcp.tools?.length > 0
                        ? (filteredBundleTools.length === 0
                            ? h('div', { className: 'ch-empty' }, '无匹配工具')
                            : h(
                                'table',
                                { className: 'ch-table' },
                                h(
                                  'thead',
                                  null,
                                  h(
                                    'tr',
                                    null,
                                    h('th', { style: { width: '32%' } }, 'Tool'),
                                    h('th', null, '描述'),
                                    h('th', { className: 'ch-table-nowrap', style: { width: 72, textAlign: 'right' } }, '启用'),
                                  ),
                                ),
                                h(
                                  'tbody',
                                  null,
                                  filteredBundleTools.map((tl) => {
                                    const toolChecked = tl.bundleEnabled !== false;
                                    const toolDisabled = currentMcp.bundleEnabled === false || Boolean(currentMcp.globallyDisabled);
                                    return h(
                                      'tr',
                                      { key: tl.name },
                                      h('td', { className: 'ch-mono', style: { fontWeight: 500 } }, tl.shortName),
                                      h('td', null, h('div', { className: 'ch-table-desc', title: tl.description || '' }, tl.description || '—')),
                                      h(
                                        'td',
                                        { className: 'ch-table-nowrap', style: { textAlign: 'right' } },
                                        h(Switch, {
                                          checked: toolChecked,
                                          disabled: toolDisabled,
                                          label: tl.shortName,
                                          onChange: (next) => runMutation({
                                            action: 'toggle_bundle_mcp_tool',
                                            bundleId: selectedBundle.id,
                                            toolName: tl.name,
                                            enabled: next,
                                          }),
                                        }),
                                      ),
                                    );
                                  }),
                                ),
                              ))
                        : h(
                            'div',
                            { className: 'ch-empty', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } },
                            currentMcp && isMcpBusy(currentMcp)
                              ? h(React.Fragment, null, h('span', { className: 'ch-spinner', 'aria-hidden': 'true' }), '正在连接 MCP 服务并加载工具列表，连上后将自动刷新…')
                              : currentMcp?.connectionState === 'failed'
                                ? 'MCP 连接异常，当前无法调用工具，请点击上方「重连」。'
                                : '该 MCP 服务当前未暴露可用工具。',
                          ),
                    )),
          );
        }

        // Standard Top-level List View
        return h(
          'div',
          null,
          h(
            'div',
            { className: 'ch-hero' },
            h(
              'div',
              null,
              h('h1', { className: 'ch-hero-title' }, t('hero.title')),
              h('p', { className: 'ch-hero-sub' }, t('hero.subtitle')),
            ),
            h(
              'div',
              { className: 'ch-hero-actions' },
              activeTab === 'skills'
                ? h('button', { type: 'button', className: 'ch-btn ch-btn-primary', onClick: () => openAddSkill(null) }, t('btn.addSkill'))
                : activeTab === 'mcps'
                  ? h('button', { type: 'button', className: 'ch-btn ch-btn-primary', onClick: () => openConnectMcp() }, t('btn.connectMcp'))
                  : h('button', { type: 'button', className: 'ch-btn ch-btn-primary', onClick: () => openBundleForm(null) }, t('btn.newBundle')),
            ),
          ),
          h(
            'div',
            { className: 'ch-toolbar' },
            h(
              'div',
              { className: 'ch-tabs', role: 'tablist' },
              [
                { id: 'bundles', label: t('tab.bundles'), count: data?.bundles?.length || 0 },
                { id: 'skills', label: t('tab.skills'), count: data?.skills?.length || 0 },
                { id: 'mcps', label: t('tab.mcps'), count: data?.mcps?.length || 0, warn: summary.hasMcpIssues },
              ].map((tb) =>
                h(
                  'button',
                  {
                    key: tb.id,
                    type: 'button',
                    role: 'tab',
                    'aria-selected': activeTab === tb.id,
                    className: activeTab === tb.id ? 'ch-tab active' : 'ch-tab',
                    onClick: () => {
                      setActiveTab(tb.id);
                      setFilter('all');
                    },
                  },
                  tb.label,
                  h('span', { className: 'ch-tab-count' }, tb.count),
                  tb.warn ? h('span', { className: 'ch-dot-warn' }) : null,
                ),
              ),
            ),
            h(
              'div',
              { className: 'ch-filters' },
              h(
                'div',
                { className: 'ch-search-wrap' },
                h(
                  'span',
                  { className: 'ch-search-icon' },
                  h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                    h('circle', { cx: 11, cy: 11, r: 8 }),
                    h('path', { d: 'm21 21-4.3-4.3' }),
                  ),
                ),
                h('input', {
                  type: 'search',
                  className: 'ch-input ch-search-input',
                  placeholder: t('search.placeholder'),
                  value: search,
                  onChange: (e) => setSearch(e.target.value),
                }),
              ),
              activeTab === 'bundles'
                ? h(
                    'select',
                    { className: 'ch-select', value: filter, onChange: (e) => setFilter(e.target.value) },
                    h('option', { value: 'all' }, t('filter.all')),
                    h('option', { value: 'enabled' }, t('filter.enabled')),
                    h('option', { value: 'muted' }, t('filter.muted')),
                  )
                : activeTab === 'skills'
                  ? h(
                      'select',
                      { className: 'ch-select', value: filter, onChange: (e) => setFilter(e.target.value) },
                      h('option', { value: 'all' }, t('filter.all')),
                      h('option', { value: 'project' }, t('filter.project')),
                      h('option', { value: 'user' }, t('filter.user')),
                      h('option', { value: 'system' }, t('filter.system')),
                      h('option', { value: 'nonAuto' }, t('filter.nonAuto')),
                    )
                  : h(
                      'select',
                      { className: 'ch-select', value: filter, onChange: (e) => setFilter(e.target.value) },
                      h('option', { value: 'all' }, t('filter.all')),
                      h('option', { value: 'enabled' }, t('filter.enabled')),
                      h('option', { value: 'muted' }, t('filter.muted')),
                      h('option', { value: 'bundleMcp' }, t('filter.bundleMcp')),
                      h('option', { value: 'customMcp' }, t('filter.customMcp')),
                    ),
            ),
          ),

          activeTab === 'bundles'
            ? (filteredBundles.length === 0
                ? h('div', { className: 'ch-empty' }, t('empty.list'))
                : h(
                    'div',
                    { className: 'ch-list' },
                    filteredBundles.map((b) =>
                      h(
                        'div',
                        {
                          key: b.id,
                          className: 'ch-row',
                          onClick: () => {
                            setSelectedBundleId(b.id);
                            setDetailSubTab('skills');
                          },
                        },
                        h(
                          'div',
                          { className: 'ch-row-left' },
                          h(
                            'div',
                            {
                              className: 'ch-squircle',
                              style: { background: `${b.color || '#2563eb'}18`, color: b.color || '#2563eb' },
                            },
                            h(SuiteGlyph, { kind: b.icon || 'layers', size: 18 }),
                          ),
                          h(
                            'div',
                            { className: 'ch-row-meta' },
                            h(
                              'div',
                              { className: 'ch-row-title-line' },
                              h('span', { className: 'ch-row-name' }, b.name),
                              h('span', { className: 'ch-pill' }, `${b.mcps.length} MCP · ${b.skills.length} Skills`),
                              b.hasIssue ? h('span', { className: 'ch-pill warn' }, t('status.failed')) : null,
                            ),
                            h('div', { className: 'ch-row-desc' }, b.description),
                          ),
                        ),
                        h(
                          'div',
                          { className: 'ch-row-right' },
                          renderSuiteStateControl(b),
                        ),
                      ),
                    ),
                  ))
            : activeTab === 'skills'
              ? h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'ch-section-bar' },
                    h('span', null, `点击任意行查看 SKILL.md 与配置`),
                    h('span', null, `${filteredSkills.length} / ${data?.skills?.length || 0}`),
                  ),
                  filteredSkills.length === 0
                    ? h('div', { className: 'ch-empty' }, t('empty.list'))
                    : h(
                        'div',
                        { className: 'ch-list' },
                        filteredSkills.map((sk) => {
                          const inBundle = Boolean(sk.bundles && sk.bundles.length > 0);
                          return h(
                            'div',
                            { key: sk.name, className: 'ch-row', onClick: () => openSkillDrawer(sk.name) },
                            h(
                              'div',
                              { className: 'ch-row-left' },
                              h('div', { className: 'ch-squircle' }, h(SuiteGlyph, { kind: 'skill', size: 17 })),
                              h(
                                'div',
                                { className: 'ch-row-meta' },
                                h(
                                  'div',
                                  { className: 'ch-row-title-line' },
                                  h('span', { className: 'ch-row-name ch-mono' }, sk.name),
                                  h('span', { className: 'ch-slug' }, renderScopeLabel(sk.scopeGroup)),
                                ),
                                h('div', { className: 'ch-row-desc' }, sk.description),
                              ),
                            ),
                            h(
                              'div',
                              { className: 'ch-row-right' },
                              inBundle
                                ? renderSuiteJumpChip(sk.bundles, 'skills', sk.name)
                                : h(
                                    React.Fragment,
                                    null,
                                    sk.effectiveMode === 'manual' ? renderSkillModePill(sk) : null,
                                    h(Switch, {
                                      checked: sk.effectiveMode !== 'muted',
                                      label: sk.name,
                                      onChange: (next) =>
                                        runMutation({
                                          action: 'set_skill_mode',
                                          skillName: sk.name,
                                          mode: next ? 'auto' : 'muted',
                                        }),
                                    }),
                                  ),
                            ),
                          );
                        }),
                      ),
                )
              : h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'ch-section-bar' },
                    h('span', null, '点击任意 MCP 服务查看工具列表与 JSON 配置'),
                    h('span', null, `${filteredMcps.length} / ${data?.mcps?.length || 0}`),
                  ),
                  filteredMcps.length === 0
                    ? h('div', { className: 'ch-empty' }, t('empty.list'))
                    : h(
                        'div',
                        { className: 'ch-list' },
                        filteredMcps.map((m) => {
                          const inBundle = Boolean(m.bundles && m.bundles.length > 0);
                          return h(
                            'div',
                            { key: m.name, className: 'ch-row', onClick: () => openMcpDrawer(m.name) },
                            h(
                              'div',
                              { className: 'ch-row-left' },
                              h('div', { className: 'ch-squircle' }, h(SuiteGlyph, { kind: 'mcp', size: 18 })),
                              h(
                                'div',
                                { className: 'ch-row-meta' },
                                h(
                                  'div',
                                  { className: 'ch-row-title-line' },
                                  h('span', { className: 'ch-row-name ch-mono' }, m.name),
                                  h('span', { className: 'ch-slug ch-mono' }, m.transport),
                                  m.connectionState === 'failed' || m.disableReason === 'manual' || isMcpBusy(m)
                                    ? renderMcpConnPill(m)
                                    : h('span', { className: 'ch-slug' }, `${m.totalTools} tools`),
                                ),
                                h(
                                  'div',
                                  { className: 'ch-row-desc ch-mono' },
                                  m.url || (m.command ? `${m.command} ${(m.args || []).join(' ')}` : m.source),
                                ),
                              ),
                            ),
                            h(
                              'div',
                              { className: 'ch-row-right' },
                              inBundle
                                ? (m.disableReason === 'manual'
                                    ? h(
                                        'button',
                                        {
                                          type: 'button',
                                          className: 'ch-btn ch-btn-sm',
                                          onClick: async (e) => {
                                            e.stopPropagation();
                                            const ok = await runMutation({ action: 'toggle_mcp_server', serverName: m.name, enabled: true });
                                            if (ok) showNotice({ text: t('toast.mcpGlobalRestored').replace('{name}', m.name) });
                                          },
                                        },
                                        t('mcp.globalRestore'),
                                      )
                                    : renderSuiteJumpChip(m.bundles, 'mcps', m.name))
                                : h(Switch, {
                                    checked: m.enabled,
                                    label: m.name,
                                    onChange: (next) => runMutation({ action: 'toggle_mcp_server', serverName: m.name, enabled: next }),
                                  }),
                            ),
                          );
                        }),
                      ),
                ),
        );
      };

      const renderDrawer = () => {
        if (!drawer) return null;

        if (drawer.kind === 'skill') {
          const sk = data?.skills?.find((s) => s.name === drawer.name);
          if (!sk) return null;
          const activeMode = sk.configuredMode || 'default';
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title ch-mono' }, sk.name),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 6 } },
                sk.writable
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'ch-btn ch-btn-sm',
                        onClick: () => openAddSkill(sk, skillDoc.content || ''),
                      },
                      t('btn.edit'),
                    )
                  : null,
                sk.writable
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'ch-btn ch-btn-sm ch-btn-danger',
                        onClick: () => setSkConfirmDelete((prev) => !prev),
                      },
                      t('btn.deleteBundle'),
                    )
                  : null,
                h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
              ),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              skConfirmDelete && sk.writable
                ? h(
                    'div',
                    {
                      className: 'ch-field',
                      style: {
                        padding: 10,
                        borderRadius: 8,
                        border: '1px solid var(--dsw-alias-border-error, #ef4444)',
                        background: 'var(--dsw-alias-bg-secondary)',
                      },
                    },
                    h('div', { style: { fontSize: 12.5, fontWeight: 500, marginBottom: 8 } }, `确认移除技能「${sk.name}」？（同时清理套件中的引用）`),
                    h(
                      'div',
                      { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm ch-btn-primary',
                          disabled: skBusy,
                          onClick: async () => {
                            setSkBusy(true);
                            const res = await runMutation({ action: 'delete_skill', skillName: sk.name, mode: 'archive' });
                            setSkBusy(false);
                            if (res) setDrawer(null);
                          },
                        },
                        '移入归档 (skills-disabled)',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm ch-btn-danger',
                          disabled: skBusy,
                          onClick: async () => {
                            setSkBusy(true);
                            const res = await runMutation({ action: 'delete_skill', skillName: sk.name, mode: 'permanent' });
                            setSkBusy(false);
                            if (res) setDrawer(null);
                          },
                        },
                        '彻底删除',
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          onClick: () => setSkConfirmDelete(false),
                        },
                        t('btn.cancel'),
                      ),
                    ),
                  )
                : null,
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                renderSkillModePill(sk),
                h('span', { className: 'ch-pill' }, `${renderScopeLabel(sk.scopeGroup)} (${sk.source})`),
                !sk.writable ? h('span', { className: 'ch-pill' }, '只读内置') : null,
                ...(sk.bundles || []).map((b) =>
                  h(
                    'button',
                    {
                      key: b.id,
                      type: 'button',
                      className: 'ch-suite-chip',
                      onClick: () => jumpToSuite(b.id, 'skills'),
                    },
                    `${b.name} ›`,
                  ),
                ),
              ),
              h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12.5 } }, sk.description),
              h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-label' }, '触发方式（不修改磁盘 SKILL.md）'),
                h(
                  'div',
                  { className: 'ch-seg' },
                  [
                    { id: 'default', label: t('mode.default') },
                    { id: 'auto', label: t('mode.auto') },
                    { id: 'manual', label: t('mode.manual') },
                    { id: 'muted', label: t('mode.muted') },
                  ].map((opt) =>
                    h(
                      'button',
                      {
                        key: opt.id,
                        type: 'button',
                        className: activeMode === opt.id ? 'ch-seg-btn active' : 'ch-seg-btn',
                        onClick: () => runMutation({ action: 'set_skill_mode', skillName: sk.name, mode: opt.id }),
                      },
                      opt.label,
                    ),
                  ),
                ),
              ),
              (skillDoc.path || sk.path)
                ? h(
                    'div',
                    { className: 'ch-code-box' },
                    h(
                      'div',
                      { className: 'ch-code-head' },
                      h('span', null, '文件路径'),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          onClick: () => triggerCopy('skill-path', skillDoc.path || sk.path),
                        },
                        copiedKey === 'skill-path' ? t('btn.copied') : t('btn.copyPath'),
                      ),
                    ),
                    h('pre', { className: 'ch-pre', style: { maxHeight: 72 } }, skillDoc.path || sk.path),
                  )
                : null,
              h(
                'div',
                { className: 'ch-code-box' },
                h('div', { className: 'ch-code-head' }, h('span', null, 'SKILL.md 指令正文预览')),
                h(
                  'pre',
                  { className: 'ch-pre' },
                  skillDoc.loading
                    ? '正在读取 SKILL.md…'
                    : skillDoc.error
                      ? skillDoc.error
                      : skillDoc.content || '（空内容）',
                ),
              ),
            ),
          );
        }

        if (drawer.kind === 'mcp') {
          const m = data?.mcps?.find((item) => item.name === drawer.name);
          if (!m) return null;
          const tq = drawerToolQuery.trim().toLowerCase();
          const tools = (m.tools || []).filter(
            (tl) => !tq || tl.shortName.toLowerCase().includes(tq) || (tl.description || '').toLowerCase().includes(tq),
          );
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title ch-mono' }, m.name),
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' } },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                  h('span', { className: 'ch-pill ch-mono' }, m.transport),
                  renderMcpConnPill(m),
                  m.hasAuth ? h('span', { className: 'ch-pill ok' }, '已配置鉴权') : null,
                  h('span', { className: 'ch-pill' }, `${m.totalTools} tools`),
                  ...(m.bundles || []).map((b) =>
                    h(
                      'button',
                      {
                        key: b.id,
                        type: 'button',
                        className: 'ch-suite-chip',
                        onClick: () => jumpToSuite(b.id, 'mcps'),
                      },
                      `${b.name} ›`,
                    ),
                  ),
                ),
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  m.canRestart
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          disabled: isMcpBusy(m),
                          style: { display: 'inline-flex', alignItems: 'center', gap: 5 },
                          onClick: () => handleRestartMcp(m.name),
                        },
                        isMcpBusy(m) ? h('span', { className: 'ch-spinner', 'aria-hidden': 'true' }) : null,
                        isMcpBusy(m) ? t('btn.restarting') : t('btn.restart'),
                      )
                    : null,
                  m.isCustom
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          onClick: () => openConnectMcp(m),
                        },
                        '编辑配置',
                      )
                    : null,
                  m.isCustom
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm ch-btn-danger',
                          onClick: async () => {
                            await runMutation({ action: 'delete_custom_mcp', serverName: m.name });
                            setDrawer(null);
                          },
                        },
                        t('btn.deleteBundle'),
                      )
                    : null,
                  (m.bundles && m.bundles.length > 0)
                    ? (m.disableReason === 'manual'
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'ch-btn ch-btn-sm',
                              onClick: async () => {
                                const ok = await runMutation({ action: 'toggle_mcp_server', serverName: m.name, enabled: true });
                                if (ok) showNotice({ text: t('toast.mcpGlobalRestored').replace('{name}', m.name) });
                              },
                            },
                            t('mcp.globalRestore'),
                          )
                        : h(
                            'button',
                            {
                              type: 'button',
                              className: 'ch-btn ch-btn-sm ch-btn-danger',
                              onClick: () => setModal({ kind: 'confirm-global-stop', serverName: m.name }),
                            },
                            t('mcp.globalStop'),
                          ))
                    : h(Switch, {
                        checked: m.enabled,
                        label: m.name,
                        onChange: (next) => runMutation({ action: 'toggle_mcp_server', serverName: m.name, enabled: next }),
                      }),
                ),
              ),
              m.lastError ? h('div', { className: 'ch-banner-err' }, m.lastError) : null,
              h(
                'div',
                { className: 'ch-field' },
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
                  h('span', { className: 'ch-label' }, `细分工具 (${tools.length})`),
                  h(
                    'div',
                    { style: { display: 'flex', gap: 6 } },
                    h('button', { type: 'button', className: 'ch-btn ch-btn-sm', disabled: m.disableReason === 'manual', onClick: () => runMutation({ action: 'batch_mcp_tools', serverName: m.name, enabled: true }) }, t('btn.enableAll')),
                    h('button', { type: 'button', className: 'ch-btn ch-btn-sm', disabled: m.disableReason === 'manual', onClick: () => runMutation({ action: 'batch_mcp_tools', serverName: m.name, enabled: false }) }, t('btn.disableAll')),
                  ),
                ),
                (m.tools || []).length > 5
                  ? h('input', {
                      type: 'search',
                      className: 'ch-input ch-field-input',
                      placeholder: '筛选此 MCP 下的工具名或描述…',
                      value: drawerToolQuery,
                      onChange: (e) => setDrawerToolQuery(e.target.value),
                    })
                  : null,
                h(
                  'div',
                  { className: 'ch-checklist', style: { maxHeight: 240 } },
                  tools.length === 0
                    ? h(
                        'div',
                        { style: { padding: 12, color: 'var(--dsw-alias-label-tertiary)', display: 'flex', alignItems: 'center', gap: 8 } },
                        isMcpBusy(m)
                          ? h(React.Fragment, null, h('span', { className: 'ch-spinner', 'aria-hidden': 'true' }), '正在连接并加载工具列表…')
                          : '无匹配工具',
                      )
                    : tools.map((tl) => {
                        const globalChecked = !tl.individuallyDisabled;
                        const locked = m.disableReason === 'manual';
                        return h(
                          'div',
                          {
                            key: tl.name,
                            className: 'ch-check-item',
                            style: { justifyContent: 'space-between' },
                            onClick: () =>
                              !locked && runMutation({ action: 'toggle_mcp_tool', toolName: tl.name, enabled: !globalChecked }),
                          },
                          h(
                            'div',
                            { style: { minWidth: 0, flex: 1, paddingRight: 8 } },
                            h('div', { className: 'ch-mono', style: { fontWeight: 500 } }, tl.shortName),
                            tl.description
                              ? h(
                                  'div',
                                  {
                                    style: {
                                      fontSize: 11,
                                      color: 'var(--dsw-alias-label-tertiary)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    },
                                  },
                                  tl.description,
                                )
                              : null,
                          ),
                          h(Switch, {
                            checked: globalChecked,
                            disabled: locked,
                            label: tl.shortName,
                            onChange: (next) => runMutation({ action: 'toggle_mcp_tool', toolName: tl.name, enabled: next }),
                          }),
                        );
                      }),
                ),
              ),
              h(
                'div',
                { className: 'ch-code-box' },
                h(
                  'div',
                  { className: 'ch-code-head' },
                  h('span', null, 'mcp.json 等价配置预览'),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'ch-btn ch-btn-sm',
                      onClick: () => triggerCopy('mcp-json', m.mcpJsonSnippet),
                    },
                    copiedKey === 'mcp-json' ? t('btn.copied') : t('btn.copy'),
                  ),
                ),
                h('pre', { className: 'ch-pre', style: { maxHeight: 160 } }, m.mcpJsonSnippet),
              ),
            ),
          );
        }

        if (drawer.kind === 'bundle-form') {
          const sq = bfSkillFilter.trim().toLowerCase();
          const candidateSkills = (data?.skills || []).filter(
            (s) => !sq || s.name.toLowerCase().includes(sq) || (s.description || '').toLowerCase().includes(sq),
          );
          const toggleInList = (arr, setter, val) => {
            setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
          };
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title' }, bfId ? t('btn.editBundle') : t('btn.newBundle')),
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              h(
                'div',
                { className: 'ch-field' },
                h('label', { className: 'ch-label' }, '套件名称'),
                h('input', {
                  className: 'ch-input ch-field-input',
                  placeholder: '例如：研发工具套件 / 个人写作套件',
                  value: bfName,
                  onChange: (e) => setBfName(e.target.value),
                }),
              ),
              h(
                'div',
                { className: 'ch-field' },
                h('label', { className: 'ch-label' }, '用途描述'),
                h('textarea', {
                  className: 'ch-textarea',
                  placeholder: '简述该套件适用的工程或工作流场景…',
                  value: bfDesc,
                  onChange: (e) => setBfDesc(e.target.value),
                }),
              ),
              h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-label' }, '图标与主题色'),
                h(
                  'div',
                  { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
                  h(
                    'div',
                    { style: { display: 'flex', gap: 6 } },
                    ['bolt', 'layers', 'spark', 'terminal'].map((ic) =>
                      h(
                        'button',
                        {
                          key: ic,
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          style: bfIcon === ic ? { borderColor: bfColor, color: bfColor } : undefined,
                          onClick: () => setBfIcon(ic),
                        },
                        h(SuiteGlyph, { kind: ic, size: 15 }),
                      ),
                    ),
                  ),
                  h(
                    'div',
                    { className: 'ch-swatches' },
                    ['#2563eb', '#0d9488', '#7c3aed', '#d97706', '#e11d48', '#334155'].map((c) =>
                      h('button', {
                        key: c,
                        type: 'button',
                        className: bfColor === c ? 'ch-swatch selected' : 'ch-swatch',
                        style: { background: c },
                        onClick: () => setBfColor(c),
                      }),
                    ),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-label' }, `包含的 MCP 服务 (已选 ${bfMcps.length})`),
                h(
                  'div',
                  { className: 'ch-checklist', style: { maxHeight: 120 } },
                  (data?.mcps || []).map((m) =>
                    h(
                      'label',
                      { key: m.name, className: 'ch-check-item' },
                      h('input', {
                        type: 'checkbox',
                        checked: bfMcps.includes(m.name),
                        onChange: () => toggleInList(bfMcps, setBfMcps, m.name),
                      }),
                      h('span', { className: 'ch-mono', style: { fontWeight: 500 } }, m.name),
                      h('span', { className: 'ch-slug' }, `${m.totalTools} tools`),
                    ),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'ch-field' },
                h(
                  'div',
                  { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h('span', { className: 'ch-label' }, `包含的 Skills (已选 ${bfSkills.length})`),
                  candidateSkills.length > 0
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'ch-btn ch-btn-sm',
                          onClick: () => {
                            const names = candidateSkills.map((s) => s.name);
                            const allIn = names.every((n) => bfSkills.includes(n));
                            setBfSkills(
                              allIn
                                ? bfSkills.filter((n) => !names.includes(n))
                                : [...new Set([...bfSkills, ...names])],
                            );
                          },
                        },
                        '全选/反选当前筛选',
                      )
                    : null,
                ),
                h('input', {
                  type: 'search',
                  className: 'ch-input ch-field-input',
                  placeholder: '按前缀或关键词筛选技能…',
                  value: bfSkillFilter,
                  onChange: (e) => setBfSkillFilter(e.target.value),
                }),
                h(
                  'div',
                  { className: 'ch-checklist' },
                  candidateSkills.map((s) =>
                    h(
                      'label',
                      { key: s.name, className: 'ch-check-item' },
                      h('input', {
                        type: 'checkbox',
                        checked: bfSkills.includes(s.name),
                        onChange: () => toggleInList(bfSkills, setBfSkills, s.name),
                      }),
                      h('span', { className: 'ch-mono', style: { fontWeight: 500 } }, s.name),
                      h('span', { className: 'ch-slug' }, renderScopeLabel(s.scopeGroup)),
                    ),
                  ),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ch-drawer-foot' },
              h('button', { type: 'button', className: 'ch-btn', onClick: () => setDrawer(null) }, t('btn.cancel')),
              h(
                'button',
                {
                  type: 'button',
                  className: 'ch-btn ch-btn-primary',
                  disabled: !bfName.trim(),
                  onClick: async () => {
                    const res = await runMutation({
                      action: 'save_bundle',
                      bundleId: bfId || undefined,
                      name: bfName.trim(),
                      description: bfDesc.trim(),
                      icon: bfIcon,
                      color: bfColor,
                      mcps: bfMcps,
                      skills: bfSkills,
                    });
                    if (res) setDrawer(null);
                  },
                },
                bfId ? t('btn.save') : t('btn.create'),
              ),
            ),
          );
        }

        if (drawer.kind === 'connect-mcp') {
          const credRe = /\$\{credential:[^}]+\}/;
          const maskPreview = (val) => {
            const str = String(val || '');
            if (!str) return '';
            if (credRe.test(str)) return str;
            const bm = /^(Bearer\s+)(.+)$/i.exec(str);
            if (bm) return `${bm[1]}${maskPreview(bm[2])}`;
            if (str.length <= 8) return '****';
            return `${str.slice(0, 4)}****${str.slice(-4)}`;
          };
          const parseKvLines = (text, sep) => {
            const map = {};
            for (const rawLine of String(text || '').split(/\r?\n/)) {
              const line = rawLine.trim();
              if (!line || line.startsWith('#')) continue;
              const idx = line.indexOf(sep);
              if (idx <= 0) continue;
              const k = line.slice(0, idx).trim();
              const v = line.slice(idx + 1).trim();
              if (k && v) map[k] = v;
            }
            return map;
          };
          const buildHttpHeaders = (forPreview) => {
            const out = {};
            if (cmAuthType === 'bearer') {
              const tok = cmBearerToken.trim();
              if (tok) {
                const rawVal = /^bearer\s+/i.test(tok) ? tok : `Bearer ${tok}`;
                out.Authorization = forPreview ? maskPreview(rawVal) : rawVal;
              } else {
                const existingAuthKey = Object.keys(cmKeepHeaders).find((k) => /^authorization$/i.test(k));
                if (existingAuthKey) {
                  out[existingAuthKey] = forPreview ? cmKeepHeaders[existingAuthKey] : '__KEEP__';
                }
              }
            } else if (cmAuthType === 'api-key') {
              const hk = cmApiKeyHeader.trim() || 'X-API-Key';
              const hv = cmApiKeyValue.trim();
              if (hv) {
                out[hk] = forPreview ? maskPreview(hv) : hv;
              } else if (cmKeepHeaders[hk]) {
                out[hk] = forPreview ? cmKeepHeaders[hk] : '__KEEP__';
              }
            } else if (cmAuthType === 'custom') {
              for (const [k, masked] of Object.entries(cmKeepHeaders)) {
                out[k] = forPreview ? masked : '__KEEP__';
              }
              const parsed = parseKvLines(cmHeadersText, ':');
              for (const [k, v] of Object.entries(parsed)) {
                out[k] = forPreview ? maskPreview(v) : v;
              }
            }
            return out;
          };
          const buildStdioEnv = (forPreview) => {
            const out = {};
            for (const [k, masked] of Object.entries(cmKeepEnv)) {
              out[k] = forPreview ? masked : '__KEEP__';
            }
            const parsed = parseKvLines(cmEnvText, '=');
            for (const [k, v] of Object.entries(parsed)) {
              out[k] = forPreview ? maskPreview(v) : v;
            }
            return out;
          };

          const previewHeaders = buildHttpHeaders(true);
          const previewEnv = buildStdioEnv(true);
          const hasCredTpl =
            credRe.test(cmUrl) ||
            credRe.test(cmCommand) ||
            credRe.test(cmArgs) ||
            credRe.test(cmCwd) ||
            Object.values(previewHeaders).some((v) => credRe.test(String(v))) ||
            Object.values(previewEnv).some((v) => credRe.test(String(v)));

          const previewJson = JSON.stringify(
            {
              mcpServers: {
                [cmName.trim() || 'my_server']:
                  cmTransport === 'stdio'
                    ? {
                        transport: 'stdio',
                        command: cmCommand.trim() || 'npx',
                        ...(cmArgs.trim() ? { args: cmArgs.trim().split(/\s+/) } : {}),
                        ...(Object.keys(previewEnv).length ? { env: previewEnv } : {}),
                        ...(cmCwd.trim() ? { cwd: cmCwd.trim() } : {}),
                        ...(hasCredTpl ? { expandTemplates: true } : {}),
                      }
                    : {
                        transport: 'streamable-http',
                        url: cmUrl.trim() || 'https://example.com/mcp',
                        ...(Object.keys(previewHeaders).length ? { headers: previewHeaders } : {}),
                        ...(hasCredTpl ? { expandTemplates: true } : {}),
                      },
              },
            },
            null,
            2,
          );
          const existingBearerKey = Object.keys(cmKeepHeaders).find((k) => /^authorization$/i.test(k));
          const existingApiKeyVal = cmKeepHeaders[cmApiKeyHeader.trim() || 'X-API-Key'];

          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title' }, cmEditing ? `编辑自定义 MCP · ${cmName}` : '连接自定义 MCP 服务'),
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              h(
                'div',
                { className: 'ch-field' },
                h('label', { className: 'ch-label' }, '服务标识 (serverName)'),
                h('input', {
                  className: 'ch-input ch-field-input ch-mono',
                  placeholder: '例如: github_mcp 或 local_sqlite',
                  value: cmName,
                  disabled: cmEditing,
                  onChange: (e) => setCmName(e.target.value),
                }),
              ),
              h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-label' }, '传输协议 (Transport)'),
                h(
                  'div',
                  { className: 'ch-seg', style: { gridTemplateColumns: '1fr 1fr' } },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: cmTransport === 'streamable-http' ? 'ch-seg-btn active' : 'ch-seg-btn',
                      onClick: () => setCmTransport('streamable-http'),
                    },
                    'Streamable HTTP',
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: cmTransport === 'stdio' ? 'ch-seg-btn active' : 'ch-seg-btn',
                      onClick: () => setCmTransport('stdio'),
                    },
                    'STDIO 本地进程',
                  ),
                ),
              ),
              cmTransport === 'streamable-http'
                ? h(
                    React.Fragment,
                    null,
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, 'MCP Endpoint URL'),
                      h('input', {
                        className: 'ch-input ch-field-input ch-mono',
                        placeholder: 'https://mcp.example.com/mcp',
                        value: cmUrl,
                        onChange: (e) => setCmUrl(e.target.value),
                      }),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('span', { className: 'ch-label' }, '鉴权方式 (Authentication)'),
                      h(
                        'div',
                        { className: 'ch-seg', style: { gridTemplateColumns: 'repeat(4, 1fr)' } },
                        [
                          ['none', '无鉴权'],
                          ['bearer', 'Bearer'],
                          ['api-key', 'API Key'],
                          ['custom', '自定义'],
                        ].map(([k, label]) =>
                          h(
                            'button',
                            {
                              key: k,
                              type: 'button',
                              className: cmAuthType === k ? 'ch-seg-btn active' : 'ch-seg-btn',
                              onClick: () => setCmAuthType(k),
                            },
                            label,
                          ),
                        ),
                      ),
                    ),
                    cmAuthType === 'bearer'
                      ? h(
                          'div',
                          { className: 'ch-field' },
                          h(
                            'div',
                            { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
                            h('label', { className: 'ch-label' }, 'Bearer Token'),
                            h(
                              'button',
                              { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setCmShowSecret((v) => !v) },
                              cmShowSecret ? '隐藏' : '显示',
                            ),
                          ),
                          h('input', {
                            type: cmShowSecret ? 'text' : 'password',
                            className: 'ch-input ch-field-input ch-mono',
                            placeholder: existingBearerKey
                              ? `已保存 (${cmKeepHeaders[existingBearerKey]})，留空保持不变`
                              : 'sk-... 或 ${credential:MCP_TOKEN}',
                            value: cmBearerToken,
                            onChange: (e) => setCmBearerToken(e.target.value),
                          }),
                          h('div', { className: 'ch-muted', style: { fontSize: 12 } }, '将自动以 Authorization: Bearer <token> 发送，支持 DSH 凭据模板 ${credential:REF}。'),
                        )
                      : null,
                    cmAuthType === 'api-key'
                      ? h(
                          React.Fragment,
                          null,
                          h(
                            'div',
                            { className: 'ch-field' },
                            h('label', { className: 'ch-label' }, 'Header 名称'),
                            h('input', {
                              className: 'ch-input ch-field-input ch-mono',
                              placeholder: 'X-API-Key',
                              value: cmApiKeyHeader,
                              onChange: (e) => setCmApiKeyHeader(e.target.value),
                            }),
                          ),
                          h(
                            'div',
                            { className: 'ch-field' },
                            h(
                              'div',
                              { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
                              h('label', { className: 'ch-label' }, 'API Key 值'),
                              h(
                                'button',
                                { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setCmShowSecret((v) => !v) },
                                cmShowSecret ? '隐藏' : '显示',
                              ),
                            ),
                            h('input', {
                              type: cmShowSecret ? 'text' : 'password',
                              className: 'ch-input ch-field-input ch-mono',
                              placeholder: existingApiKeyVal
                                ? `已保存 (${existingApiKeyVal})，留空保持不变`
                                : '输入 Key 或 ${credential:API_KEY}',
                              value: cmApiKeyValue,
                              onChange: (e) => setCmApiKeyValue(e.target.value),
                            }),
                          ),
                        )
                      : null,
                    cmAuthType === 'custom'
                      ? h(
                          'div',
                          { className: 'ch-field' },
                          h('label', { className: 'ch-label' }, '自定义 Headers（每行一条 Key: Value）'),
                          Object.keys(cmKeepHeaders).length > 0
                            ? h(
                                'div',
                                { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 } },
                                Object.entries(cmKeepHeaders).map(([k, masked]) =>
                                  h(
                                    'span',
                                    { key: k, className: 'ch-pill ch-mono', style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
                                    `${k}: ${masked}`,
                                    h(
                                      'button',
                                      {
                                        type: 'button',
                                        style: { border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'inherit' },
                                        title: '移除此 Header',
                                        onClick: () =>
                                          setCmKeepHeaders((prev) => {
                                            const next = { ...prev };
                                            delete next[k];
                                            return next;
                                          }),
                                      },
                                      '✕',
                                    ),
                                  ),
                                ),
                              )
                            : null,
                          h('textarea', {
                            className: 'ch-input ch-field-input ch-mono',
                            rows: 3,
                            placeholder: 'Authorization: Bearer ${credential:MCP_TOKEN}\nX-Tenant-Id: prod',
                            value: cmHeadersText,
                            onChange: (e) => setCmHeadersText(e.target.value),
                          }),
                        )
                      : null,
                  )
                : h(
                    React.Fragment,
                    null,
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '启动命令 (Command)'),
                      h('input', {
                        className: 'ch-input ch-field-input ch-mono',
                        placeholder: 'npx',
                        value: cmCommand,
                        onChange: (e) => setCmCommand(e.target.value),
                      }),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '参数 (空格分隔)'),
                      h('input', {
                        className: 'ch-input ch-field-input ch-mono',
                        placeholder: '-y @modelcontextprotocol/server-memory',
                        value: cmArgs,
                        onChange: (e) => setCmArgs(e.target.value),
                      }),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '环境变量 / 鉴权凭据 (Env，每行 KEY=VALUE，可选)'),
                      Object.keys(cmKeepEnv).length > 0
                        ? h(
                            'div',
                            { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 } },
                            Object.entries(cmKeepEnv).map(([k, masked]) =>
                              h(
                                'span',
                                { key: k, className: 'ch-pill ch-mono', style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
                                `${k}=${masked}`,
                                h(
                                  'button',
                                  {
                                    type: 'button',
                                    style: { border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'inherit' },
                                    title: '移除此环境变量',
                                    onClick: () =>
                                      setCmKeepEnv((prev) => {
                                        const next = { ...prev };
                                        delete next[k];
                                        return next;
                                      }),
                                  },
                                  '✕',
                                ),
                              ),
                            ),
                          )
                        : null,
                      h('textarea', {
                        className: 'ch-input ch-field-input ch-mono',
                        rows: 3,
                        placeholder: 'GITHUB_TOKEN=${credential:GITHUB_TOKEN}\nAPI_KEY=your-key',
                        value: cmEnvText,
                        onChange: (e) => setCmEnvText(e.target.value),
                      }),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '工作目录 (可选)'),
                      h('input', {
                        className: 'ch-input ch-field-input ch-mono',
                        placeholder: '/Users/...',
                        value: cmCwd,
                        onChange: (e) => setCmCwd(e.target.value),
                      }),
                    ),
                  ),
              h(
                'div',
                { className: 'ch-code-box' },
                h('div', { className: 'ch-code-head' }, h('span', null, '底层配置实时预览（密钥已脱敏）')),
                h('pre', { className: 'ch-pre' }, previewJson),
              ),
            ),
            h(
              'div',
              { className: 'ch-drawer-foot' },
              h('button', { type: 'button', className: 'ch-btn', onClick: () => setDrawer(null) }, t('btn.cancel')),
              h(
                'button',
                {
                  type: 'button',
                  className: 'ch-btn ch-btn-primary',
                  disabled: !cmName.trim(),
                  onClick: async () => {
                    const headers = cmTransport === 'streamable-http' ? buildHttpHeaders(false) : {};
                    const env = cmTransport === 'stdio' ? buildStdioEnv(false) : {};
                    const res = await runMutation({
                      action: 'save_custom_mcp',
                      serverName: cmName.trim(),
                      transport: cmTransport,
                      url: cmUrl.trim(),
                      headers,
                      command: cmCommand.trim(),
                      argsText: cmArgs.trim(),
                      env,
                      serverCwd: cmCwd.trim(),
                    });
                    if (res) setDrawer(null);
                  },
                },
                cmEditing ? '保存并重新挂载' : '保存并立即挂载',
              ),
            ),
          );
        }

        if (drawer.kind === 'add-skill') {
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title' }, skOverwrite ? `编辑 Skill · ${skName}` : '添加 Skill'),
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              !skOverwrite
                ? h(
                    'div',
                    { className: 'ch-field' },
                    h(
                      'div',
                      { className: 'ch-seg' },
                      [
                        { id: 'create', label: '新建 / 粘贴 SKILL.md' },
                        { id: 'import', label: '导入 (仓库 / 目录 / ZIP)' },
                      ].map((opt) =>
                        h(
                          'button',
                          {
                            key: opt.id,
                            type: 'button',
                            className: skModeTab === opt.id ? 'ch-seg-btn active' : 'ch-seg-btn',
                            onClick: () => setSkModeTab(opt.id),
                          },
                          opt.label,
                        ),
                      ),
                    ),
                  )
                : null,
              skModeTab === 'create' || skOverwrite
                ? h(
                    React.Fragment,
                    null,
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, 'Skill 名称（kebab-case，如 my-skill）'),
                      h('input', {
                        className: 'ch-input ch-field-input ch-mono',
                        placeholder: 'my-custom-skill',
                        disabled: skOverwrite,
                        value: skName,
                        onChange: (e) => setSkName(e.target.value),
                      }),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '简短描述（决定模型何时自动触发）'),
                      h('input', {
                        className: 'ch-input ch-field-input',
                        placeholder: '说明这个技能的作用与适用场景…',
                        value: skDesc,
                        onChange: (e) => setSkDesc(e.target.value),
                      }),
                    ),
                    !skOverwrite
                      ? h(
                          'div',
                          { className: 'ch-field' },
                          h('label', { className: 'ch-label' }, '保存位置'),
                          h(
                            'select',
                            {
                              className: 'ch-select',
                              value: skScope,
                              onChange: (e) => setSkScope(e.target.value),
                            },
                            h('option', { value: 'user-agents' }, '用户全局 (~/.agents/skills)'),
                            h('option', { value: 'user-dsh' }, 'DSH 用户目录 (~/.dsh/skills)'),
                            cwd ? h('option', { value: 'project-agents' }, `当前项目 (${cwd}/.agents/skills)`) : null,
                            cwd ? h('option', { value: 'project-dsh' }, `当前项目 (${cwd}/.dsh/skills)`) : null,
                          ),
                        )
                      : null,
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '指令正文（可直接粘贴完整 SKILL.md，将自动解析 frontmatter）'),
                      h('textarea', {
                        className: 'ch-textarea ch-mono',
                        style: { minHeight: 220 },
                        placeholder: '# 技能说明\n\n当用户需要……时，按以下步骤执行：',
                        value: skBody,
                        onChange: (e) => handleSkillBodyPaste(e.target.value),
                      }),
                    ),
                  )
                : h(
                    React.Fragment,
                    null,
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '导入来源'),
                      h(
                        'div',
                        { className: 'ch-seg' },
                        [
                          { id: 'repo', label: 'GitHub / skills 包' },
                          { id: 'local', label: '本地目录' },
                          { id: 'zip', label: '.zip 压缩包' },
                        ].map((opt) =>
                          h(
                            'button',
                            {
                              key: opt.id,
                              type: 'button',
                              className: skImportKind === opt.id ? 'ch-seg-btn active' : 'ch-seg-btn',
                              onClick: () => setSkImportKind(opt.id),
                            },
                            opt.label,
                          ),
                        ),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'ch-field' },
                      h('label', { className: 'ch-label' }, '安装位置'),
                      h(
                        'select',
                        {
                          className: 'ch-select',
                          value: skScope,
                          onChange: (e) => setSkScope(e.target.value),
                        },
                        h('option', { value: 'user-agents' }, '用户全局 (~/.agents/skills)'),
                        h('option', { value: 'user-dsh' }, 'DSH 用户目录 (~/.dsh/skills)'),
                        cwd ? h('option', { value: 'project-agents' }, `当前项目 (${cwd}/.agents/skills)`) : null,
                        cwd ? h('option', { value: 'project-dsh' }, `当前项目 (${cwd}/.dsh/skills)`) : null,
                      ),
                    ),
                    skImportKind === 'repo'
                      ? h(
                          'div',
                          { className: 'ch-field' },
                          h('label', { className: 'ch-label' }, '仓库或命令（调用 npx skills add）'),
                          h('input', {
                            className: 'ch-input ch-field-input ch-mono',
                            placeholder: 'owner/repo 或 https://github.com/owner/repo',
                            value: skRepoSpec,
                            onChange: (e) => setSkRepoSpec(e.target.value),
                          }),
                        )
                      : skImportKind === 'local'
                        ? h(
                            'div',
                            { className: 'ch-field' },
                            h('label', { className: 'ch-label' }, '本地技能目录或包含多个技能的父目录路径'),
                            h('input', {
                              className: 'ch-input ch-field-input ch-mono',
                              placeholder: '/Users/.../my-skill 或 ~/Downloads/skills',
                              value: skLocalPath,
                              onChange: (e) => setSkLocalPath(e.target.value),
                            }),
                          )
                        : h(
                            'div',
                            { className: 'ch-field' },
                            h('label', { className: 'ch-label' }, '选择包含 SKILL.md 的 .zip 压缩包'),
                            h('input', {
                              type: 'file',
                              accept: '.zip,application/zip',
                              className: 'ch-input ch-field-input',
                              onChange: (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setSkZipName(file.name);
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setSkZipB64(typeof reader.result === 'string' ? reader.result : '');
                                };
                                reader.readAsDataURL(file);
                              },
                            }),
                            skZipName ? h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginTop: 4 } }, `已选文件：${skZipName}`) : null,
                          ),
                  ),
            ),
            h(
              'div',
              { className: 'ch-drawer-foot' },
              h('button', { type: 'button', className: 'ch-btn', onClick: () => setDrawer(null) }, t('btn.cancel')),
              skModeTab === 'create' || skOverwrite
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'ch-btn ch-btn-primary',
                      disabled: skBusy || !skName.trim() || !skDesc.trim(),
                      onClick: async () => {
                        setSkBusy(true);
                        const res = await runMutation({
                          action: 'save_skill',
                          skillName: skName.trim(),
                          description: skDesc.trim(),
                          whenToUse: skWhen.trim(),
                          content: skBody,
                          scope: skScope,
                          overwrite: skOverwrite,
                          targetPath: skTargetPath,
                        });
                        setSkBusy(false);
                        if (res) setDrawer(null);
                      },
                    },
                    skBusy ? '正在保存…' : skOverwrite ? t('btn.save') : '保存并立即生效',
                  )
                : h(
                    'button',
                    {
                      type: 'button',
                      className: 'ch-btn ch-btn-primary',
                      disabled:
                        skBusy
                        || (skImportKind === 'repo' && !skRepoSpec.trim())
                        || (skImportKind === 'local' && !skLocalPath.trim())
                        || (skImportKind === 'zip' && !skZipB64),
                      onClick: async () => {
                        setSkBusy(true);
                        const res = await runMutation({
                          action: 'import_skill',
                          sourceType: skImportKind,
                          scope: skScope,
                          repoSpec: skRepoSpec.trim(),
                          localPath: skLocalPath.trim(),
                          zipBase64: skZipB64,
                        });
                        setSkBusy(false);
                        if (res) setDrawer(null);
                      },
                    },
                    skBusy ? '正在导入…' : '开始导入',
                  ),
            ),
          );
        }

        return null;
      };

      const budgetText = t('budget.label')
        .replace('{skills}', String(summary.autoSkills))
        .replace('{tools}', String(summary.activeToolCount));
      const ratioText = t('budget.ratio').replace('{pct}', String(summary.budgetPercent));

      return h(
        'div',
        { className: 'ch-root' },
        h('style', null, STYLES),
        h(
          'header',
          { className: 'ch-topbar' },
          h(
            'div',
            { className: 'ch-breadcrumb' },
            selectedBundle
              ? h(
                  React.Fragment,
                  null,
                  h('span', { className: 'ch-breadcrumb-muted', onClick: () => setSelectedBundleId(null) }, t('header.title')),
                  h('span', { style: { color: 'var(--dsw-alias-label-tertiary)' } }, '/'),
                  h('span', null, selectedBundle.name),
                )
              : h('span', null, t('header.title')),
          ),
          h(
            'div',
            { className: 'ch-topbar-right' },
            (data?.workspaces || []).length > 1
              ? h(
                  'select',
                  {
                    className: 'ch-select ch-mono',
                    value: cwd,
                    onChange: (e) => setCwd(e.target.value),
                    title: '切换扫描的工作区目录',
                  },
                  data.workspaces.map((ws) =>
                    h('option', { key: ws, value: ws }, ws.split('/').slice(-2).join('/')),
                  ),
                )
              : null,
            h(
              'div',
              { className: 'ch-budget-pill', title: `自动注入字符约 ${summary.usedSkillChars || 0} / ${summary.budgetMaxChars || 8000}` },
              h('span', null, budgetText),
              h(
                'div',
                { className: 'ch-meter-track' },
                h('div', {
                  className: summary.budgetPercent > 85 ? 'ch-meter-fill warn' : 'ch-meter-fill',
                  style: { width: `${Math.max(4, summary.budgetPercent)}%` },
                }),
              ),
              h('span', null, ratioText),
            ),
            h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => refresh(cwd || undefined) }, t('btn.refresh')),
          ),
        ),
        h(
          'div',
          { className: 'ch-scroll' },
          h(
            'div',
            { className: 'ch-container' },
            error
              ? h(
                  'div',
                  { className: 'ch-banner-err' },
                  h('span', null, error),
                  h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setError('') }, '✕'),
                )
              : null,
            renderMainContent(),
          ),
        ),
        drawer
          ? h(
              React.Fragment,
              null,
              h('div', { className: 'ch-backdrop', onClick: () => setDrawer(null) }),
              h(
                'aside',
                { className: 'ch-drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Capability details' },
                renderDrawer(),
              ),
            )
          : null,
        notice
          ? h(
              'div',
              {
                className: 'ch-toast',
                role: 'status',
                'aria-live': 'polite',
                onMouseEnter: pauseNoticeTimer,
                onMouseLeave: () => startNoticeTimer(2000),
              },
              h('span', null, notice.text),
              h(
                'button',
                {
                  type: 'button',
                  className: 'ch-toast-close',
                  'aria-label': 'Close',
                  onClick: () => showNotice(null),
                },
                '✕',
              ),
            )
          : null,
        modal
          ? (() => {
              const isStop = modal.kind === 'confirm-global-stop';
              const isDelSuite = modal.kind === 'confirm-delete-suite';
              if (!isStop && !isDelSuite) return null;
              const title = isStop
                ? t('modal.globalStopTitle').replace('{name}', modal.serverName)
                : t('modal.deleteSuiteTitle').replace('{name}', modal.bundleName);
              const body = isStop ? t('modal.globalStopBody') : t('modal.deleteSuiteBody');
              const confirmLabel = isStop ? t('modal.confirmGlobalStop') : t('modal.confirmDelete');
              const onConfirm = async () => {
                if (isStop) {
                  const srv = modal.serverName;
                  const res = await runMutation({ action: 'toggle_mcp_server', serverName: srv, enabled: false });
                  setModal(null);
                  if (res) showNotice({ text: t('toast.mcpGlobalStopped').replace('{name}', srv) });
                } else {
                  const bid = modal.bundleId;
                  const res = await runMutation({ action: 'delete_bundle', bundleId: bid });
                  setModal(null);
                  if (res) setSelectedBundleId(null);
                }
              };
              const modalNode = h(
                'div',
                { className: 'ch-modal-backdrop', onClick: () => setModal(null) },
                h(
                  'div',
                  {
                    className: 'ch-modal',
                    role: 'dialog',
                    'aria-modal': 'true',
                    'aria-label': title,
                    onClick: (e) => e.stopPropagation(),
                  },
                  h(
                    'div',
                    { className: 'ch-modal-head' },
                    h('h3', { className: 'ch-modal-title' }, title),
                    h('button', { type: 'button', className: 'ch-modal-close', 'aria-label': 'Close', onClick: () => setModal(null) }, '✕'),
                  ),
                  h('p', { className: 'ch-modal-body' }, body),
                  h(
                    'div',
                    { className: 'ch-modal-actions' },
                    h('button', { type: 'button', className: 'ch-modal-btn-primary', onClick: () => setModal(null) }, t('modal.keepCurrent')),
                    h('button', { type: 'button', className: 'ch-modal-btn-secondary', onClick: onConfirm }, confirmLabel),
                  ),
                ),
              );
              if (ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined') {
                return ReactDOM.createPortal(modalNode, document.body);
              }
              return modalNode;
            })()
          : null,
        suiteMenu
          ? (() => {
              const menuNode = h(
                'div',
                {
                  className: 'ch-suite-menu',
                  role: 'menu',
                  style: { top: `${suiteMenu.top}px`, right: `${suiteMenu.right}px` },
                  onPointerDown: (e) => e.stopPropagation(),
                },
                suiteMenu.bundles.map((b) => {
                  const full = (data?.bundles || []).find((x) => x.id === b.id) || b;
                  const st = getSuiteState(full);
                  const stLabel = st === 'default'
                    ? t('suiteState.default')
                    : st === 'on_demand'
                      ? t('suiteState.onDemand')
                      : t('suiteState.disabled');
                  return h(
                    'button',
                    {
                      key: b.id,
                      type: 'button',
                      role: 'menuitem',
                      className: 'ch-suite-menu-item',
                      onClick: () => jumpToSuite(b.id, suiteMenu.subTab),
                    },
                    h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, b.name),
                    h('span', { className: 'ch-suite-menu-state' }, stLabel),
                  );
                }),
              );
              if (ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined') {
                return ReactDOM.createPortal(menuNode, document.body);
              }
              return menuNode;
            })()
          : null,
      );
    }

    function ComposerSuiteControl({ sessionId, t }) {
      const [status, setStatus] = useState(null);
      const [open, setOpen] = useState(false);
      const [busy, setBusy] = useState(false);
      const [anchorRect, setAnchorRect] = useState(null);
      const btnRef = useRef(null);
      const popRef = useRef(null);

      const loadSessionStatus = useCallback(async () => {
        if (!sessionId) return;
        try {
          const res = await callHubGet({ action: 'status', sessionId });
          setStatus(res);
        } catch {
          // Ignore transient load errors in composer control
        }
      }, [sessionId]);

      useEffect(() => {
        ensureHubStyles();
        loadSessionStatus();
        return subscribeHubChange(loadSessionStatus);
      }, [loadSessionStatus]);

      useEffect(() => {
        if (!open) return undefined;
        const updateRect = () => {
          if (btnRef.current) {
            setAnchorRect(btnRef.current.getBoundingClientRect());
          }
        };
        updateRect();
        const onPointerDown = (e) => {
          if (btnRef.current && btnRef.current.contains(e.target)) return;
          if (popRef.current && popRef.current.contains(e.target)) return;
          setOpen(false);
        };
        const onKeyDown = (e) => {
          if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', updateRect);
        return () => {
          window.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('keydown', onKeyDown);
          window.removeEventListener('resize', updateRect);
        };
      }, [open]);

      const enabledBundles = useMemo(
        () => (status?.bundles || []).filter(b => b.enabled !== false),
        [status],
      );
      const activeIds = useMemo(
        () => new Set(status?.session?.activeBundleIds || []),
        [status],
      );
      const overridden = Boolean(status?.session?.overridden);
      const sessionSummary = status?.session?.summary;

      const updateSessionBundles = useCallback(async (nextIdsOrNull) => {
        if (!sessionId || busy) return;
        setBusy(true);
        try {
          const payload = nextIdsOrNull === null
            ? { action: 'set_session_bundles', sessionId, reset: true }
            : { action: 'set_session_bundles', sessionId, bundleIds: nextIdsOrNull };
          const res = await callHubPost(payload);
          setStatus(res);
          notifyHubChange();
        } catch {
          // Reload to recover authoritative state
          loadSessionStatus();
        } finally {
          setBusy(false);
        }
      }, [sessionId, busy, loadSessionStatus]);

      const toggleOne = (bundleId) => {
        const next = new Set(activeIds);
        if (next.has(bundleId)) next.delete(bundleId);
        else next.add(bundleId);
        updateSessionBundles([...next]);
      };

      const renderPopover = () => {
        if (!open || !anchorRect) return null;
        const popWidth = 340;
        const left = Math.max(12, Math.min(anchorRect.left, window.innerWidth - popWidth - 12));
        const bottom = Math.max(12, window.innerHeight - anchorRect.top + 8);
        const popoverNode = h(
          'div',
          {
            ref: popRef,
            className: 'ch-session-popover',
            style: { left: `${left}px`, bottom: `${bottom}px` },
            role: 'dialog',
            'aria-label': t('composer.title'),
          },
          h(
            'div',
            { className: 'ch-sp-head' },
            h('span', null, t('composer.title')),
            overridden
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'ch-sp-reset',
                    disabled: busy,
                    onClick: () => updateSessionBundles(null),
                  },
                  t('composer.reset'),
                )
              : h('span', { style: { fontSize: 11, fontWeight: 400, color: 'var(--dsw-alias-label-tertiary, #8b93a1)' } }, t('composer.usingDefault')),
          ),
          h(
            'div',
            { className: 'ch-sp-list' },
            enabledBundles.length === 0
              ? h('div', { style: { padding: '14px 8px', textAlign: 'center', fontSize: 12, color: 'var(--dsw-alias-label-tertiary, #8b93a1)' } }, t('empty.list'))
              : enabledBundles.map((b) => {
                  const checked = activeIds.has(b.id);
                  const totalToolCount = (b.mcpDetails || []).reduce((acc, m) => acc + (m.totalTools || 0), 0);
                  const activeToolCount = (b.mcpDetails || []).reduce((acc, m) => acc + (m.bundleActiveTools ?? m.totalTools ?? 0), 0);
                  const totalSkillCount = (b.skillDetails || []).length;
                  const activeSkillCount = (b.skillDetails || []).filter((s) => (s.bundleEffectiveMode ?? s.effectiveMode) !== 'muted').length;
                  const toolLabel = activeToolCount !== totalToolCount ? `${activeToolCount}/${totalToolCount}` : `${totalToolCount}`;
                  const skillLabel = activeSkillCount !== totalSkillCount ? `${activeSkillCount}/${totalSkillCount}` : `${totalSkillCount}`;
                  return h(
                    'label',
                    { key: b.id, className: 'ch-sp-item' },
                    h('input', {
                      type: 'checkbox',
                      checked,
                      disabled: busy,
                      onChange: () => toggleOne(b.id),
                    }),
                    h(
                      'div',
                      { className: 'ch-sp-info' },
                      h(
                        'div',
                        { className: 'ch-sp-name' },
                        h('span', null, b.name),
                        h(
                          'span',
                          { className: `ch-default-pill ${b.defaultInject !== false ? 'on' : 'off'}` },
                          b.defaultInject !== false ? t('defaultInject.on') : t('defaultInject.off'),
                        ),
                      ),
                      h(
                        'div',
                        { className: 'ch-sp-meta' },
                        `${toolLabel} 工具 · ${skillLabel} Skills`,
                      ),
                    ),
                  );
                }),
          ),
          h(
            'div',
            { className: 'ch-sp-foot' },
            h(
              'span',
              null,
              sessionSummary
                ? `${sessionSummary.activeToolCount} 工具 · ${sessionSummary.autoSkills} 自动 Skill · ${sessionSummary.budgetPercent}%`
                : t('loading'),
            ),
            h('span', null, t('composer.footerHint')),
          ),
        );
        if (ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined') {
          return ReactDOM.createPortal(popoverNode, document.body);
        }
        return popoverNode;
      };

      const activeCount = enabledBundles.filter(b => activeIds.has(b.id)).length;
      const totalCount = enabledBundles.length;

      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            ref: btnRef,
            type: 'button',
            className: `ch-composer-btn${overridden ? ' overridden' : ''}`,
            title: t('composer.title'),
            onClick: () => {
              const next = !open;
              setOpen(next);
              if (next) loadSessionStatus();
            },
          },
          h(HubSidebarIcon, { size: 13 }),
          h('span', null, status ? `${t('composer.suites')} ${activeCount}/${totalCount}` : t('composer.suites')),
          h('span', { style: { fontSize: 10, opacity: 0.7 } }, '▾'),
        ),
        renderPopover(),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ensureHubStyles();
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { zh, en });
          } catch {
            return () => {};
          }
        }, 'capability-hub: locale dictionary');

        const boundT = typeof ctx.locale?.bind === 'function' ? ctx.locale.bind(NS) : null;
        const fallbackT = (key) => {
          const lang = typeof document !== 'undefined' ? (document.documentElement.lang || 'zh') : 'zh';
          const dict = lang.toLowerCase().startsWith('en') ? en : zh;
          return dict[key] || key;
        };
        const translate = (key) => {
          if (boundT) {
            const v = boundT(key);
            if (v && v !== key) return v;
          }
          return fallbackT(key);
        };

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
              locale: NS,
            },
            () => h(CapabilityHubView, { t: translate }),
          ),
        );

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: -5,
              label: () => translate('nav'),
              locale: NS,
            },
            (owner = {}) => h(HubSidebarIcon, { size: owner.size ?? 16 }),
          ),
        );

        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            {
              name: 'conversation.input.left',
              id: 'capability-hub-suites',
              order: 20,
              locale: NS,
            },
            (props = {}) => h(ComposerSuiteControl, { sessionId: props.sessionId, t: translate }),
          ),
        );
      },
    };
  },
});
