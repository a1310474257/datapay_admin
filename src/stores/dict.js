import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getStorageValue, setStorage } from '@/utils/storage'
import { getCategoryList } from '@/api/category'
import { getTeacherList } from '@/api/teacher'

// 字典缓存有效期：5 分钟，兼顾实时性与性能。
const TTL = 5 * 60 * 1000
const CACHE_KEY = 'dp_dict_store'

function fromCache(cache, key) {
  const record = cache[key]
  if (!record) return null
  if (Date.now() - record.ts > TTL) return null
  return record.data
}

/** @typedef {{ id: number, name: string }} DictOption */

export const useDictStore = defineStore('dict', () => {
  const cache = ref(getStorageValue(CACHE_KEY, {}, 'session'))
  const category = ref(/** @type {DictOption[]} */ ([]))
  const teacher = ref(/** @type {DictOption[]} */ ([]))
  const expressCompany = ref(/** @type {DictOption[]} */ ([]))

  function persist() {
    setStorage(CACHE_KEY, cache.value, 'session')
  }

  /**
   * 课程模块下拉用的分类：仅「课程」业务（scene=1）、启用状态。
   * @param {{ force?: boolean }} options - force 为 true 时跳过 TTL，立刻请求接口
   */
  async function loadCategory(options = {}) {
    const cached = options.force ? null : fromCache(cache.value, 'category')
    if (cached) {
      category.value = cached
      return cached
    }
    try {
      const page = await getCategoryList({
        page: 1,
        pageSize: 500,
      })
      const data = (page.list || []).map((item) => ({
          id: Number(item.id),
          name: item.name || '',
      }))
      category.value = data
      cache.value.category = { ts: Date.now(), data }
      persist()
      return data
    } catch (e) {
      console.error('[dict] loadCategory failed', e)
      category.value = []
      return []
    }
  }

  /**
   * 启用状态的讲师列表（下拉用）。
   * @param {{ force?: boolean }} options
   */
  async function loadTeacher(options = {}) {
    const cached = options.force ? null : fromCache(cache.value, 'teacher')
    if (cached) {
      teacher.value = cached
      return cached
    }
    try {
      const page = await getTeacherList({
        page: 1,
        pageSize: 100,
      })
      const data = (page.list || []).map((item) => ({
          id: Number(item.id),
          name: item.name || '',
      }))
      teacher.value = data
      cache.value.teacher = { ts: Date.now(), data }
      persist()
      return data
    } catch (e) {
      console.error('[dict] loadTeacher failed', e)
      teacher.value = []
      return []
    }
  }

  /** 快递公司仍为内置枚举（暂无后台字典接口）。 */
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
