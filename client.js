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
      'btn.connectMcp': '+ 连接 MCP',
      'btn.refresh': '刷新',
      'btn.back': '← 返回套件列表',
      'btn.editBundle': '编辑套件',
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
      'status.failed': '连接异常',
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
    };

    const en = {
      'nav': 'Capability Hub',
      'header.title': 'Capability Hub',
      'hero.title': 'Make Harness work your way',
      'hero.subtitle': 'Organize switchable bundles, local and global skills, and MCP tools in one quiet workspace.',
      'btn.newBundle': '+ New suite',
      'btn.connectMcp': '+ Connect MCP',
      'btn.refresh': 'Refresh',
      'btn.back': '← Back to suites',
      'btn.editBundle': 'Edit suite',
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
      'status.failed': 'Issue',
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

    function Switch({ checked, onChange, label, disabled }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': Boolean(checked),
        'aria-label': label || 'Toggle',
        disabled: Boolean(disabled),
        className: checked ? 'ch-switch on' : 'ch-switch',
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
      const [cwd, setCwd] = useState('');

      const [activeTab, setActiveTab] = useState('bundles'); // 'bundles' | 'skills' | 'mcps'
      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all');

      const [selectedBundleId, setSelectedBundleId] = useState(null);
      const [detailSubTab, setDetailSubTab] = useState('skills'); // 'skills' | 'mcps'
      const [detailMcpName, setDetailMcpName] = useState('');

      // Drawer state: null | { kind: 'skill', name } | { kind: 'mcp', name } | { kind: 'bundle-form', bundle? } | { kind: 'connect-mcp' }
      const [drawer, setDrawer] = useState(null);
      const [skillDoc, setSkillDoc] = useState({ loading: false, content: '', path: '', error: '' });
      const [drawerToolQuery, setDrawerToolQuery] = useState('');
      const [copiedKey, setCopiedKey] = useState('');

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
      const [cmName, setCmName] = useState('');
      const [cmTransport, setCmTransport] = useState('streamable-http');
      const [cmUrl, setCmUrl] = useState('');
      const [cmCommand, setCmCommand] = useState('npx');
      const [cmArgs, setCmArgs] = useState('');
      const [cmCwd, setCmCwd] = useState('');

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

      useEffect(() => {
        if (!drawer) return undefined;
        const onKey = (e) => {
          if (e.key === 'Escape') setDrawer(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
      }, [drawer]);

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

      const openSkillDrawer = useCallback((skillName) => {
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

      const openConnectMcp = useCallback(() => {
        setCmName('');
        setCmTransport('streamable-http');
        setCmUrl('');
        setCmCommand('npx');
        setCmArgs('');
        setCmCwd('');
        setDrawer({ kind: 'connect-mcp' });
      }, []);

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
        return h('span', { className: 'ch-pill' }, sk.reason === 'bundle' ? t('status.mutedByBundle') : t('mode.muted'));
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
                    onClick: async () => {
                      await runMutation({ action: 'delete_bundle', bundleId: selectedBundle.id });
                      setSelectedBundleId(null);
                    },
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
              h(
                'div',
                { className: 'ch-status-cols' },
                h(
                  'div',
                  { className: 'ch-status-col' },
                  h('span', { className: 'ch-status-label' }, 'MCP status'),
                  h(
                    'span',
                    { className: selectedBundle.hasIssue ? 'ch-pill warn' : selectedBundle.enabled ? 'ch-pill ok' : 'ch-pill' },
                    selectedBundle.hasIssue ? t('status.failed') : selectedBundle.enabled ? `${selectedBundle.mcps.length} active` : t('status.muted'),
                  ),
                ),
                h(
                  'div',
                  { className: 'ch-status-col' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: `ch-default-pill ${selectedBundle.defaultInject !== false ? 'on' : 'off'}`,
                      title: '切换新开会话是否默认注入此套件',
                      onClick: () => runMutation({
                        action: 'set_bundle_default_inject',
                        bundleId: selectedBundle.id,
                        defaultInject: selectedBundle.defaultInject === false,
                      }),
                    },
                    selectedBundle.defaultInject !== false ? t('defaultInject.on') : t('defaultInject.off'),
                  ),
                  h('span', { className: 'ch-status-label' }, t('status.active')),
                  h(Switch, {
                    checked: selectedBundle.enabled,
                    label: selectedBundle.name,
                    onChange: (next) => runMutation({ action: 'toggle_bundle', bundleId: selectedBundle.id, enabled: next }),
                  }),
                ),
              ),
            ),
            h(
              'div',
              { className: 'ch-toolbar', style: { marginBottom: 18 } },
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
                      'table',
                      { className: 'ch-table' },
                      h(
                        'thead',
                        null,
                        h(
                          'tr',
                          null,
                          h('th', { style: { width: '24%' } }, 'Skill'),
                          h('th', { className: 'ch-table-nowrap', style: { width: '13%' } }, '来源'),
                          h('th', null, '用途说明'),
                          h('th', { className: 'ch-table-nowrap', style: { width: '15%', textAlign: 'right' } }, '暴露模式'),
                        ),
                      ),
                      h(
                        'tbody',
                        null,
                        selectedBundle.skillDetails.map((sk) =>
                          h(
                            'tr',
                            { key: sk.name, className: 'clickable', onClick: () => sk.source !== 'missing' && openSkillDrawer(sk.name) },
                            h('td', { className: 'ch-mono', style: { fontWeight: 600 } }, sk.name),
                            h('td', { className: 'ch-table-nowrap', style: { color: 'var(--dsw-alias-label-tertiary)' } }, renderScopeLabel(sk.scopeGroup)),
                            h('td', null, h('div', { className: 'ch-table-desc', title: sk.description }, sk.description)),
                            h('td', { className: 'ch-table-nowrap', style: { textAlign: 'right' } }, renderSkillModePill(sk)),
                          ),
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
                        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' } },
                        h(
                          'div',
                          { style: { display: 'flex', alignItems: 'center', gap: 10 } },
                          selectedBundle.mcpDetails.length > 1
                            ? h(
                                'select',
                                {
                                  className: 'ch-select ch-mono',
                                  value: currentMcp?.name || '',
                                  onChange: (e) => setDetailMcpName(e.target.value),
                                },
                                selectedBundle.mcpDetails.map((m) =>
                                  h('option', { key: m.name, value: m.name }, `${m.name} (${m.activeTools}/${m.totalTools})`),
                                ),
                              )
                            : h('span', { className: 'ch-mono', style: { fontWeight: 600, fontSize: 13.5 } }, currentMcp?.name),
                          currentMcp
                            ? h(
                                'span',
                                { className: currentMcp.enabled ? 'ch-pill ok' : 'ch-pill' },
                                `${currentMcp.activeTools}/${currentMcp.totalTools} tools`,
                              )
                            : null,
                        ),
                        currentMcp
                          ? h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => openMcpDrawer(currentMcp.name) }, '连接与 JSON 配置 ›')
                          : null,
                      ),
                      currentMcp && currentMcp.tools?.length > 0
                        ? h(
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
                              currentMcp.tools.map((tl) =>
                                h(
                                  'tr',
                                  { key: tl.name },
                                  h('td', { className: 'ch-mono', style: { fontWeight: 500 } }, tl.shortName),
                                  h('td', null, h('div', { className: 'ch-table-desc', title: tl.description || '' }, tl.description || '—')),
                                  h(
                                    'td',
                                    { className: 'ch-table-nowrap', style: { textAlign: 'right' } },
                                    h(Switch, {
                                      checked: tl.enabled,
                                      disabled: !currentMcp.enabled,
                                      label: tl.shortName,
                                      onChange: (next) => runMutation({ action: 'toggle_mcp_tool', toolName: tl.name, enabled: next }),
                                    }),
                                  ),
                                ),
                              ),
                            ),
                          )
                        : h('div', { className: 'ch-empty' }, '该 MCP 服务当前未暴露可用工具。'),
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
              h('button', { type: 'button', className: 'ch-btn', onClick: openConnectMcp }, t('btn.connectMcp')),
              h('button', { type: 'button', className: 'ch-btn ch-btn-primary', onClick: () => openBundleForm(null) }, t('btn.newBundle')),
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
                          h(
                            'button',
                            {
                              type: 'button',
                              className: `ch-default-pill ${b.defaultInject !== false ? 'on' : 'off'}`,
                              title: '切换新开会话是否默认注入此套件',
                              onClick: (e) => {
                                e.stopPropagation();
                                runMutation({
                                  action: 'set_bundle_default_inject',
                                  bundleId: b.id,
                                  defaultInject: b.defaultInject === false,
                                });
                              },
                            },
                            b.defaultInject !== false ? t('defaultInject.on') : t('defaultInject.off'),
                          ),
                          h('span', { className: 'ch-slug' }, '详情 ›'),
                          h(Switch, {
                            checked: b.enabled,
                            label: b.name,
                            onChange: (next) => runMutation({ action: 'toggle_bundle', bundleId: b.id, enabled: next }),
                          }),
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
                    h('span', null, `点击任意行在右侧抽屉查看 SKILL.md 与触发策略`),
                    h('span', null, `${filteredSkills.length} / ${data?.skills?.length || 0}`),
                  ),
                  filteredSkills.length === 0
                    ? h('div', { className: 'ch-empty' }, t('empty.list'))
                    : h(
                        'div',
                        { className: 'ch-list' },
                        filteredSkills.map((sk) =>
                          h(
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
                                  ...(sk.bundles || []).map((b) =>
                                    h('span', { key: b.id, className: 'ch-pill' }, b.name),
                                  ),
                                ),
                                h('div', { className: 'ch-row-desc' }, sk.description),
                              ),
                            ),
                            h(
                              'div',
                              { className: 'ch-row-right' },
                              renderSkillModePill(sk),
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
                        ),
                      ),
                )
              : h(
                  'div',
                  null,
                  h(
                    'div',
                    { className: 'ch-section-bar' },
                    h('span', null, '点击任意 MCP 服务在右侧抽屉按需开关细分 Tool 与预览 JSON'),
                    h('span', null, `${filteredMcps.length} / ${data?.mcps?.length || 0}`),
                  ),
                  filteredMcps.length === 0
                    ? h('div', { className: 'ch-empty' }, t('empty.list'))
                    : h(
                        'div',
                        { className: 'ch-list' },
                        filteredMcps.map((m) =>
                          h(
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
                                  h(
                                    'span',
                                    {
                                      className:
                                        !m.enabled
                                          ? 'ch-pill'
                                          : m.connectionState === 'failed'
                                            ? 'ch-pill warn'
                                            : 'ch-pill ok',
                                    },
                                    !m.enabled
                                      ? (m.disableReason === 'bundle' ? t('status.mutedByBundle') : t('status.muted'))
                                      : m.connectionState === 'failed'
                                        ? t('status.failed')
                                        : `${t('status.connected')} · ${m.activeTools}/${m.totalTools}`,
                                  ),
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
                              h('span', { className: 'ch-slug' }, 'Tools ›'),
                              h(Switch, {
                                checked: m.enabled,
                                label: m.name,
                                onChange: (next) => runMutation({ action: 'toggle_mcp_server', serverName: m.name, enabled: next }),
                              }),
                            ),
                          ),
                        ),
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
              h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => setDrawer(null) }, '✕'),
            ),
            h(
              'div',
              { className: 'ch-drawer-body' },
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                renderSkillModePill(sk),
                h('span', { className: 'ch-pill' }, `${renderScopeLabel(sk.scopeGroup)} (${sk.source})`),
                ...(sk.bundles || []).map((b) => h('span', { key: b.id, className: 'ch-pill' }, `套件: ${b.name}`)),
              ),
              h('div', { style: { color: 'var(--dsw-alias-label-secondary)', fontSize: 12.5 } }, sk.description),
              h(
                'div',
                { className: 'ch-field' },
                h('span', { className: 'ch-label' }, '触发与上下文注入策略（不修改磁盘 SKILL.md）'),
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
                  h('span', { className: m.enabled ? 'ch-pill ok' : 'ch-pill' }, m.enabled ? t('status.connected') : t('status.muted')),
                  h('span', { className: 'ch-pill ch-mono' }, m.transport),
                  h('span', { className: 'ch-pill' }, `${m.activeTools}/${m.totalTools} tools`),
                ),
                h(
                  'div',
                  { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  m.canRestart
                    ? h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => runMutation({ action: 'restart_mcp', serverName: m.name }) }, t('btn.restart'))
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
                  h(Switch, {
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
                  h('span', { className: 'ch-label' }, `细分工具开关 (${tools.length})`),
                  h(
                    'div',
                    { style: { display: 'flex', gap: 6 } },
                    h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => runMutation({ action: 'batch_mcp_tools', serverName: m.name, enabled: true }) }, t('btn.enableAll')),
                    h('button', { type: 'button', className: 'ch-btn ch-btn-sm', onClick: () => runMutation({ action: 'batch_mcp_tools', serverName: m.name, enabled: false }) }, t('btn.disableAll')),
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
                    ? h('div', { style: { padding: 12, color: 'var(--dsw-alias-label-tertiary)' } }, '无匹配工具')
                    : tools.map((tl) =>
                        h(
                          'div',
                          {
                            key: tl.name,
                            className: 'ch-check-item',
                            style: { justifyContent: 'space-between' },
                            onClick: () =>
                              m.enabled && runMutation({ action: 'toggle_mcp_tool', toolName: tl.name, enabled: !tl.enabled }),
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
                            checked: tl.enabled,
                            disabled: !m.enabled,
                            label: tl.shortName,
                            onChange: (next) => runMutation({ action: 'toggle_mcp_tool', toolName: tl.name, enabled: next }),
                          }),
                        ),
                      ),
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
          const previewJson = JSON.stringify(
            {
              mcpServers: {
                [cmName.trim() || 'my_server']:
                  cmTransport === 'stdio'
                    ? {
                        transport: 'stdio',
                        command: cmCommand.trim() || 'npx',
                        ...(cmArgs.trim() ? { args: cmArgs.trim().split(/\s+/) } : {}),
                        ...(cmCwd.trim() ? { cwd: cmCwd.trim() } : {}),
                      }
                    : {
                        transport: 'streamable-http',
                        url: cmUrl.trim() || 'https://example.com/mcp',
                      },
              },
            },
            null,
            2,
          );
          return h(
            React.Fragment,
            null,
            h(
              'div',
              { className: 'ch-drawer-head' },
              h('div', { className: 'ch-drawer-title' }, '连接自定义 MCP 服务'),
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
                    'div',
                    { className: 'ch-field' },
                    h('label', { className: 'ch-label' }, 'MCP Endpoint URL'),
                    h('input', {
                      className: 'ch-input ch-field-input ch-mono',
                      placeholder: 'https://mcp.example.com/mcp',
                      value: cmUrl,
                      onChange: (e) => setCmUrl(e.target.value),
                    }),
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
                h('div', { className: 'ch-code-head' }, h('span', null, '底层配置实时预览')),
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
                    const res = await runMutation({
                      action: 'save_custom_mcp',
                      serverName: cmName.trim(),
                      transport: cmTransport,
                      url: cmUrl.trim(),
                      command: cmCommand.trim(),
                      argsText: cmArgs.trim(),
                      serverCwd: cmCwd.trim(),
                    });
                    if (res) setDrawer(null);
                  },
                },
                '保存并立即挂载',
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
                  const toolCount = (b.mcpDetails || []).reduce((acc, m) => acc + (m.totalTools || 0), 0);
                  const skillCount = (b.skillDetails || []).length;
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
                        `${toolCount} 工具 · ${skillCount} Skills`,
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
