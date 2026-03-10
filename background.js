// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    // 模拟翻译（可替换为真实翻译 API）
    translateText(request.text)
      .then(translated => sendResponse({ translated }))
      .catch(() => sendResponse({ translated: '翻译服务异常' }));
    return true; // 表示异步响应
  }
});

// 模拟翻译函数（实际可调用 Google / 百度 / 有道等翻译 API）
async function translateText(text) {
  // 此处仅为演示，返回固定格式
  return `${text}`;
}
