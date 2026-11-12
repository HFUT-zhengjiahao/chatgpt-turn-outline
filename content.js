/* ChatGPT 提问目录 · Turn Outline 2.2.0
 * 默认收起为右侧刻度；悬停预览提问，点击定位，展开后搜索提问。
 * 仅在内存中保留当前分支的用户提问；回答只记录 ID 以跟踪阅读位置。
 * 收藏仅在扩展本地存储中记录会话与提问 ID，不持久化聊天正文。
 */
(() => {
  "use strict";

  if (window.__CTOA_BOOTED__) return;
  window.__CTOA_BOOTED__ = true;

  const HOST_ID = "ctoa-host-7c4a";
  const CONV_RE = /\/c\/([0-9a-z][0-9a-z-]{7,})/i;
  const FAVORITES_PREFIX = "ctoa:favorites:v2:";

  const LANG = ((document.documentElement.lang || navigator.language || "en") + "").toLowerCase().startsWith("zh") ? "zh" : "en";

  const ZH = {
    title: "提问目录", conversation: "当前对话", short: "目录",
    search: "搜索提问或附件名…", clear: "清空搜索", current: "回到当前提问",
    prev: "上一条提问（Alt+↑）", next: "下一条提问（Alt+↓）",
    refresh: "刷新提问", close: "收起目录", open: "展开提问目录",
    favorite: "收藏提问", unfavorite: "取消收藏", favorited: "已收藏", favoriteSaving: "正在保存收藏…",
    favoriteError: "收藏保存失败，请稍后重试", favoritesUnavailable: "收藏暂不可用，请重新加载扩展",
    rail: "提问快速导航", preview: "提问预览",
    filters: "筛选提问", all: "全部提问", saved: "收藏", reading: "当前", location: "当前位置",
    attachments: "附件", files: (n) => `${n} 个附件`,
    resultPrev: "上一个结果（Shift+Enter）", resultNext: "下一个结果（Enter）",
    results: (a, b) => b ? `${a} / ${b} 条匹配` : "没有匹配的提问",
    total: (n) => `${n} 条提问`, position: (a, b) => `第 ${a} / ${b} 条`,
    prompt: (n) => `第 ${n} 条提问`, loadedPrompt: (n) => `已加载 · 第 ${n} 条`,
    openWith: (n) => `提问目录 · ${n} 条（Alt+Shift+O）`,
    loading: "正在读取提问…", error: "暂时无法读取完整目录", retry: "重新读取",
    empty: "从第一条提问开始", emptyHint: "你发送的消息会出现在这里。",
    noSaved: "还没有收藏", noSavedHint: "点击提问旁的星标，就能在这里找到它。", viewAll: "查看全部提问",
    noMatch: "没有找到这条提问", noMatchHint: "试试更短的关键词，也可以搜索附件名。",
    domShort: "仅已加载", domNotice: "暂时显示页面中已加载的提问，稍后自动补全",
    locating: "正在定位提问…", loadOlder: "正在载入更早的提问…", loadNewer: "正在载入后面的提问…",
    notFound: "暂时找不到这条提问，请重新加载目录后再试",
    noQuestion: "无文字提问", imageOnly: "图片 / 媒体消息",
    today: "今天", yesterday: "昨天", atFirst: "已经是第一条提问", atLast: "已经是最后一条提问",
    resize: "拖动调整宽度，双击恢复默认", searchHint: "Enter 跳转 · Shift+Enter 上一条",
  };

  const EN = {
    title: "Your prompts", conversation: "Current conversation", short: "Outline",
    search: "Search prompts or files…", clear: "Clear search", current: "Back to current prompt",
    prev: "Previous prompt (Alt+↑)", next: "Next prompt (Alt+↓)",
    refresh: "Refresh prompts", close: "Collapse outline", open: "Open prompt outline",
    favorite: "Save prompt", unfavorite: "Unsave prompt", favorited: "Saved", favoriteSaving: "Saving…",
    favoriteError: "Could not save. Please try again.", favoritesUnavailable: "Saved prompts are unavailable. Reload the extension.",
    rail: "Quick prompt navigation", preview: "Prompt preview",
    filters: "Filter prompts", all: "All prompts", saved: "Saved", reading: "Current", location: "Reading position",
    attachments: "Attachments", files: (n) => `${n} attachment${n === 1 ? "" : "s"}`,
    resultPrev: "Previous result (Shift+Enter)", resultNext: "Next result (Enter)",
    results: (a, b) => b ? `${a} of ${b} matches` : "No matching prompts",
    total: (n) => `${n} prompt${n === 1 ? "" : "s"}`, position: (a, b) => `${a} of ${b}`,
    prompt: (n) => `Prompt ${n}`, loadedPrompt: (n) => `Loaded prompt ${n}`,
    openWith: (n) => `Prompt outline · ${n} (Alt+Shift+O)`,
    loading: "Reading your prompts…", error: "Full outline is unavailable", retry: "Try again",
    empty: "Start with a question", emptyHint: "Your messages will appear here as you send them.",
    noSaved: "No saved prompts yet", noSavedHint: "Star a prompt to find it here later.", viewAll: "View all prompts",
    noMatch: "No matching prompts", noMatchHint: "Try a shorter keyword or an attachment name.",
    domShort: "Loaded only", domNotice: "Showing loaded prompts. The full outline will retry automatically.",
    locating: "Locating prompt…", loadOlder: "Loading earlier prompts…", loadNewer: "Loading later prompts…",
    notFound: "Could not locate this prompt. Refresh the outline and try again.",
    noQuestion: "No text", imageOnly: "Image / media message",
    today: "Today", yesterday: "Yesterday", atFirst: "Already at the first prompt", atLast: "Already at the last prompt",
    resize: "Drag to resize or double-click to reset", searchHint: "Enter to jump · Shift+Enter for previous",
  };

  const T = LANG === "zh" ? ZH : EN;

  const IC = {
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>',

    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 4.5V11h-6.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/></svg>',
  };

  const CSS_TEXT = `
:host { all: initial; display: block; }
.ctoa-root {
  --bg: #16161f;
  --surface: #1e1e2a;
  --inset: #101018;
  --fg: #f5f2fb;
  --muted: #beb9cf;
  --faint: #a6a0b8;
  --line: #343343;
  --hover: #29283a;
  --active: #28243d;
  --accent: #c9b8ff;
  --accent-line: #6e5d9c;
  --accent-soft: #40345b;
  --favorite: #f4c47b;
  --favorite-soft: #f4c47b18;
  --bar: #8e88a9;
  --shadow: 0 18px 52px #0d092343, 0 3px 12px #0d09232e;
  --rail-width: 42px;
  --rail-edge: 10px;
  --preview-gap: 7px;
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: var(--fg);
  color-scheme: dark;
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  text-align: left;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}
.ctoa-root[data-visible="false"], .ctoa-root [hidden] { display: none !important; }
.ctoa-root *, .ctoa-root *::before, .ctoa-root *::after { box-sizing: border-box; }
.ctoa-root :where(button, input) { font: inherit; }
.ctoa-root button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ctoa-root button:disabled { opacity: .46; cursor: default; }
.ctoa-root svg { width: 16px; height: 16px; display: block; flex: none; }
.ctoa-root :is(button, [tabindex]):focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.ctoa-iconbtn, .ctoa-favorite {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--muted);
  transition: background .15s, color .15s, border-color .15s;
}
.ctoa-iconbtn:hover:not(:disabled) { color: var(--fg); background: var(--hover); border-color: var(--line); }
.ctoa-favorite { width: 32px; height: 32px; color: var(--faint); }
.ctoa-favorite[aria-disabled="true"] { opacity: .46; cursor: default; }
.ctoa-favorite:hover:not([aria-disabled="true"]) { color: var(--favorite); background: var(--favorite-soft); }
.ctoa-favorite.is-favorite { color: var(--favorite); }
.ctoa-favorite.is-favorite svg { fill: currentColor; }

/* Collapsed rail */
.ctoa-rail {
  position: fixed;
  z-index: 2;
  right: var(--rail-edge);
  top: 50%;
  transform: translateY(-50%);
  width: var(--rail-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg);
  box-shadow: 0 6px 24px #0d09232b;
  pointer-events: auto;
}
.ctoa-launcher {
  width: 100%;
  height: 32px;
  background: var(--accent-soft);
  color: var(--accent);
}
.ctoa-launcher:hover:not(:disabled) { background: #514171; color: var(--fg); border-color: var(--accent-line); }
.ctoa-marks {
  width: 100%;
  max-height: min(56vh, 560px);
  margin-top: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.ctoa-marks::-webkit-scrollbar, .ctoa-marks:empty { display: none; }
.ctoa-mark {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 17px;
  padding: 0 5px;
  border: 0;
  border-radius: 5px;
  background: transparent;
}
:where(.ctoa-marks[data-complete="true"]) > .ctoa-mark:first-child {
  position: sticky;
  top: 0;
  z-index: 1;
  border-radius: 0;
  background: var(--bg);
  box-shadow: 0 1px var(--line);
}
.ctoa-mark::after {
  content: "";
  width: 12px;
  height: 3px;
  border-radius: 3px;
  background: var(--bar);
  transition: width .14s, background .14s;
}
.ctoa-mark:nth-child(5n + 1)::after { width: 17px; }
.ctoa-mark:is(:hover, :focus-visible, .is-preview) { background: var(--hover); }
.ctoa-mark:is(:hover, :focus-visible, .is-preview)::after { width: 20px; background: var(--fg); }
.ctoa-mark.is-favorite::after { width: 18px; height: 4px; background: var(--favorite); }
.ctoa-mark.on { background: var(--accent-soft); }
.ctoa-mark.on::after { width: 22px; height: 4px; background: var(--accent); }
.ctoa-mark.is-favorite.on::after { background: var(--favorite); }
.ctoa-rail-count {
  margin-top: 4px;
  color: var(--faint);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}
.ctoa-rail-count:empty, .ctoa-root[data-open="true"] .ctoa-rail { display: none; }

/* Prompt preview */
.ctoa-preview {
  position: fixed;
  z-index: 4;
  right: calc(var(--rail-edge) + var(--rail-width) + var(--preview-gap));
  display: flex;
  flex-direction: column;
  width: 280px;
  max-width: calc(100vw - var(--rail-edge) - var(--rail-width) - var(--preview-gap) - 10px);
  max-height: min(184px, calc(100vh - 24px));
  max-height: min(184px, calc(100dvh - 24px));
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--bg);
  box-shadow: 0 8px 24px #0d092338, 0 2px 8px #0d092326;
  pointer-events: auto;
  animation: ctoaAppear .14s ease-out;
}
.ctoa-preview::after {
  content: "";
  position: absolute;
  inset-block: 0;
  left: 100%;
  width: calc(var(--preview-gap) + 1px);
}
.ctoa-preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 4px 6px 4px 11px;
  border-bottom: 1px solid var(--line);
}
.ctoa-preview-head .ctoa-favorite { width: 28px; height: 28px; }
.ctoa-preview-index { color: var(--accent); font-weight: 700; font-size: 13px; }
.ctoa-preview[data-favorite="true"] .ctoa-preview-index { color: var(--favorite); }
.ctoa-preview-time {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  color: var(--faint);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.ctoa-preview-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--bar) transparent;
  padding: 8px 11px;
}
.ctoa-preview-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13px; line-height: 1.55; }
.ctoa-preview-attachments { display: flex; flex-wrap: wrap; gap: 5px; }
.ctoa-preview-text:not([hidden]) + .ctoa-preview-attachments { margin-top: 6px; }
.ctoa-file {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  max-width: 100%;
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  color: var(--muted);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.ctoa-file svg { width: 13px; height: 13px; margin-top: 2px; }
@keyframes ctoaAppear { from { opacity: 0; transform: translateX(4px); } to { opacity: 1; transform: none; } }

/* Expanded outline */
.ctoa-panel {
  position: fixed;
  top: 72px;
  right: 16px;
  bottom: 24px;
  width: var(--panel-w, 360px);
  max-width: calc(100vw - 32px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--bg);
  box-shadow: var(--shadow);
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transform: var(--panel-offset, translateX(10px));
  transition: opacity .15s, transform .18s;
}
.ctoa-root[data-open="true"] .ctoa-panel { opacity: 1; pointer-events: auto; transform: none; }
.ctoa-head { display: flex; align-items: center; gap: 10px; flex: none; padding: 16px 14px 14px 16px; }
.ctoa-logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  border: 1px solid #604b8c;
  border-radius: 11px;
  background: linear-gradient(150deg, #483665, #2f2548);
  color: var(--accent);
}
.ctoa-logo svg { width: 19px; height: 19px; }
.ctoa-title { min-width: 0; flex: 1; }
.ctoa-title-text { margin: 0; font-size: 18px; line-height: 1.3; font-weight: 700; }
.ctoa-conv-title { margin-top: 3px; color: var(--muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ctoa-head-actions { display: flex; gap: 2px; }
.ctoa-toolbar { flex: none; padding: 0 12px 10px; border-bottom: 1px solid var(--line); }
.ctoa-search {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 41px;
  margin: 0 0 9px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: var(--inset);
  transition: border-color .15s, box-shadow .15s;
}
.ctoa-search:focus-within { border-color: var(--accent-line); box-shadow: 0 0 0 2px var(--accent-soft); }
.ctoa-search > svg { color: var(--faint); }
.ctoa-search input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  border: 0;
  outline: 0;
  padding: 0;
  background: transparent;
  color: var(--fg);
  font-size: 13px;
}
.ctoa-search input::placeholder { color: var(--muted); }
.ctoa-search input::-webkit-search-cancel-button { display: none; }
.ctoa-key {
  min-width: 20px;
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--faint);
  font-family: inherit;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}
.ctoa-search:focus-within .ctoa-key { display: none; }
.ctoa-clear { width: 26px; height: 27px; }
.ctoa-clear svg { width: 13px; height: 13px; }
.ctoa-filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--inset);
}
.ctoa-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 33px;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 650;
}
.ctoa-filter:hover:not(:disabled) { background: var(--surface); color: var(--fg); }
.ctoa-filter[aria-pressed="true"] { background: var(--accent-soft); color: var(--fg); border-color: var(--accent-line); }
.ctoa-filter-count {
  padding: 1px 6px;
  border-radius: 5px;
  background: var(--surface);
  color: var(--muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.ctoa-filter[aria-pressed="true"] .ctoa-filter-count { background: #554573; color: var(--fg); }
.ctoa-result-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  padding-top: 6px;
  color: var(--muted);
  font-size: 11px;
}
.ctoa-result-actions .ctoa-iconbtn { width: 28px; height: 27px; }
.ctoa-result-actions .ctoa-iconbtn svg { width: 14px; height: 14px; }
.ctoa-meta-label { flex: 1; padding-inline: 4px; }

.ctoa-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 0 10px 12px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--bar) transparent;
  scrollbar-gutter: stable;
  scroll-padding-block: 32px 8px;
}
.ctoa-list::-webkit-scrollbar, .ctoa-preview-scroll::-webkit-scrollbar { width: 5px; }
.ctoa-list::-webkit-scrollbar-thumb, .ctoa-preview-scroll::-webkit-scrollbar-thumb { background: var(--bar); border-radius: 4px; }
.ctoa-day {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 3px 6px;
  background: var(--bg);
  color: var(--faint);
  font-size: 11px;
  font-weight: 600;
}
.ctoa-day::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.ctoa-row { position: relative; margin-top: 5px; }
.ctoa-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  width: 100%;
  min-height: 54px;
  gap: 9px;
  padding: 10px 39px 10px 9px;
  border: 1px solid #2b2a3a;
  border-radius: 10px;
  color: var(--fg);
  background: var(--surface);
  text-align: left;
  transition: background .14s, border-color .14s;
  content-visibility: auto;
  contain-intrinsic-block-size: auto 47px;
}
.ctoa-item:hover { background: var(--hover); border-color: var(--line); }
.ctoa-item.on { background: var(--active); border-color: var(--accent-line); }
.ctoa-item.is-match-current { border-color: var(--accent); }
.ctoa-row > .ctoa-favorite { position: absolute; z-index: 1; top: 7px; right: 5px; }
.ctoa-idx {
  display: grid;
  place-items: center;
  min-width: 30px;
  height: 27px;
  padding-inline: 3px;
  flex: none;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--inset);
  color: var(--muted);
  font-size: 11px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.ctoa-item.on .ctoa-idx { background: var(--accent); border-color: var(--accent); color: #221936; }
.ctoa-item-body { min-width: 0; flex: 1; }
.ctoa-question {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 500;
}
.ctoa-list[data-searching="true"] .ctoa-question { -webkit-line-clamp: 3; }
.ctoa-item-meta { display: flex; align-items: center; flex-wrap: wrap; column-gap: 8px; color: var(--faint); font-size: 10px; }
.ctoa-item-meta > span { margin-top: 4px; }
.ctoa-time { font-variant-numeric: tabular-nums; }
.ctoa-item-files { display: inline-flex; align-items: center; gap: 3px; }
.ctoa-item-files svg { width: 12px; height: 12px; }
.ctoa-reading { display: none; color: var(--accent); font-weight: 650; }
.ctoa-item.on .ctoa-reading { display: inline; }
.ctoa-root mark { color: #211533; background: #d9bafa; border-radius: 2px; }

.ctoa-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: clamp(16px, 5vh, 48px) 14px 14px;
  text-align: center;
}
.ctoa-state-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: 4px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: var(--accent);
}
.ctoa-state-icon svg { width: 20px; height: 20px; }
.ctoa-state-title { font-size: 14px; font-weight: 650; }
.ctoa-state-help { max-width: 230px; color: var(--muted); font-size: 12px; line-height: 1.65; }
.ctoa-retry {
  margin-top: 5px;
  padding: 6px 12px;
  border: 1px solid var(--accent-line);
  border-radius: 7px;
  background: var(--accent-soft);
  color: var(--fg);
}
.ctoa-retry:hover { background: #514171; }
.ctoa-skel {
  height: 66px;
  margin: 8px 0;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: linear-gradient(90deg, var(--surface), var(--line), var(--surface));
  background-size: 200% 100%;
  animation: ctoaShimmer 1.5s linear infinite;
}
@keyframes ctoaShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes ctoaSpin { to { transform: rotate(360deg); } }
.ctoa-iconbtn.is-loading svg { animation: ctoaSpin 1s linear infinite; }

.ctoa-foot { flex: none; border-top: 1px solid var(--line); padding: 9px 12px; background: var(--surface); }
.ctoa-footnav { display: flex; align-items: center; gap: 5px; }
.ctoa-footnav > .ctoa-iconbtn { border-color: var(--line); background: var(--bg); }
.ctoa-current {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  padding: 4px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  text-align: left;
}
.ctoa-current:hover:not(:disabled) { color: var(--accent); background: var(--hover); }
.ctoa-current > svg { color: var(--accent); }
.ctoa-current-text { min-width: 0; }
.ctoa-current-caption { display: block; font-size: 10px; }
.ctoa-current-value { display: block; color: var(--fg); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.ctoa-status {
  margin-top: 7px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--bg);
  color: var(--muted);
  font-size: 11px;
}
.ctoa-rail-status {
  position: fixed;
  right: calc(var(--rail-edge) + var(--rail-width) + var(--preview-gap));
  bottom: 25px;
  max-width: min(360px, calc(100vw - 78px));
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg);
  color: var(--fg);
  box-shadow: var(--shadow);
  font-size: 12px;
}
.ctoa-resize { position: absolute; z-index: 4; left: 0; top: 20px; bottom: 20px; width: 8px; border-radius: 3px; cursor: col-resize; touch-action: none; }
.ctoa-resize::after { content: ""; position: absolute; left: 2px; top: calc(50% - 14px); width: 2px; height: 28px; border-radius: 2px; background: var(--line); }
.ctoa-resize:is(:hover, :focus-visible)::after, .resizing .ctoa-resize::after { background: var(--accent); }
.ctoa-size-tip { position: fixed; top: 85px; right: calc(var(--panel-w, 360px) + 28px); padding: 4px 8px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); border-radius: 6px; font-size: 11px; }

.ctoa-backdrop { display: none; }
.ctoa-root[data-layout="sheet"] .ctoa-panel {
  --panel-offset: translateY(12px);
  z-index: 3;
  inset: auto max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  width: auto;
  max-width: 560px;
  height: min(77vh, 640px);
  height: min(77dvh, 640px);
  margin-inline: auto;
}
.ctoa-root[data-layout="sheet"] :is(.ctoa-resize, .ctoa-size-tip) { display: none; }
.ctoa-root[data-open="true"][data-layout="sheet"] .ctoa-backdrop {
  display: block;
  position: fixed;
  inset: 0;
  z-index: 2;
  pointer-events: auto;
  background: #0d092359;
}
@media (max-width: 760px) {
  .ctoa-root { --rail-width: 38px; --rail-edge: 4px; }
}
@media (pointer: coarse) {
  .ctoa-root { --rail-width: 44px; }
  .ctoa-launcher { height: 36px; }
  .ctoa-mark { height: 25px; }
  .ctoa-search input { font-size: 16px; }
}
@media (max-height: 650px) {
  .ctoa-panel { top: 16px; bottom: 16px; }
  .ctoa-size-tip { top: 25px; }
}
@media (max-height: 490px) {
  .ctoa-root[data-layout="sheet"] .ctoa-panel { height: calc(100vh - 20px); height: calc(100dvh - 20px); }
  .ctoa-head { padding-block: 9px; }
  .ctoa-toolbar { padding-bottom: 6px; }
  .ctoa-foot { padding-block: 5px; }
}
@media (prefers-reduced-motion: reduce) {
  .ctoa-root *, .ctoa-root *::before, .ctoa-root *::after { animation: none !important; transition: none !important; }
}
`;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const state = {
    convId: null, turns: [], idToTurn: new Map(), source: "", domOnly: false,
    loading: false, error: null, open: false,
    width: 360, query: "", savedOnly: false, title: "", matchCursor: 0, matchVisited: false,
    active: -1, jumping: false, jumpToken: 0, lastFetch: 0, lastAutoRefresh: 0,
    statusText: null, lastToggleAt: 0, docked: false, dockTarget: null, resizing: false,
    previewIndex: -1, railHovered: false,
    favoriteIds: new Set(), favoritePending: new Map(), favoritesReady: false,
  };

  let host = null, shadow = null, root = null;
  const refs = {};
  let scrollerCache = null;
  let lastHref = location.href;
  let scrollRaf = 0, statusTimer = 0, loadSeq = 0, refreshTimer = 0;
  let obsTimer = 0, domSeedTimer = 0, retryTimer = 0, retryCount = 0;
  let tokenPromise = null, dockTimers = [];
  let searchTimer = 0, previewHideTimer = 0, listDirty = true, railDirty = true;
  let previousDomUnits = new WeakMap(), previousDomUntil = 0;
  const domSignatures = new Map();
  const requestControllers = new Set();
  let tokenCache = { value: "", until: 0 };
  let activeMainCache = { el: null, until: 0 };
  let favoriteLoadToken = 0, favoriteRevision = 0;

  // ---------------------------------------------------------------- markup

  function markup() {
    return `
<nav class="ctoa-rail" aria-label="${T.rail}">
  <button class="ctoa-iconbtn ctoa-launcher" type="button" data-act="open" aria-controls="ctoa-panel" aria-expanded="false" aria-label="${T.open}" title="${T.open} (Alt+Shift+O)">${IC.list}</button>
  <div class="ctoa-marks" data-role="marks"></div>
  <span class="ctoa-rail-count" data-role="railCount" aria-hidden="true"></span>
</nav>
<div class="ctoa-rail-status" data-role="railStatus" role="status" aria-live="polite" hidden></div>
<div id="ctoa-preview" class="ctoa-preview" role="dialog" aria-modal="false" aria-label="${T.preview}" hidden>
  <div class="ctoa-preview-head">
    <strong class="ctoa-preview-index" data-role="previewIndex"></strong>
    <span class="ctoa-preview-time" data-role="previewTime"></span>
    <button class="ctoa-favorite" type="button" data-role="previewFavorite" data-act="favorite" aria-label="${T.favorite}" title="${T.favorite}" aria-pressed="false" disabled>${IC.star}</button>
  </div>
  <div class="ctoa-preview-scroll" data-role="previewBody" tabindex="0" role="region" aria-label="${T.preview}">
    <p class="ctoa-preview-text" data-role="previewText"></p>
    <div class="ctoa-preview-attachments" data-role="previewAttachments" role="group" aria-label="${T.attachments}" hidden></div>
  </div>
</div>
<div class="ctoa-backdrop" data-act="close" aria-hidden="true"></div>
<aside id="ctoa-panel" class="ctoa-panel" aria-labelledby="ctoa-title" tabindex="-1">
  <div class="ctoa-head">
    <span class="ctoa-logo" aria-hidden="true">${IC.list}</span>
    <div class="ctoa-title">
      <h2 id="ctoa-title" class="ctoa-title-text">${T.title}</h2>
      <div class="ctoa-conv-title" data-role="title">${T.conversation}</div>
    </div>
    <div class="ctoa-head-actions">
      <button class="ctoa-iconbtn" type="button" data-act="refresh" title="${T.refresh}" aria-label="${T.refresh}">${IC.refresh}</button>
      <button class="ctoa-iconbtn" type="button" data-act="close" title="${T.close}" aria-label="${T.close}">${IC.close}</button>
    </div>
  </div>
  <div class="ctoa-toolbar">
    <div class="ctoa-search" role="search">
      ${IC.search}<input data-role="search" type="search" spellcheck="false" autocomplete="off" aria-label="${T.search}" placeholder="${T.search}" aria-controls="ctoa-list">
      <kbd class="ctoa-key" data-role="searchKey" aria-hidden="true">/</kbd>
      <button class="ctoa-iconbtn ctoa-clear" type="button" data-act="clear" title="${T.clear}" aria-label="${T.clear}" hidden>${IC.close}</button>
    </div>
    <div class="ctoa-filters" role="group" aria-label="${T.filters}">
      <button class="ctoa-filter" type="button" data-act="all" data-role="allFilter" aria-pressed="true" aria-controls="ctoa-list">
        ${T.all}<span class="ctoa-filter-count" data-role="allCount"></span>
      </button>
      <button class="ctoa-filter" type="button" data-act="saved" data-role="savedFilter" aria-pressed="false" aria-controls="ctoa-list" disabled>
        ${T.saved}<span class="ctoa-filter-count" data-role="savedCount"></span>
      </button>
    </div>
    <div class="ctoa-result-actions" data-role="results" hidden>
      <span class="ctoa-meta-label" data-role="resultCount" role="status" aria-live="polite"></span>
      <button class="ctoa-iconbtn" type="button" data-act="match-prev" title="${T.resultPrev}" aria-label="${T.resultPrev}">${IC.up}</button>
      <button class="ctoa-iconbtn" type="button" data-act="match-next" title="${T.resultNext}" aria-label="${T.resultNext}">${IC.down}</button>
    </div>
  </div>
  <div id="ctoa-list" class="ctoa-list" data-role="list" role="list" aria-label="${T.title}"></div>
  <div class="ctoa-foot">
    <div class="ctoa-footnav">
      <button class="ctoa-current" type="button" data-act="current" title="${T.current}">
        ${IC.target}<span class="ctoa-current-text"><span class="ctoa-current-caption">${T.location}</span><span class="ctoa-current-value" data-role="currentLabel"></span></span>
      </button>
      <button class="ctoa-iconbtn" type="button" data-act="prev" title="${T.prev}" aria-label="${T.prev}">${IC.up}</button>
      <button class="ctoa-iconbtn" type="button" data-act="next" title="${T.next}" aria-label="${T.next}">${IC.down}</button>
    </div>
    <div class="ctoa-status" data-role="status" role="status" aria-live="polite" hidden></div>
  </div>
  <span class="ctoa-resize" data-role="resize" role="separator" aria-orientation="vertical" aria-label="${T.resize}" aria-valuemin="300" aria-valuemax="520" aria-valuenow="360" tabindex="0" title="${T.resize}"></span>
</aside><div class="ctoa-size-tip" data-role="sizeTip" hidden></div>`;
  }

  function mount() {
    if (host) return;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;";
    shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = CSS_TEXT;
    shadow.append(style);
    root = document.createElement("div");
    root.className = "ctoa-root";
    root.dataset.open = "false";
    root.dataset.visible = "false";
    root.style.setProperty("--panel-w", state.width + "px");
    root.innerHTML = markup();
    shadow.append(root);
    collectRefs();
    bindEvents();
    (document.body || document.documentElement).append(host);
    refs.panel.inert = true;
  }

  function collectRefs() {
    for (const name of [
      "marks", "railCount", "railStatus", "previewIndex", "previewTime", "previewText", "previewBody", "previewAttachments", "previewFavorite",
      "title", "search", "searchKey", "allFilter", "allCount", "savedFilter", "savedCount", "list", "results", "resultCount",
      "currentLabel", "status", "resize", "sizeTip",
    ]) {
      refs[name] = root.querySelector(`[data-role="${name}"]`);
    }
    for (const [name, selector] of Object.entries({ rail: ".ctoa-rail", launcher: ".ctoa-launcher", preview: ".ctoa-preview", panel: ".ctoa-panel", searchWrap: ".ctoa-search", clear: '[data-act="clear"]', refreshBtn: '[data-act="refresh"]' })) {
      refs[name] = root.querySelector(selector);
    }
  }

  // ---------------------------------------------------------------- favorites

  function favoriteIdsFrom(value) {
    return Array.isArray(value) ? value.filter((id) => typeof id === "string" && id.length > 0 && id.length <= 256) : [];
  }

  function isFavorite(qid) {
    return state.favoritePending.has(qid) ? state.favoritePending.get(qid) : state.favoriteIds.has(qid);
  }

  function promptLabel(index) {
    return state.domOnly ? T.loadedPrompt(index + 1) : T.prompt(index + 1);
  }

  function favoriteMarkLabel(turn) {
    return (isFavorite(turn.qid) ? T.favorited + " · " : "") + promptLabel(turn.i) + " · " + cleanPreview(questionText(turn), 160);
  }

  function updateFavoriteButton(button) {
    const qid = button.dataset.qid;
    const saved = isFavorite(qid), pending = state.favoritePending.has(qid);
    const label = pending ? T.favoriteSaving : saved ? T.unfavorite : T.favorite;
    button.classList.toggle("is-favorite", saved);
    button.setAttribute("aria-pressed", String(saved));
    const index = state.idToTurn.get(qid);
    button.setAttribute("aria-label", label + (index != null ? " · " + promptLabel(index) : ""));
    button.title = label;
    button.disabled = !qid || !state.favoritesReady;
    button.setAttribute("aria-disabled", String(button.disabled || pending));
  }

  function applyFavoriteUI() {
    for (const mark of refs.marks.children) {
      const turn = state.turns[Number(mark.dataset.idx)];
      if (!turn) continue;
      mark.classList.toggle("is-favorite", isFavorite(turn.qid));
      mark.setAttribute("aria-label", favoriteMarkLabel(turn));
    }
    renderFilters();
    if (state.savedOnly && state.open) renderList();
    else for (const button of refs.list.querySelectorAll(".ctoa-favorite")) updateFavoriteButton(button);
    updateFavoriteButton(refs.previewFavorite);
    refs.preview.dataset.favorite = String(isFavorite(state.turns[state.previewIndex]?.qid));
  }

  async function loadFavorites(id) {
    const token = ++favoriteLoadToken, revision = favoriteRevision;
    try {
      const ids = await new Promise((resolve, reject) => {
        if (typeof chrome === "undefined" || !chrome.runtime?.id || !chrome.storage?.local) return reject(new Error("storage unavailable"));
        const key = FAVORITES_PREFIX + id;
        chrome.storage.local.get(key, (data) => {
          const error = chrome.runtime.lastError;
          if (error) reject(new Error(error.message));
          else resolve(favoriteIdsFrom(data?.[key]));
        });
      });
      if (state.convId !== id || token !== favoriteLoadToken) return;
      // A change event can be newer than the original asynchronous read.
      if (revision === favoriteRevision) state.favoriteIds = new Set(ids);
      state.favoritesReady = true; applyFavoriteUI();
    } catch {
      if (state.convId !== id || token !== favoriteLoadToken) return;
      if (!state.favoritesReady) setStatusOverride(T.favoritesUnavailable, 5000);
    }
  }

  function watchFavorites() {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime?.id || !chrome.storage?.onChanged) return;
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local" || !state.convId) return;
        const change = changes[FAVORITES_PREFIX + state.convId];
        if (!change) return;
        ++favoriteRevision;
        state.favoriteIds = new Set(favoriteIdsFrom(change.newValue));
        state.favoritesReady = true; applyFavoriteUI();
      });
    } catch { /* Reloading an unpacked extension can invalidate this context. */ }
  }

  async function toggleFavorite(qid) {
    if (!state.convId || !qid || !state.favoritesReady || state.favoritePending.has(qid) || !state.turns.some((turn) => turn.qid === qid)) return;
    const id = state.convId, token = favoriteLoadToken, revision = favoriteRevision;
    const enabled = !isFavorite(qid);
    state.favoritePending.set(qid, enabled); applyFavoriteUI();
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "CTOA_FAVORITE_SET", convId: id, qid, enabled }, (result) => {
          const error = chrome.runtime.lastError;
          if (error || !result?.ok) reject(new Error(error?.message || "favorite write failed"));
          else resolve();
        });
      });
      if (state.convId !== id || token !== favoriteLoadToken) return;
      if (revision === favoriteRevision) {
        if (enabled) state.favoriteIds.add(qid); else state.favoriteIds.delete(qid);
      }
      state.favoritePending.delete(qid); applyFavoriteUI();
    } catch {
      if (state.convId !== id || token !== favoriteLoadToken) return;
      state.favoritePending.delete(qid); applyFavoriteUI();
      setStatusOverride(T.favoriteError, 5000);
    }
  }

  // ---------------------------------------------------------------- events

  function bindEvents() {
    root.addEventListener("click", onRootClick);
    refs.search.addEventListener("input", () => {
      state.query = refs.search.value;
      resetMatch(); updateSearchUI();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(renderList, 70);
    });
    refs.search.addEventListener("keydown", onSearchKeyDown);
    refs.list.addEventListener("keydown", onListKeyDown);
    refs.marks.addEventListener("keydown", onRailKeyDown);
    refs.marks.addEventListener("pointerover", (e) => {
      if (e.pointerType === "touch") return;
      const mark = e.target.closest(".ctoa-mark");
      if (mark && !mark.contains(e.relatedTarget)) showPreview(Number(mark.dataset.idx));
    });
    refs.marks.addEventListener("focusin", (e) => {
      const mark = e.target.closest(".ctoa-mark");
      if (mark) showPreview(Number(mark.dataset.idx));
    });
    refs.marks.addEventListener("focusout", schedulePreviewHide);
    refs.marks.addEventListener("pointerleave", schedulePreviewHide);
    refs.marks.addEventListener("scroll", () => {
      const focused = shadow.activeElement?.closest(".ctoa-mark");
      if (focused) showPreview(Number(focused.dataset.idx)); else hidePreview();
    }, { passive: true });
    refs.rail.addEventListener("pointerenter", () => { state.railHovered = true; });
    refs.rail.addEventListener("pointerleave", () => { state.railHovered = false; schedulePreviewHide(); });
    refs.preview.addEventListener("pointerenter", () => clearTimeout(previewHideTimer));
    refs.preview.addEventListener("pointerleave", schedulePreviewHide);
    refs.preview.addEventListener("focusin", () => clearTimeout(previewHideTimer));
    refs.preview.addEventListener("focusout", schedulePreviewHide);
    refs.searchWrap.addEventListener("click", (e) => {
      if (!e.target.closest('[data-act="clear"]')) refs.search.focus({ preventScroll: true });
    });
    shadow.addEventListener("keydown", onShadowKeyDown, true);
    window.addEventListener("keydown", onWindowKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onWindowResize, { passive: true });
    for (const event of ["wheel", "pointerdown", "touchstart"]) {
      window.addEventListener(event, (e) => {
        if (state.jumping && !e.composedPath().includes(host)) cancelJump();
      }, { passive: true, capture: true });
    }
    refs.resize.addEventListener("pointerdown", onResizeStart);
    refs.resize.addEventListener("keydown", onResizeKeyDown);
    refs.resize.addEventListener("dblclick", onResizeReset);
    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === "CTOA_TOGGLE") togglePanel(); });
      }
    } catch { /* Supports manual injection for local UI checks. */ }
  }

  function onRootClick(e) {
    const act = e.target.closest("[data-act]");
    if (act?.dataset.act === "favorite") { toggleFavorite(act.dataset.qid); return; }
    if (act) return handleAction(act.dataset.act);
    const mark = e.target.closest(".ctoa-mark");
    if (mark) { hidePreview(); jumpTo(Number(mark.dataset.idx)); return; }
    const item = e.target.closest(".ctoa-item");
    if (item) {
      const index = Number(item.dataset.idx);
      if (state.query.trim()) {
        state.matchCursor = Math.max(0, filterTurns().findIndex((turn) => turn.i === index));
        state.matchVisited = true; updateResultUI();
      }
      jumpTo(index, true);
    }
  }

  function handleAction(act) {
    switch (act) {
      case "open": applyOpen(true); break;
      case "close": applyOpen(false); break;
      case "all": setSavedFilter(false); break;
      case "saved": setSavedFilter(true); break;
      case "prev": jumpRelative(-1); break;
      case "next": jumpRelative(1); break;
      case "refresh": case "retry": resetRetry(); if (!state.loading) loadConversation(); break;
      case "clear": clearSearch(); break;
      case "current":
        state.savedOnly = false;
        updateActiveFromScroll(); renderFilters(); clearSearch(false); scrollItemIntoView(state.active); break;
      case "match-prev": jumpMatch(-1); break;
      case "match-next": jumpMatch(1); break;
    }
  }

  function resetMatch() { state.matchCursor = 0; state.matchVisited = false; }

  function setSavedFilter(savedOnly) {
    if (state.savedOnly === savedOnly || (savedOnly && !state.favoritesReady)) return;
    state.savedOnly = savedOnly;
    resetMatch();
    renderFilters();
    refs.list.scrollTop = 0;
    renderList();
    (savedOnly ? refs.savedFilter : refs.allFilter).focus({ preventScroll: true });
  }

  function jumpMatch(delta) {
    clearTimeout(searchTimer);
    if (listDirty) renderList();
    const turns = filterTurns();
    if (!turns.length) return;
    if (!state.matchVisited) state.matchCursor = delta < 0 ? turns.length - 1 : 0;
    else state.matchCursor = (state.matchCursor + delta + turns.length) % turns.length;
    state.matchVisited = true;
    updateResultUI(turns);
    scrollItemIntoView(turns[state.matchCursor].i);
    jumpTo(turns[state.matchCursor].i);
  }

  function updateResultUI(turns = filterTurns()) {
    state.matchCursor = clamp(state.matchCursor, 0, Math.max(0, turns.length - 1));
    const searching = !!state.query.trim();
    refs.results.hidden = !searching;
    refs.resultCount.textContent = searching ? T.results(turns.length ? state.matchCursor + 1 : 0, turns.length) : "";
    refs.results.title = T.searchHint;
    for (const button of refs.results.querySelectorAll("button")) button.disabled = !turns.length;
    const selected = turns[state.matchCursor]?.i;
    for (const item of refs.list.querySelectorAll(".ctoa-item")) item.classList.toggle("is-match-current", searching && Number(item.dataset.idx) === selected);
  }

  function togglePanel() {
    if (!state.convId || Date.now() - state.lastToggleAt < 300) return;
    state.lastToggleAt = Date.now();
    applyOpen(!state.open);
  }

  function applyOpen(open, focusSearch = !window.matchMedia("(pointer: coarse)").matches) {
    if (!state.convId) return;
    const wasInside = refs.panel.contains(shadow.activeElement);
    hidePreview();
    state.open = !!open;
    root.dataset.open = String(state.open);
    refs.panel.inert = !state.open;
    refs.rail.inert = state.open;
    refs.launcher.setAttribute("aria-expanded", String(state.open));
    updateDock();
    if (state.open) scheduleDockSync(); else clearDockTimers();
    renderFooter();
    if (!state.open) {
      if (wasInside) refs.launcher.focus({ preventScroll: true });
      revealActiveMark();
      return;
    }
    if (listDirty) renderList();
    (focusSearch ? refs.search : refs.panel).focus({ preventScroll: true });
    updateActiveFromScroll();
    scrollItemIntoView(state.active);
    if (!state.loading && (state.source !== "api" || Date.now() - state.lastFetch > 30000)) {
      resetRetry(); loadConversation({ silent: true });
    }
  }

  function updateSearchUI() {
    refs.clear.hidden = !state.query;
    refs.searchKey.hidden = !!state.query;
    listDirty = true;
  }

  function clearSearch(focus = true) {
    clearTimeout(searchTimer); state.query = ""; refs.search.value = "";
    resetMatch(); updateSearchUI(); renderList();
    if (focus) refs.search.focus({ preventScroll: true });
  }

  function onSearchKeyDown(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) {
      e.preventDefault(); clearTimeout(searchTimer); if (listDirty) renderList();
      if (e.key === "Enter") jumpMatch(e.shiftKey ? -1 : 1);
      else focusListItem(e.key === "ArrowUp" ? -1 : 0);
    }
  }

  function onListKeyDown(e) {
    const item = e.target.closest(".ctoa-item");
    if (!item || e.isComposing) return;
    const items = Array.from(refs.list.querySelectorAll(".ctoa-item"));
    const pos = items.indexOf(item);
    const key = e.key;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    e.preventDefault();
    const next = key === "Home" ? 0 : key === "End" ? items.length - 1 : clamp(pos + (key === "ArrowDown" ? 1 : -1), 0, items.length - 1);
    items[next]?.focus();
  }

  function onRailKeyDown(e) {
    const mark = e.target.closest(".ctoa-mark");
    if (!mark || !["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const i = Number(mark.dataset.idx);
    const index = e.key === "Home" ? 0 : e.key === "End" ? state.turns.length - 1 : clamp(i + (e.key === "ArrowDown" ? 1 : -1), 0, state.turns.length - 1);
    refs.marks.children[index]?.focus({ preventScroll: true });
    revealMark(index); showPreview(index);
  }

  function onShadowKeyDown(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Escape") {
      if (!state.open) {
        e.preventDefault(); e.stopPropagation();
        if (refs.preview.contains(shadow.activeElement)) refs.marks.children[state.previewIndex]?.focus({ preventScroll: true });
        hidePreview(); return;
      }
      e.preventDefault(); e.stopPropagation(); hidePreview();
      if (state.jumping) cancelJump();
      else if (state.query) clearSearch();
      else if (state.open) applyOpen(false);
    }
  }

  function onWindowKeyDown(e) {
    if (!state.convId || e.isComposing || e.keyCode === 229) return;
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyO") {
      e.preventDefault(); e.stopPropagation(); togglePanel(); return;
    }
    if (e.key === "Escape" && state.jumping) { e.preventDefault(); e.stopPropagation(); cancelJump(); return; }
    if (e.key === "Escape" && !state.open && !e.composedPath().includes(host)) hidePreview();
    if (isEditableTarget(e.composedPath()[0])) return;
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault(); e.stopPropagation(); jumpRelative(e.key === "ArrowUp" ? -1 : 1); return;
    }
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); e.stopPropagation(); applyOpen(true, true);
    } else if (e.key === "Escape" && state.open && !e.composedPath().includes(host)) {
      e.preventDefault(); applyOpen(false);
    }
  }

  function isEditableTarget(target) {
    return !!(target?.nodeType === 1 && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]')));
  }

  function focusListItem(pos) {
    const items = refs.list.querySelectorAll(".ctoa-item");
    items[pos < 0 ? items.length - 1 : pos]?.focus();
  }

  function onScroll(e) {
    if (!state.convId || state.jumping || e?.composedPath().includes(host) || scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateActiveFromScroll(); });
  }

  function showPreview(index) {
    clearTimeout(previewHideTimer);
    const turn = state.turns[index];
    const mark = refs.marks.children[index];
    if (state.open || !turn || !mark) return;
    if (state.previewIndex !== index) {
      hidePreview();
      state.previewIndex = index;
      mark.classList.add("is-preview");
      mark.setAttribute("aria-expanded", "true");
      const { text, atts, time } = turn.q;
      refs.previewIndex.textContent = promptLabel(index);
      const date = time ? [dayLabel(time), formatTime(time)].filter(Boolean).join(" · ") : "";
      refs.previewTime.textContent = date;
      refs.previewTime.title = date;
      refs.previewText.textContent = text || (atts.length ? "" : questionText(turn));
      refs.previewText.hidden = !refs.previewText.textContent;
      const files = document.createDocumentFragment();
      for (const name of atts) {
        const file = document.createElement("span"); file.className = "ctoa-file";
        file.innerHTML = IC.file;
        const label = document.createElement("span"); label.textContent = name;
        file.append(label); files.append(file);
      }
      refs.previewAttachments.replaceChildren(files);
      refs.previewAttachments.hidden = !atts.length;
      refs.previewFavorite.dataset.qid = turn.qid || "";
      updateFavoriteButton(refs.previewFavorite);
      refs.preview.dataset.favorite = String(isFavorite(turn.qid));
      refs.preview.hidden = false;
      refs.previewBody.scrollTop = 0;
    }
    const rect = mark.getBoundingClientRect();
    const height = refs.preview.getBoundingClientRect().height;
    refs.preview.style.top = clamp(rect.top + rect.height / 2 - height / 2, 12, Math.max(12, window.innerHeight - height - 12)) + "px";
  }

  function schedulePreviewHide() {
    clearTimeout(previewHideTimer);
    previewHideTimer = setTimeout(() => {
      const focus = shadow.activeElement;
      const mark = refs.marks.children[state.previewIndex];
      const keyboardFocus = (focus === mark || refs.preview.contains(focus)) && focus?.matches(":focus-visible");
      if (!keyboardFocus && !refs.preview.matches(":hover")) hidePreview();
    }, 180);
  }

  function hidePreview() {
    clearTimeout(previewHideTimer);
    const old = refs.marks.children[state.previewIndex];
    old?.classList.remove("is-preview"); old?.setAttribute("aria-expanded", "false");
    state.previewIndex = -1; refs.preview.hidden = true;
  }

  function revealMark(index) {
    const mark = refs.marks.children[index];
    if (!mark) return;
    if (index === 0) {
      refs.marks.scrollTop = 0;
      return;
    }
    const rect = mark.getBoundingClientRect(), view = refs.marks.getBoundingClientRect();
    const pinnedHeight = refs.marks.dataset.complete === "true" ? refs.marks.firstElementChild.offsetHeight : 0;
    const top = view.top + pinnedHeight + 3;
    if (rect.top < top) refs.marks.scrollTop -= top - rect.top;
    else if (rect.bottom > view.bottom - 3) refs.marks.scrollTop += rect.bottom - view.bottom + 3;
  }

  function revealActiveMark() {
    if (!state.open && !state.railHovered && !refs.marks.contains(shadow.activeElement)) revealMark(state.active);
  }

  function onWindowResize() {
    hidePreview();
    const maxWidth = Math.min(520, Math.max(320, window.innerWidth - 80));
    state.width = Math.min(state.width, maxWidth);
    refs.resize.setAttribute("aria-valuemax", String(maxWidth));
    refs.resize.setAttribute("aria-valuenow", String(state.width));
    updateDock();
  }

  function applyWidth(width) {
    state.width = clamp(Math.round(width), 300, Math.min(520, Math.max(320, window.innerWidth - 80)));
    refs.resize.setAttribute("aria-valuenow", String(state.width));
    updateSizeTip(); updateDock();
  }

  function updateSizeTip() { refs.sizeTip.hidden = false; refs.sizeTip.textContent = Math.round(refs.panel.getBoundingClientRect().width) + " px"; }
  function hideSizeTip() { refs.sizeTip.hidden = true; }
  let sizeTipTimer = 0;
  function flashSizeTip() { updateSizeTip(); clearTimeout(sizeTipTimer); sizeTipTimer = setTimeout(hideSizeTip, 900); }

  function onResizeStart(e) {
    if (e.button !== 0) return;
    e.preventDefault(); state.resizing = true; root.classList.add("resizing");
    const startX = e.clientX, startW = refs.panel.getBoundingClientRect().width;
    const move = (event) => applyWidth(startW + startX - event.clientX);
    const done = () => {
      state.resizing = false; root.classList.remove("resizing");
      try { refs.resize.releasePointerCapture(e.pointerId); } catch { /* Already released. */ }
      for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) refs.resize.removeEventListener(event, done);
      refs.resize.removeEventListener("pointermove", move);
      updateDock(); flashSizeTip();
    };
    refs.resize.setPointerCapture(e.pointerId);
    refs.resize.addEventListener("pointermove", move);
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) refs.resize.addEventListener(event, done);
  }

  function onResizeKeyDown(e) {
    if (!["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    applyWidth(e.key === "Home" ? 360 : state.width + (e.key === "ArrowLeft" ? 1 : -1) * (e.shiftKey ? 40 : 20));
    flashSizeTip();
  }

  function onResizeReset(e) { e.preventDefault(); applyWidth(360); flashSizeTip(); }

  // ---------------------------------------------------------------- route

  function conversationId() {
    const m = CONV_RE.exec(location.pathname || "");
    return m ? m[1] : null;
  }

  function syncRoute() {
    if (!root) return;
    const id = conversationId();
    if (id === state.convId) return;
    previousDomUnits = new WeakMap(state.convId && id ? collectUnits().map(({ el, ids }) => [el, ids.join(" ")]) : []);
    previousDomUntil = Date.now() + 4000;
    ++loadSeq; ++state.jumpToken;
    ++favoriteLoadToken; favoriteRevision = 0;
    for (const controller of requestControllers) controller.abort();
    requestControllers.clear();
    for (const timer of [statusTimer, refreshTimer, obsTimer, searchTimer, sizeTipTimer]) clearTimeout(timer);
    stopDomSeed(); resetRetry(); clearDockTimers(); hidePreview(); hideSizeTip();
    obsTimer = 0; domSignatures.clear();
    activeMainCache = { el: null, until: 0 };
    state.convId = id;
    state.favoriteIds = new Set(); state.favoritePending.clear(); state.favoritesReady = false;
    state.turns = []; state.idToTurn.clear(); state.title = ""; state.source = "";
    state.domOnly = false; state.loading = false; state.error = null; state.active = -1;
    state.query = ""; state.savedOnly = false; state.statusText = null; state.jumping = false; state.open = false;
    state.lastFetch = 0; state.lastAutoRefresh = 0; state.railHovered = false;
    scrollerCache = null; resetMatch(); listDirty = true; railDirty = true;
    refs.search.value = ""; refs.list.textContent = ""; refs.list.scrollTop = 0;
    refs.marks.scrollTop = 0;
    refs.panel.inert = true; refs.rail.inert = false;
    refs.launcher.setAttribute("aria-expanded", "false");
    root.dataset.open = "false"; root.dataset.visible = id ? "true" : "false";
    restoreDock(); renderAll();
    if (id) { loadFavorites(id); loadConversation(); }
  }

  // ---------------------------------------------------------------- layout / dock

  // ChatGPT keeps previous conversation panes alive (often several <main>
  // elements, all but one collapsed to 0x0). document.querySelector("main")
  // therefore points at a stale pane after a conversation switch, so always
  // pick the pane that is actually visible.
  function isVisibleBox(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 40 || rect.height < 40) return false;
    try {
      if (typeof el.checkVisibility === "function" && !el.checkVisibility({ checkVisibilityCSS: true })) return false;
    } catch {
      /* older Chromium */
    }
    return !el.closest('[aria-hidden="true"]');
  }

  function activeMain(force) {
    const now = performance.now();
    if (!force && activeMainCache.el && now < activeMainCache.until && activeMainCache.el.isConnected) {
      return activeMainCache.el;
    }
    let best = null;
    let bestArea = 0;
    for (const el of document.querySelectorAll("main")) {
      if (!isVisibleBox(el)) continue;
      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        best = el;
        bestArea = area;
      }
    }
    activeMainCache = { el: best, until: now + 220 };
    return best;
  }

  function conversationScope() {
    return activeMain() || document.body || document.documentElement;
  }

  function setPanelCss(width) {
    if (!root) return;
    root.style.setProperty("--panel-w", Math.round(width) + "px");
  }

  function restoreDock(keep) {
    for (const el of document.querySelectorAll("main[data-ctoa-dock]")) {
      if (el === keep) continue;
      el.style.paddingRight = el.getAttribute("data-ctoa-pad") || "";
      const transition = el.getAttribute("data-ctoa-transition") || "";
      if (transition) el.style.transition = transition;
      else el.style.removeProperty("transition");
      el.removeAttribute("data-ctoa-dock");
      el.removeAttribute("data-ctoa-pad");
      el.removeAttribute("data-ctoa-transition");
    }
    if (!keep) {
      state.docked = false;
      state.dockTarget = null;
    }
  }

  function updateDock() {
    activeMainCache = { el: null, until: 0 };
    const wide = window.innerWidth > 760;
    if (!state.open || !state.convId || !wide) {
      if (!wide) root.dataset.layout = "sheet";
      restoreDock();
      setPanelCss(state.width);
      return;
    }
    const main = activeMain(true);
    // During a pane swap both panes can briefly collapse to 0x0; keep the
    // current reservation instead of dropping and re-adding it a moment later.
    if (!main && state.docked) return;
    const width = main?.getBoundingClientRect().width || 0;
    const gap = 26;
    // Keep the transcript readable instead of reserving the full panel width
    // in narrow windows: shrink the panel first, never overlap the content.
    const minContent = 380;
    const panelW = Math.min(state.width, Math.max(300, Math.floor(width - gap - minContent)));
    if (width - panelW - gap < minContent) {
      root.dataset.layout = "sheet";
      restoreDock();
      setPanelCss(state.width);
      return;
    }
    root.dataset.layout = "side";
    restoreDock(main);
    setPanelCss(panelW);
    if (!main.hasAttribute("data-ctoa-dock")) {
      main.setAttribute("data-ctoa-dock", "1");
      main.setAttribute("data-ctoa-pad", main.style.paddingRight || "");
      main.setAttribute("data-ctoa-transition", main.style.transition || "");
    }
    main.style.transition = state.resizing ? "none" : "padding-right .18s ease";
    main.style.paddingRight = panelW + gap + "px";
    state.docked = true;
    state.dockTarget = main;
  }

  function clearDockTimers() {
    for (const timer of dockTimers) clearTimeout(timer);
    dockTimers = [];
  }

  function scheduleDockSync() {
    clearDockTimers();
    // The new conversation pane can become visible a few seconds after the
    // URL changes; keep checking for a moment so the padding follows it.
    for (const delay of [120, 420, 1000, 2200, 4000]) {
      dockTimers.push(setTimeout(() => {
        if (state.open && state.convId) updateDock();
      }, delay));
    }
  }

  // ---------------------------------------------------------------- data

  async function requestJSON(url, options, opts = {}) {
    const controller = new AbortController();
    // Session requests are not tied to one conversation; keep them alive when
    // the user switches threads so the token is fetched only once.
    if (!opts.persistent) requestControllers.add(controller);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeout || 15000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) {
        const error = new Error("HTTP " + res.status);
        error.status = res.status;
        throw error;
      }
      return await res.json();
    } catch (error) {
      if (timedOut) {
        try { error.timedOut = true; } catch { /* read-only error object */ }
      }
      throw error;
    } finally {
      clearTimeout(timer);
      requestControllers.delete(controller);
    }
  }

  async function getToken(force) {
    const now = Date.now();
    if (!force && tokenCache.value && now < tokenCache.until) return tokenCache.value;
    if (!force && tokenPromise) return tokenPromise;
    const promise = (async () => {
      const data = await requestJSON("/api/auth/session", {
        credentials: "include", cache: "no-store", headers: { accept: "application/json" },
      }, { persistent: true, timeout: 12000 });
      if (!data?.accessToken) throw new Error("no access token");
      const expires = data.expires ? Date.parse(data.expires) : 0;
      const until = Number.isFinite(expires) && expires > 0
        ? Math.min(Date.now() + 10 * 60 * 1000, expires - 30000)
        : Date.now() + 10 * 60 * 1000;
      tokenCache = { value: data.accessToken, until: Math.max(Date.now() + 30000, until) };
      return tokenCache.value;
    })();
    tokenPromise = promise;
    const clear = () => { if (tokenPromise === promise) tokenPromise = null; };
    promise.then(clear, clear);
    return promise;
  }

  async function fetchConversation(id) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await getToken(attempt > 0);
      // The session request is allowed to outlive a route change, so make sure
      // the conversation is still the one being viewed before spending a fetch.
      if (state.convId !== id) {
        const stale = new Error("stale conversation");
        stale.stale = true;
        throw stale;
      }
      try {
        return await requestJSON(`/backend-api/conversation/${encodeURIComponent(id)}?include_has_versions=true`, {
          credentials: "include", cache: "no-store",
          headers: { accept: "application/json", authorization: "Bearer " + token },
        }, { timeout: 20000 });
      } catch (error) {
        if (attempt > 0) throw error;
        // An expired / replaced session can surface as 401 or 403.
        if (error.status === 401 || error.status === 403) {
          tokenCache = { value: "", until: 0 };
          continue;
        }
        // One quick retry for a dropped connection; timeouts are handled by
        // the DOM-seeded view plus the automatic retry scheduler.
        if (!error.timedOut && error.name === "TypeError") {
          await sleep(500);
          continue;
        }
        throw error;
      }
    }
  }

  function extractText(content) {
    if (!content) return "";
    const parts = Array.isArray(content.parts) ? content.parts : [];
    const out = typeof content.text === "string" ? [content.text] : [];
    for (const part of parts) {
      if (typeof part === "string") out.push(part);
      else if (part && typeof part.text === "string") out.push(part.text);
    }
    return out.join("\n\n").trim();
  }

  function linearChain(conv) {
    const mapping = conv.mapping || {};
    let nodeId = conv.current_node;
    if (!nodeId || !mapping[nodeId]) {
      let best = null;
      for (const [id, node] of Object.entries(mapping)) {
        if (!node || !node.message) continue;
        if (node.children && node.children.length) continue;
        const time = node.message.update_time || node.message.create_time || 0;
        if (!best || time > best.time) best = { id, time };
      }
      nodeId = best ? best.id : null;
    }
    const chain = [];
    const seen = new Set();
    while (nodeId && mapping[nodeId] && !seen.has(nodeId)) {
      seen.add(nodeId);
      chain.push(mapping[nodeId]);
      nodeId = mapping[nodeId].parent;
    }
    chain.reverse();
    return chain;
  }

  function makeTurn(qid, question, ids = []) {
    return { i: 0, qid, q: question, ids: [...new Set([qid, ...ids].filter(Boolean))] };
  }

  function apiToTurns(conv) {
    const turns = [];
    let current = null;
    for (const node of linearChain(conv)) {
      const msg = node?.message;
      if (!msg || msg.metadata?.is_visually_hidden_from_conversation || (msg.recipient && msg.recipient !== "all")) continue;
      const role = msg.author?.role;
      const id = msg.id || node.id;
      if (role === "user") {
        const text = extractText(msg.content);
        const atts = Array.isArray(msg.metadata?.attachments) ? msg.metadata.attachments.map((a) => a?.name).filter(Boolean) : [];
        const parts = Array.isArray(msg.content?.parts) ? msg.content.parts : [];
        const media = parts.some((part) => part && typeof part === "object") || /image|audio|video/.test(msg.content?.content_type || "");
        if (!text && !atts.length && !media) continue;
        current = makeTurn(id, { text, atts, media, time: msg.create_time || 0 });
        current.i = turns.length; turns.push(current);
      } else if (role === "assistant" && current && id && !current.ids.includes(id)) {
        // Keep only IDs, so scrolling through an answer still highlights its prompt.
        // Answer content is never copied into the outline's model.
        current.ids.push(id);
      }
    }
    return turns;
  }

  function buildIdIndex(turns) {
    const index = new Map();
    turns.forEach((turn, i) => {
      turn.i = i;
      for (const id of turn.ids) index.set(id, i);
    });
    return index;
  }

  function replaceTurns(turns) {
    const activeId = state.turns[state.active]?.qid;
    state.turns = turns;
    state.idToTurn = buildIdIndex(turns);
    state.active = activeId ? turns.findIndex((turn) => turn.qid === activeId) : -1;
    listDirty = true; railDirty = true;
  }

  function unitIds(el) {
    const ids = (el.getAttribute("data-chatgpt-search-message-ids") || "").split(/\s+/).filter(Boolean);
    if (ids.length) {
      const selection = el.querySelector("[data-chatgpt-selection-message-id]")?.getAttribute("data-chatgpt-selection-message-id");
      if (selection) ids.push(selection);
      return [...new Set(ids)];
    }
    const attributes = ["data-chatgpt-selection-message-id", "data-message-id", "data-dil-source-message-id", "data-dil-message-id"];
    for (const name of attributes) {
      const own = el.getAttribute(name);
      if (own) ids.push(own);
    }
    const child = el.querySelector(attributes.map((name) => `[${name}]`).join(","));
    if (child) for (const name of attributes) if (child.hasAttribute(name)) ids.push(child.getAttribute(name));
    return [...new Set(ids.filter(Boolean))];
  }

  function extractDomText(el) {
    const content = el.querySelector('[data-message-author-role="user"], [data-user-message-bubble]') || el;
    return (content.innerText || "").trim().replace(/^(你说|You said)[:：]\s*/i, "");
  }

  function staleDomUnit(el) {
    return Date.now() <= previousDomUntil && previousDomUnits.get(el) === unitIds(el).join(" ");
  }

  function domToTurns() {
    const turns = [];
    const seen = new Set();
    let current = null;
    for (const { el, ids } of collectUnits()) {
      if (staleDomUnit(el) || el.closest('[aria-hidden="true"]')) continue;
      const key = el.getAttribute("data-chatgpt-search-unit-key") || "";
      const role = /:(user|assistant)$/.exec(key)?.[1] || el.querySelector("[data-message-author-role]")?.getAttribute("data-message-author-role");
      if (role === "user") {
        const qid = ids[0] || null;
        if (qid && seen.has(qid)) continue;
        const text = extractDomText(el);
        const atts = [...el.querySelectorAll("[data-file-name], [data-filename], a[download]")].map((node) => node.getAttribute("data-file-name") || node.getAttribute("data-filename") || node.getAttribute("download") || node.textContent.trim()).filter(Boolean);
        const media = !!el.querySelector("img, video, audio, canvas");
        if (!text && !atts.length && !media) continue;
        current = makeTurn(qid, { text, atts: [...new Set(atts)], media, time: 0 }, ids);
        current.i = turns.length; turns.push(current); if (qid) seen.add(qid);
      } else if (role === "assistant" && current) {
        for (const id of ids) if (!current.ids.includes(id)) current.ids.push(id);
      }
    }
    return turns;
  }

  function stopDomSeed() {
    clearTimeout(domSeedTimer);
    domSeedTimer = 0;
  }

  function resetRetry() {
    clearTimeout(retryTimer);
    retryTimer = 0;
    retryCount = 0;
  }

  function scheduleRetry() {
    if (retryTimer || retryCount >= 6) return;
    const delay = [2500, 6000, 12000, 25000, 45000, 90000][retryCount] || 90000;
    retryTimer = setTimeout(() => {
      retryTimer = 0;
      if (state.loading || !state.convId || document.hidden) return;
      retryCount++;
      loadConversation({ force: true, silent: true });
    }, delay);
  }

  function sameTurns(a, b) {
    return a.length === b.length && a.every((turn, i) => {
      const other = b[i];
      return turn.qid === other.qid && turn.q.text === other.q.text && turn.q.media === other.q.media
        && !!turn.pending === !!other.pending
        && turn.q.time === other.q.time && turn.q.atts.join("\n") === other.q.atts.join("\n")
        && turn.ids.join(" ") === other.ids.join(" ");
    });
  }

  function seedDomTurns() {
    const turns = domToTurns();
    if (!turns.length || sameTurns(state.turns, turns)) return false;
    replaceTurns(turns); state.source = "dom"; state.domOnly = true; state.error = null;
    return true;
  }

  function startDomSeedWatch(seq) {
    stopDomSeed();
    let tries = 0;
    const tick = () => {
      domSeedTimer = 0;
      if (seq !== loadSeq || state.convId !== conversationId() || state.source === "api") return;
      if (seedDomTurns()) { renderAll(); updateActiveFromScroll(); }
      if (++tries < 60 && !document.hidden) domSeedTimer = setTimeout(tick, 700);
    };
    domSeedTimer = setTimeout(tick, 300);
  }

  async function loadConversation(opts = {}) {
    const id = state.convId;
    if (!id || state.loading) return;
    const seq = ++loadSeq;
    state.loading = true; state.error = null;
    if (state.source !== "api") { seedDomTurns(); startDomSeedWatch(seq); }
    renderAll(); updateActiveFromScroll();
    try {
      const conv = await fetchConversation(id);
      if (seq !== loadSeq || state.convId !== id) return;
      let turns = apiToTurns(conv);
      let pending = false;
      if (!turns.length && state.turns.length) {
        // A new prompt can be in the DOM before the API indexes it.
        pending = true;
        turns = state.turns;
      } else if (turns.length < state.turns.length && turns.every((turn, i) => turn.qid === state.turns[i].qid)) {
        const tail = state.turns.slice(turns.length);
        if (tail.length && tail.every((turn) => turn.pending)) {
          turns = turns.concat(tail); pending = true;
        }
      }
      if (!sameTurns(state.turns, turns)) replaceTurns(turns);
      state.title = typeof conv.title === "string" ? conv.title : "";
      previousDomUnits = new WeakMap();
      if (!pending || state.source === "api") { state.source = "api"; state.domOnly = false; }
      state.loading = false; state.error = null; state.lastFetch = Date.now();
      stopDomSeed();
      if (pending) scheduleRetry(); else resetRetry();
      renderAll(); updateActiveFromScroll();
      // Catch prompts sent while this request was in flight.
      checkForNewMessages();
    } catch (error) {
      if (seq !== loadSeq || state.convId !== id) return;
      state.loading = false; state.lastFetch = Date.now();
      if (state.source !== "api") {
        seedDomTurns();
        if (!state.turns.length) { state.source = "error"; state.error = T.error; }
      }
      renderAll(); updateActiveFromScroll();
      setStatusOverride(state.turns.length && state.source !== "api" ? T.domNotice : T.error, 5000);
      scheduleRetry();
    } finally {
      if (seq === loadSeq) refs.refreshBtn.classList.remove("is-loading");
    }
  }

  // ---------------------------------------------------------------- render

  function renderAll() {
    if (!root) return;
    refs.title.textContent = state.title || T.conversation;
    refs.title.title = state.title || T.conversation;
    refs.refreshBtn.classList.toggle("is-loading", state.loading);
    refs.refreshBtn.disabled = state.loading;
    updateSearchUI(); renderFilters(); renderRail();
    if (state.open) renderList();
    renderFooter();
  }

  function renderFilters() {
    const total = state.turns.length;
    refs.allCount.textContent = total || !state.loading ? String(total) : "…";
    refs.savedCount.textContent = state.favoritesReady ? String(state.turns.filter((turn) => isFavorite(turn.qid)).length) : "–";
    refs.allFilter.setAttribute("aria-pressed", String(!state.savedOnly));
    refs.savedFilter.setAttribute("aria-pressed", String(state.savedOnly));
    refs.savedFilter.disabled = !state.favoritesReady;
    refs.savedFilter.title = state.favoritesReady ? "" : T.favoritesUnavailable;
  }

  function renderRail() {
    const count = state.turns.length;
    refs.railCount.textContent = count ? String(count) : state.loading ? "···" : "";
    refs.launcher.title = T.openWith(count);
    refs.launcher.setAttribute("aria-label", T.openWith(count));
    refs.marks.setAttribute("aria-busy", String(state.loading));
    const complete = String(state.source === "api");
    if (refs.marks.dataset.complete !== complete) {
      refs.marks.dataset.complete = complete;
      railDirty = true;
    }
    if (!railDirty) return;
    const focusedId = shadow.activeElement?.closest(".ctoa-mark")?.dataset.id;
    const scroll = refs.marks.scrollTop;
    hidePreview();
    const fragment = document.createDocumentFragment();
    for (const turn of state.turns) {
      const mark = document.createElement("button");
      mark.type = "button"; mark.className = "ctoa-mark";
      mark.classList.toggle("is-favorite", isFavorite(turn.qid));
      mark.dataset.idx = String(turn.i); mark.dataset.id = turn.qid || "";
      mark.tabIndex = turn.i === Math.max(0, state.active) ? 0 : -1;
      mark.setAttribute("aria-label", favoriteMarkLabel(turn));
      mark.setAttribute("aria-controls", "ctoa-preview"); mark.setAttribute("aria-haspopup", "dialog"); mark.setAttribute("aria-expanded", "false");
      fragment.append(mark);
    }
    refs.marks.replaceChildren(fragment); refs.marks.scrollTop = scroll; railDirty = false;
    applyActiveClass(); revealActiveMark();
    if (focusedId) [...refs.marks.children].find((mark) => mark.dataset.id === focusedId)?.focus({ preventScroll: true });
  }

  function renderList() {
    if (!refs.list) return;
    clearTimeout(searchTimer); listDirty = false;
    const list = refs.list, scroll = list.scrollTop;
    const focusedIndex = shadow.activeElement?.closest(".ctoa-item")?.dataset.idx;
    const focusedFavorite = refs.list.contains(shadow.activeElement) ? shadow.activeElement?.closest(".ctoa-favorite")?.dataset.qid : null;
    const turns = filterTurns();
    const searching = !!state.query.trim();
    list.textContent = ""; list.setAttribute("aria-busy", String(state.loading));
    list.dataset.searching = String(searching);
    list.setAttribute("role", turns.length ? "list" : "region");
    if (state.loading && !state.turns.length) list.append(skeleton());
    else if (state.error && !state.turns.length) list.append(stateBlock(T.error, { label: T.retry, action: "retry", icon: IC.alert }));
    else if (!state.turns.length) list.append(stateBlock(T.empty, { help: T.emptyHint }));
    else if (!turns.length && searching) list.append(stateBlock(T.noMatch, { help: T.noMatchHint, label: T.clear, action: "clear", icon: IC.search }));
    else if (!turns.length) list.append(stateBlock(T.noSaved, { help: T.noSavedHint, label: T.viewAll, action: "all", icon: IC.star }));
    else {
      const fragment = document.createDocumentFragment();
      let lastDay = null;
      for (const turn of turns) {
        const day = dayLabel(turn.q.time);
        if (day && day !== lastDay) {
          const header = document.createElement("div"); header.className = "ctoa-day";
          header.setAttribute("role", "presentation"); header.textContent = day; fragment.append(header); lastDay = day;
        }
        fragment.append(renderItem(turn));
      }
      list.append(fragment);
    }
    list.scrollTop = scroll;
    applyActiveClass(); updateResultUI(turns);
    const fallback = state.savedOnly ? refs.savedFilter : refs.search;
    if (focusedIndex != null) {
      (list.querySelector(`.ctoa-item[data-idx="${focusedIndex}"]`) || fallback).focus({ preventScroll: true });
    } else if (focusedFavorite) {
      const favorite = [...list.querySelectorAll(".ctoa-favorite")].find((button) => button.dataset.qid === focusedFavorite);
      (favorite || fallback).focus({ preventScroll: true });
    }
  }

  function normalizeSearch(text) { return String(text || "").replace(/\s+/g, " ").trim().toLowerCase(); }

  function filterTurns() {
    const turns = state.savedOnly ? state.turns.filter((turn) => isFavorite(turn.qid)) : state.turns;
    const needle = normalizeSearch(state.query);
    return needle ? turns.filter((turn) => normalizeSearch(turn.q.text + " " + turn.q.atts.join(" ")).includes(needle)) : turns;
  }

  function questionText(turn) {
    const { text, atts, media } = turn.q;
    return [atts.join(" · "), text || (!atts.length ? (media ? T.imageOnly : T.noQuestion) : "")].filter(Boolean).join("\n\n");
  }

  function renderItem(turn) {
    const row = document.createElement("div"); row.className = "ctoa-row"; row.setAttribute("role", "listitem");
    const item = document.createElement("button");
    item.type = "button"; item.className = "ctoa-item"; item.dataset.idx = String(turn.i);
    const idx = document.createElement("span"); idx.className = "ctoa-idx";
    idx.textContent = String(turn.i + 1).padStart(2, "0"); idx.setAttribute("aria-hidden", "true");
    const body = document.createElement("span"); body.className = "ctoa-item-body";
    const question = document.createElement("span"); question.className = "ctoa-question";
    const text = questionText(turn);
    const snippet = state.query.trim() ? searchPreview(text, 210) : cleanPreview(turn.q.text || text, 210);
    appendHighlighted(question, snippet, state.query);
    const meta = document.createElement("span"); meta.className = "ctoa-item-meta";
    const reading = document.createElement("span"); reading.className = "ctoa-reading";
    reading.textContent = T.reading; reading.setAttribute("aria-hidden", "true"); meta.append(reading);
    const clock = turn.q.time && formatTime(turn.q.time);
    if (clock) {
      const time = document.createElement("span"); time.className = "ctoa-time";
      time.textContent = clock; meta.append(time);
    }
    if (turn.q.atts.length) {
      const files = document.createElement("span"); files.className = "ctoa-item-files";
      files.innerHTML = IC.file;
      files.append(T.files(turn.q.atts.length)); meta.append(files);
    }
    body.append(question, meta);
    item.append(idx, body); item.title = cleanPreview(text, 600);
    const favorite = document.createElement("button");
    favorite.type = "button"; favorite.className = "ctoa-favorite"; favorite.dataset.act = "favorite"; favorite.dataset.qid = turn.qid || "";
    favorite.innerHTML = IC.star; updateFavoriteButton(favorite);
    row.append(item, favorite);
    return row;
  }

  function applyActiveClass() {
    const selected = Math.max(0, state.active);
    for (const selector of [".ctoa-item", ".ctoa-mark"]) {
      for (const item of root.querySelectorAll(selector)) {
        const index = Number(item.dataset.idx), on = index === state.active;
        item.classList.toggle("on", on);
        if (on) item.setAttribute("aria-current", "true"); else item.removeAttribute("aria-current");
        if (selector === ".ctoa-mark") item.tabIndex = index === selected ? 0 : -1;
      }
    }
  }

  function setActive(index, scrollList) {
    if (index < 0 || index >= state.turns.length) return;
    const changed = state.active !== index;
    state.active = index;
    if (changed) { applyActiveClass(); revealActiveMark(); }
    renderFooter();
    if (changed && scrollList && !state.query.trim()) scrollItemIntoView(index);
  }

  function scrollItemIntoView(index) {
    if (!state.open) return;
    const item = refs.list.querySelector(`.ctoa-item[data-idx="${index}"]`);
    if (!item) return;
    const view = refs.list.getBoundingClientRect(), rect = item.getBoundingClientRect();
    if (rect.top < view.top + 32) refs.list.scrollTop -= view.top + 32 - rect.top;
    else if (rect.bottom > view.bottom - 6) refs.list.scrollTop += rect.bottom - view.bottom + 6;
  }

  function renderFooter() {
    const total = state.turns.length;
    refs.currentLabel.textContent = state.active >= 0 ? T.position(state.active + 1, total) : T.total(total);
    root.querySelector('[data-act="prev"]').disabled = !total || state.active === 0;
    root.querySelector('[data-act="next"]').disabled = !total || state.active === total - 1;
    root.querySelector('[data-act="current"]').disabled = !total;
    const message = state.statusText || state.error || (state.loading && !total ? T.loading : state.domOnly ? T.domShort : "");
    refs.status.textContent = message; refs.status.hidden = !message;
    refs.railStatus.textContent = state.statusText || "";
    refs.railStatus.hidden = state.open || !state.statusText;
    // The collapsed control also communicates loading/locating failures.
    refs.railCount.title = message || T.total(total);
    refs.railCount.setAttribute("aria-hidden", message ? "false" : "true");
  }

  function setStatusOverride(text, ms) {
    state.statusText = text || null; clearTimeout(statusTimer); renderFooter();
    if (text && ms) statusTimer = setTimeout(() => { state.statusText = null; renderFooter(); }, ms);
  }

  function appendHighlighted(node, text, query) {
    const target = normalizeSearch(query);
    if (!target) {
      node.textContent = text || "";
      return;
    }
    const haystack = (text || "").toLowerCase();
    let from = 0;
    let found = false;
    while (from < (text || "").length) {
      const at = haystack.indexOf(target, from);
      if (at < 0) break;
      if (at > from) node.append(document.createTextNode(text.slice(from, at)));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(at, at + target.length);
      node.append(mark);
      from = at + target.length;
      found = true;
    }
    if (!found) {
      node.textContent = text || "";
      return;
    }
    if (from < text.length) node.append(document.createTextNode(text.slice(from)));
  }

  function stateBlock(title, { help, label, action, icon = IC.list } = {}) {
    const box = document.createElement("div");
    box.className = "ctoa-state";
    const badge = document.createElement("span"); badge.className = "ctoa-state-icon";
    badge.innerHTML = icon;
    box.append(badge);
    const text = document.createElement("div"); text.className = "ctoa-state-title";
    text.textContent = title;
    box.append(text);
    if (help) {
      const hint = document.createElement("div"); hint.className = "ctoa-state-help"; hint.textContent = help; box.append(hint);
    }
    if (label) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ctoa-retry";
      button.dataset.act = action;
      button.textContent = label;
      box.append(button);
    }
    return box;
  }

  function skeleton() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 5; i++) {
      const bar = document.createElement("div");
      bar.className = "ctoa-skel";
      frag.append(bar);
    }
    return frag;
  }

  function searchPreview(input, max) {
    const text = cleanPreview(input, Infinity);
    const needle = normalizeSearch(state.query);
    const at = text.toLowerCase().indexOf(needle);
    if (at < 0) return cleanPreview(input, max);
    const start = Math.max(0, at - 32);
    const end = Math.min(text.length, Math.max(start + max, at + needle.length));
    const from = start > 0 && /[\uDC00-\uDFFF]/.test(text[start]) ? start - 1 : start;
    const to = end < text.length && /[\uDC00-\uDFFF]/.test(text[end]) ? end + 1 : end;
    return (from ? "…" : "") + text.slice(from, to) + (to < text.length ? "…" : "");
  }

  function cleanPreview(input, max) {
    let text = String(input || "");
    text = text.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, "$1");
    text = text.replace(/!\[[^\]]*\]\((?:[^()]*)\)/g, " ");
    text = text.replace(/\[([^\]]*)\]\((?:[^()]*)\)/g, "$1");
    text = text.replace(/<[^>]{1,200}>/g, " ");
    text = text.replace(/^[ \t]{0,3}#{1,6}[ \t]*/gm, "");
    text = text.replace(/^[ \t]*>[ \t]?/gm, "");
    text = text.replace(/[*`]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    if (text.length > max) text = Array.from(text).slice(0, max).join("").trimEnd() + "…";
    return text;
  }

  function dayLabel(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((startOf(now) - startOf(date)) / 86400000);
    if (diff === 0) return T.today;
    if (diff === 1) return T.yesterday;
    if (LANG === "zh") {
      const year = date.getFullYear() === now.getFullYear() ? "" : date.getFullYear() + "年";
      return `${year}${date.getMonth() + 1}月${date.getDate()}日 周${"日一二三四五六"[date.getDay()]}`;
    }
    try {
      return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        weekday: "short",
        ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
      }).format(date);
    } catch {
      return date.toDateString();
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return "";
    return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
  }

  // ---------------------------------------------------------------- dom / scroll

  function isDocScroller(sc) {
    return sc === document.scrollingElement || sc === document.documentElement || sc === document.body;
  }

  function isScrollable(el) {
    if (!el || el.nodeType !== 1) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 80) return false;
    const cs = getComputedStyle(el);
    if (!/(auto|scroll|overlay)/.test(cs.overflowY)) return false;
    return el.scrollHeight > el.clientHeight + 24;
  }

  function getScroller() {
    const scope = conversationScope();
    if (scrollerCache && scrollerCache.isConnected && scope.contains(scrollerCache) && isScrollable(scrollerCache)) {
      return scrollerCache;
    }
    scrollerCache = null;
    for (const known of scope.querySelectorAll(".thread-scroll-container")) {
      if (isScrollable(known)) return (scrollerCache = known);
    }
    const unit = scope.querySelector('[data-chatgpt-search-unit-key], article[data-testid^="conversation-turn"]');
    let parent = unit && unit.parentElement;
    while (parent && parent !== document.body) {
      if (isScrollable(parent)) return (scrollerCache = parent);
      parent = parent.parentElement;
    }
    const se = document.scrollingElement;
    if (se && se.scrollHeight > window.innerHeight + 40) return (scrollerCache = se);
    return null;
  }

  function scInfo(sc) {
    if (isDocScroller(sc)) {
      const height = Math.max(document.documentElement.scrollHeight, (document.body && document.body.scrollHeight) || 0);
      return { top: window.scrollY, height: window.innerHeight, sh: height, max: Math.max(0, height - window.innerHeight) };
    }
    return {
      top: sc.scrollTop,
      height: sc.clientHeight,
      sh: sc.scrollHeight,
      max: Math.max(0, sc.scrollHeight - sc.clientHeight),
    };
  }

  function scViewTop(sc) {
    if (isDocScroller(sc)) return 0;
    return sc.getBoundingClientRect().top;
  }

  function setScrollTop(sc, value) {
    const top = Math.max(0, Math.round(value));
    if (isDocScroller(sc)) window.scrollTo(0, top);
    else sc.scrollTop = top;
  }

  function collectUnits() {
    const scope = conversationScope();
    const loose = scope === document.body || scope === document.documentElement;
    const out = [];
    for (const el of scope.querySelectorAll("[data-chatgpt-search-unit-key]")) {
      if (loose && !isVisibleBox(el)) continue;
      out.push({ el, ids: unitIds(el) });
    }
    if (out.length) return out;
    for (const el of scope.querySelectorAll('article[data-testid^="conversation-turn"]')) {
      if (loose && !isVisibleBox(el)) continue;
      out.push({ el, ids: unitIds(el) });
    }
    return out;
  }

  function updateActiveFromScroll() {
    if (!state.turns.length) return;
    const sc = getScroller();
    const units = collectUnits();
    if (!units.length) return;
    const top = (sc ? scViewTop(sc) : 0) + 120;
    let best = null;
    for (const unit of units) {
      const rect = unit.el.getBoundingClientRect();
      if (rect.top <= top) best = unit;
      else break;
    }
    if (!best) best = units[0];

    let index = null;
    for (const id of best.ids) {
      const i = state.idToTurn.get(id);
      if (i != null) index = i;
    }
    if (index == null) {
      const start = units.indexOf(best);
      for (let j = start - 1; j >= 0 && index == null; j--) {
        for (const id of units[j].ids) {
          const i = state.idToTurn.get(id);
          if (i != null) {
            index = i;
            break;
          }
        }
      }
    }
    if (index == null) return;
    if (index !== state.active) setActive(index, true);
    else renderFooter();
  }

  function loadedTurnWindow() {
    let min = Infinity;
    let max = -Infinity;
    for (const unit of collectUnits()) {
      for (const id of unit.ids) {
        const index = state.idToTurn.get(id);
        if (index != null) {
          min = Math.min(min, index);
          max = Math.max(max, index);
        }
      }
    }
    return min === Infinity ? null : { min, max };
  }

  // ---------------------------------------------------------------- jump

  function waitFor(predicate, timeout) {
    return new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        let ok = false;
        try {
          ok = !!predicate();
        } catch {
          ok = false;
        }
        if (ok) return resolve(true);
        if (Date.now() - started >= timeout) return resolve(false);
        setTimeout(tick, 140);
      };
      tick();
    });
  }

  function findMessageEl(id) {
    if (!id) return null;
    const value = window.CSS && window.CSS.escape ? window.CSS.escape(id) : id;
    const selectors = [
      `[data-chatgpt-search-message-ids~="${value}"]`,
      `[data-chatgpt-selection-message-id="${value}"]`,
      `[data-dil-source-message-id="${value}"]`,
      `[data-dil-message-id="${value}"]`,
      `[data-message-id="${value}"]`,
    ];
    const scopes = [conversationScope()];
    if (scopes[0] !== document) scopes.push(document);
    for (const selector of selectors) {
      for (const scope of scopes) {
        let nodes;
        try {
          nodes = scope.querySelectorAll(selector);
        } catch {
          continue;
        }
        for (const el of nodes) {
          // Ignore the stale conversation panes ChatGPT keeps in the DOM.
          const rect = el.getBoundingClientRect();
          if (rect.width > 1 || rect.height > 1) return el;
        }
      }
    }
    return null;
  }

  async function progressiveLoad(id, dir, token) {
    const started = Date.now();
    let stagnant = 0;
    const signature = () => collectUnits().map((unit) => unit.ids.join(",")).join("|");
    for (let attempt = 0; attempt < 80 && Date.now() - started < 30000; attempt++) {
      if (token !== state.jumpToken) return null;
      const found = findMessageEl(id);
      if (found) return found;
      const sc = getScroller();
      if (!sc) return null;
      const before = signature(), height = scInfo(sc).sh;
      setStatusOverride(dir === "up" ? T.loadOlder : T.loadNewer, 0);
      const edge = dir === "up" ? 0 : scInfo(sc).max;
      setScrollTop(sc, dir === "up" ? 1 : Math.max(0, edge - 1));
      setScrollTop(sc, edge);
      // Virtualized panes can replace every message without changing scrollHeight.
      await waitFor(() => token !== state.jumpToken || !!findMessageEl(id) || signature() !== before || scInfo(sc).sh !== height, 1800);
      if (token !== state.jumpToken) return null;
      if (findMessageEl(id)) return findMessageEl(id);
      if (signature() === before && scInfo(sc).sh === height) {
        if (++stagnant >= 3) break;
      } else stagnant = 0;
      await sleep(180);
    }
    return findMessageEl(id);
  }

  function alignOffset(extra) {
    const sc = getScroller();
    const viewTop = sc ? scViewTop(sc) : 0;
    let clearTop = viewTop;
    for (const header of document.querySelectorAll("header")) {
      const rect = header.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.top <= viewTop + 4 && rect.bottom > clearTop && rect.bottom < 200) clearTop = rect.bottom;
    }
    return Math.max(16, clearTop - viewTop + 14) + (extra || 0);
  }

  async function alignTo(finder, offset, token) {
    for (let attempt = 0; attempt < 9; attempt++) {
      if (token !== state.jumpToken) return null;
      const el = finder();
      if (!el) return null;
      const sc = getScroller();
      if (!sc) {
        try {
          el.scrollIntoView({ block: "start" });
        } catch {
          /* ignore */
        }
        return el;
      }
      const rect = el.getBoundingClientRect();
      const delta = Math.round(rect.top - scViewTop(sc) - offset);
      if (Math.abs(delta) <= 12) return el;
      const info = scInfo(sc);
      setScrollTop(sc, clamp(info.top + delta, 0, info.max));
      await sleep(300);
    }
    return finder();
  }

  function highlight(el) {
    try {
      const target = el.matches && el.matches("[data-user-message-bubble]")
        ? el
        : (el.querySelector && el.querySelector("[data-user-message-bubble]")) || el;
      if (!target || !target.animate) return;
      target.animate(
        [
          { boxShadow: "0 0 0 0 rgba(16,163,127,0)" },
          { boxShadow: "0 0 0 4px rgba(16,163,127,.45)" },
          { boxShadow: "0 0 0 0 rgba(16,163,127,0)" },
        ],
        { duration: 1500, easing: "ease-out" }
      );
    } catch {
      /* ignore */
    }
  }

  function cancelJump() {
    ++state.jumpToken; state.jumping = false;
    setStatusOverride(null, 0); updateActiveFromScroll();
  }

  async function jumpTo(index, autoClose = false) {
    const turn = state.turns[index];
    if (!turn?.qid) { setStatusOverride(T.notFound, 4500); return; }
    const token = ++state.jumpToken;
    state.jumping = true; hidePreview();
    setActive(index, true); setStatusOverride(T.locating, 0);
    try {
      const finder = () => findMessageEl(turn.qid);
      let el = finder();
      if (!el) {
        const sc = getScroller();
        const original = sc ? scInfo(sc) : null;
        const win = loadedTurnWindow();
        const dir = !win || index < win.min ? "up" : index > win.max ? "down" : index - win.min <= win.max - index ? "up" : "down";
        el = await progressiveLoad(turn.qid, dir, token);
        if (token !== state.jumpToken) return;
        if (!el && original && getScroller() === sc) {
          const current = scInfo(sc);
          if (current.sh === original.sh && current.height === original.height) setScrollTop(sc, original.top);
        }
      }
      if (!el) { setStatusOverride(T.notFound, 4500); return; }
      el = await alignTo(finder, alignOffset(0), token);
      if (token !== state.jumpToken) return;
      if (!el) { setStatusOverride(T.notFound, 4500); return; }
      highlight(el);
      setActive(state.turns.findIndex((candidate) => candidate.qid === turn.qid), true);
      setStatusOverride(null, 0);
      if (autoClose && state.open && !state.docked) applyOpen(false);
    } catch {
      if (token === state.jumpToken) setStatusOverride(T.notFound, 4500);
    } finally {
      if (token === state.jumpToken) { state.jumping = false; updateActiveFromScroll(); }
    }
  }

  function jumpRelative(delta) {
    if (!state.turns.length) return;
    if (state.active < 0) updateActiveFromScroll();
    let index = state.active;
    if (index < 0) index = delta > 0 ? 0 : state.turns.length - 1;
    else index = clamp(index + delta, 0, state.turns.length - 1);
    if (index === state.active && state.active >= 0) {
      setStatusOverride(delta < 0 ? T.atFirst : T.atLast, 1800); return;
    }
    jumpTo(index);
  }

  // ---------------------------------------------------------------- boot

  function watchDom() {
    new MutationObserver(() => {
      checkRoute();
      if (!state.convId || document.hidden || obsTimer) return;
      obsTimer = setTimeout(() => {
        obsTimer = 0;
        if (state.open) updateDock();
        if (!state.jumping) updateActiveFromScroll();
        checkForNewMessages();
      }, 450);
    }).observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
  }

  function checkForNewMessages() {
    if (!state.convId || state.loading || document.hidden) return;
    const turns = domToTurns();
    if (!turns.length) return;
    let changed = false;
    let lastKnown = -1;
    const additions = [];
    for (const turn of turns) {
      if (!turn.qid) continue;
      const signature = turn.q.text + "\u0000" + turn.q.atts.join("\u0000");
      const previous = domSignatures.get(turn.qid);
      const index = state.idToTurn.get(turn.qid);
      if (index == null) { changed = true; additions.push(turn); }
      else { lastKnown = index; if (previous != null && previous !== signature) changed = true; }
      domSignatures.set(turn.qid, signature);
    }
    if (!changed) return;
    // Appending a prompt is immediate even when the outline is collapsed.
    // A divergent branch is fetched instead of being appended to an old branch.
    if (state.source === "api" && additions.length && lastKnown === state.turns.length - 1) {
      const lastKnownPos = turns.findIndex((turn) => turn.qid === state.turns[lastKnown].qid);
      const tail = turns.slice(lastKnownPos + 1).filter((turn) => !state.idToTurn.has(turn.qid));
      if (tail.length) {
        tail.forEach((turn) => { turn.pending = true; });
        replaceTurns(state.turns.concat(tail)); renderAll(); updateActiveFromScroll();
      }
    } else if (state.source !== "api" && seedDomTurns()) {
      renderAll(); updateActiveFromScroll();
    }
    if (refreshTimer) return;
    const delay = Math.max(700, 2500 - (Date.now() - state.lastAutoRefresh));
    refreshTimer = setTimeout(() => {
      refreshTimer = 0;
      if (!state.convId || state.loading || document.hidden) return;
      state.lastAutoRefresh = Date.now();
      loadConversation({ silent: true });
    }, delay);
  }

  function checkRoute() {
    if (location.href !== lastHref) { lastHref = location.href; syncRoute(); }
  }

  function init() {
    // Only favorite IDs persist in extension storage; chat text stays in memory.
    try { localStorage.removeItem("ctoa:settings:v1"); localStorage.removeItem("ctoa:bookmarks:v1"); } catch { /* Storage can be disabled. */ }
    mount(); watchFavorites(); syncRoute(); watchDom();
    window.addEventListener("popstate", checkRoute);
    try { window.navigation?.addEventListener("navigatesuccess", checkRoute); } catch { /* Older Chromium. */ }
    setInterval(checkRoute, 500);
    setInterval(() => {
      if (state.open && state.convId && !document.hidden) updateDock();
    }, 1200);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { hidePreview(); return; }
      updateDock(); checkRoute(); checkForNewMessages();
      if (state.convId && !state.loading && (state.source !== "api" || state.turns.some((turn) => turn.pending))) {
        resetRetry(); loadConversation({ silent: true });
      }
    });
    window.addEventListener("online", () => {
      if (state.convId && !state.loading) { resetRetry(); loadConversation({ silent: true }); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
