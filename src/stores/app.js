import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getStorageValue, setStorage } from '@/utils/storage'

// 侧边栏折叠状态缓存 key，保持用户操作习惯。
const SIDEBAR_KEY = 'dp_sidebar_collapsed'

export const useAppStore = defineStore('app', () => {
  // 启动时恢复侧边栏状态，避免每次刷新都回到默认展开。
  const sidebarCollapsed = ref(Boolean(getStorageValue(SIDEBAR_KEY, false)))
  // 预留设备类型字段，后续可接入响应式布局策略。
  const device = ref('desktop')
  // 预留主题字段，后续可扩展深色模式等主题切换能力。
  const theme = ref('light')

  // 切换侧边栏并同步持久化。
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    setStorage(SIDEBAR_KEY, sidebarCollapsed.value)
  }

  // 统一修改主题入口，便于未来增加主题副作用（如写入 html class）。
  function setTheme(nextTheme) {
    theme.value = nextTheme
  }

  return { sidebarCollapsed, device, theme, toggleSidebar, setTheme }
})
