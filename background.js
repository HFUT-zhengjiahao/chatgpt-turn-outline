// ChatGPT 对话目录 · Turn Outline
// 工具栏图标 / 扩展快捷键 -> 通知当前标签页里的 content script 切换面板。

async function toggleInTab(tabId) {
  if (typeof tabId !== "number") return;
  try {
    await chrome.tabs.sendMessage(tabId, { type: "CTOA_TOGGLE" });
  } catch {
    // 当前标签页没有 content script（不是 ChatGPT 页面），忽略即可。
  }
}

chrome.action.onClicked.addListener((tab) => {
  toggleInTab(tab && tab.id);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-panel") return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) toggleInTab(tab.id);
  } catch {
    // ignore
  }
});

// Serialize favorite writes across tabs. Storage contains IDs only, never text.
const FAVORITES_PREFIX = "ctoa:favorites:v2:";
let favoriteWrites = Promise.resolve();

function favoriteStorage(method, argument) {
  return new Promise((resolve, reject) => {
    chrome.storage.local[method](argument, (value) => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message)); else resolve(value);
    });
  });
}

async function setFavorite(message) {
  const { convId, qid, enabled } = message;
  if (typeof convId !== "string" || convId.length > 256 || !/^[0-9a-z][0-9a-z-]{7,}$/i.test(convId)
      || typeof qid !== "string" || !qid || qid.length > 256 || typeof enabled !== "boolean") {
    return { ok: false };
  }
  const key = FAVORITES_PREFIX + convId;
  const data = await favoriteStorage("get", key);
  const ids = new Set(Array.isArray(data?.[key]) ? data[key].filter((id) => typeof id === "string" && id.length > 0 && id.length <= 256) : []);
  if (enabled) ids.add(qid); else ids.delete(qid);
  if (ids.size) await favoriteStorage("set", { [key]: [...ids].sort() });
  else await favoriteStorage("remove", key);
  return { ok: true };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CTOA_FAVORITE_SET") return;
  const operation = favoriteWrites.then(() => setFavorite(message));
  favoriteWrites = operation.then(() => undefined, () => undefined);
  operation.then(
    (result) => { try { sendResponse(result); } catch { /* The originating tab closed. */ } },
    () => { try { sendResponse({ ok: false }); } catch { /* The originating tab closed. */ } }
  );
  return true;
});
