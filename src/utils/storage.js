// 统一获取存储介质：
// - local: 浏览器持久化存储；
// - session: 会话级存储，关闭标签页后失效。
function getStorage(type = 'local') {
  return type === 'session' ? window.sessionStorage : window.localStorage
}

// 设置存储：
// - 字符串原样保存；
// - 其他类型自动 JSON 序列化。
export function setStorage(key, value, type = 'local') {
  const storage = getStorage(type)
  const payload = typeof value === 'string' ? value : JSON.stringify(value)
  storage.setItem(key, payload)
}

// 读取存储并自动反序列化：
// - 解析失败时回退原字符串；
// - key 不存在时返回 defaultValue。
export function getStorageValue(key, defaultValue = null, type = 'local') {
  const storage = getStorage(type)
  const raw = storage.getItem(key)
  if (raw == null) return defaultValue
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

// 删除指定 key。
export function removeStorage(key, type = 'local') {
  getStorage(type).removeItem(key)
}

// 清空指定存储介质下的全部数据。
export function clearStorage(type = 'local') {
  getStorage(type).clear()
}
