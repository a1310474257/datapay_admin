import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getStorageValue, setStorage } from '@/utils/storage'

// 标签页缓存 key，使用 sessionStorage 跟随浏览器会话生命周期。
const TAGS_KEY = 'dp_tags_view'

// 对历史缓存做兼容清洗，避免旧数据污染当前展示。
function sanitizeVisitedViews(rawList) {
  if (!Array.isArray(rawList)) return []
  return rawList.map((item) => {
    const title = typeof item?.title === 'string' ? item.title : 'Untitled'
    return {
      ...item,
      title: title.includes('?') ? 'Untitled' : title,
    }
  })
}

export const useTagsViewStore = defineStore('tagsView', () => {
  // 初始化时恢复已访问标签，提升刷新后的连续操作体验。
  const visitedViews = ref(sanitizeVisitedViews(getStorageValue(TAGS_KEY, [], 'session')))
  // cachedViews 用于 keep-alive 名称缓存（当前预留，后续可直接接入）。
  const cachedViews = ref([])

  // 每次变更后同步到 sessionStorage，保证刷新可恢复。
  function sync() {
    setStorage(TAGS_KEY, visitedViews.value, 'session')
  }

  // 新增访问标签：避免重复 path，并补默认标题。
  function addView(view) {
    if (!visitedViews.value.find((item) => item.path == view.path)) {
      visitedViews.value.push({
        path: view.path,
        name: view.name,
        title: view.meta?.title || '未命名',
      })
      sync()
    }
    // 仅缓存具名路由，避免 keep-alive 出现匿名组件无法命中的问题。
    if (view.name && !cachedViews.value.includes(view.name)) {
      cachedViews.value.push(view.name)
    }
  }

  // 删除单个标签。
  function delView(path) {
    visitedViews.value = visitedViews.value.filter((item) => item.path != path)
    sync()
  }

  // 关闭其他标签，只保留当前标签。
  function delOthersViews(path) {
    visitedViews.value = visitedViews.value.filter((item) => item.path == path)
    sync()
  }

  // 清空全部标签与缓存。
  function delAllViews() {
    visitedViews.value = []
    cachedViews.value = []
    sync()
  }

  return { visitedViews, cachedViews, addView, delView, delOthersViews, delAllViews }
})
