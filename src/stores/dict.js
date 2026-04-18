import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getStorageValue, setStorage } from '@/utils/storage'

// 字典缓存有效期：5 分钟，兼顾实时性与性能。
const TTL = 5 * 60 * 1000
// 会话级缓存 key，关闭浏览器后自动失效。
const CACHE_KEY = 'dp_dict_store'

// 读取缓存并校验有效期，超时返回 null 触发重新加载。
function fromCache(cache, key) {
  const record = cache[key]
  if (!record) return null
  if (Date.now() - record.ts > TTL) return null
  return record.data
}

export const useDictStore = defineStore('dict', () => {
  // cache 结构：{ [key]: { ts, data } }
  const cache = ref(getStorageValue(CACHE_KEY, {}, 'session'))
  // 各业务字典的响应式数据。
  const category = ref([])
  const teacher = ref([])
  const expressCompany = ref([])

  // 缓存持久化统一入口。
  function persist() {
    setStorage(CACHE_KEY, cache.value, 'session')
  }

  // 加载分类字典：优先缓存，缺失时从 mock db 中提取。
  async function loadCategory(options = {}) {
    const cached = options.force ? null : fromCache(cache.value, 'category')
    if (cached) {
      category.value = cached
      return cached
    }
    const data = (window.__db?.category || []).map((item) => ({ id: item.id, name: item.name }))
    category.value = data
    cache.value.category = { ts: Date.now(), data }
    persist()
    return data
  }

  // 加载讲师字典：优先缓存，缺失时从 mock db 中提取。
  async function loadTeacher(options = {}) {
    const cached = options.force ? null : fromCache(cache.value, 'teacher')
    if (cached) {
      teacher.value = cached
      return cached
    }
    const data = (window.__db?.teacher || []).map((item) => ({ id: item.id, name: item.name }))
    teacher.value = data
    cache.value.teacher = { ts: Date.now(), data }
    persist()
    return data
  }

  // 加载快递公司字典：当前为内置静态枚举。
  async function loadExpress(options = {}) {
    const cached = options.force ? null : fromCache(cache.value, 'expressCompany')
    if (cached) {
      expressCompany.value = cached
      return cached
    }
    const data = [
      { id: 1, name: '顺丰' },
      { id: 2, name: '中通' },
      { id: 3, name: '圆通' },
      { id: 4, name: '申通' },
      { id: 5, name: '京东' },
    ]
    expressCompany.value = data
    cache.value.expressCompany = { ts: Date.now(), data }
    persist()
    return data
  }

  return { category, teacher, expressCompany, loadCategory, loadTeacher, loadExpress }
})
