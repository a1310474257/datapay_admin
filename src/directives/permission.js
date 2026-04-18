import { useUserStore } from '@/stores/user'

// 按钮权限指令：没有权限码时直接移除 DOM，避免“看得到点不了”造成误解。
export const permissionDirective = {
  mounted(el, binding) {
    const code = binding.value
    const userStore = useUserStore()
    if (!code) return
    const hasPermission = userStore.permissions.includes(code)
    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  },
}
