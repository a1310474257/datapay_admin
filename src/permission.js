import router from '@/router'
import { getMyMenus } from '@/api/admin'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

// 白名单路由：未登录也允许访问。
const WHITE_LIST = ['/login', '/404']

// 全局前置守卫：
// 负责登录拦截、页面标题设置、动态路由注入与异常兜底。
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  // 根据路由 meta.title 动态更新浏览器标题。
  if (to.meta?.title) {
    document.title = `${to.meta.title} - DataPay 管理系统`
  } else {
    document.title = 'DataPay 管理系统'
  }

  // 未登录用户仅允许访问白名单，其余统一跳登录并带上回跳地址。
  if (!userStore.token) {
    if (WHITE_LIST.includes(to.path)) return next()
    return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  // 已登录再次访问登录页时，直接回到业务首页。
  if (to.path === '/login') return next('/dashboard')

  // 首次登录后（或刷新）如果还未生成动态路由，则重新拉取菜单并注入。
  if (!permissionStore.generated) {
    try {
      // profile 里包含权限码，先补齐用户信息保证后续页面可用。
      if (!userStore.permissions.length) await userStore.fetchProfile()
      const menus = await getMyMenus()
      const routes = permissionStore.generateRoutes(menus)
      // addRoute 逐条注入，避免重复创建 router 实例。
      routes.forEach((route) => router.addRoute(route))
      // replace=true 防止浏览器历史中残留“未注入路由时的失败跳转记录”。
      return next({ path: to.fullPath, replace: true })
    } catch {
      // 任一步骤失败都视为鉴权失效，清空状态并重新登录。
      userStore.logout()
      permissionStore.resetRoutes()
      return next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }
  }

  return next()
})
