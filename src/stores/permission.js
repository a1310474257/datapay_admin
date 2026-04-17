import { ref } from 'vue'
import { defineStore } from 'pinia'
import { asyncRoutes } from '@/router/asyncRoutes'

// 将服务端菜单树拍平成名称集合，便于 O(1) 判断权限。
function flattenMenuNames(nodes, bucket = new Set()) {
  nodes.forEach((node) => {
    if (node.name) bucket.add(node.name)
    if (Array.isArray(node.children) && node.children.length > 0) {
      flattenMenuNames(node.children, bucket)
    }
  })
  return bucket
}

// 基于服务端菜单筛选本地异步路由：
// - route.meta.permission 不存在则视为公共子路由；
// - 如果存在 children，会递归过滤；
// - 过滤后没有有效 children 的父级重定向路由会被剔除。
function filterRoutesByMenu(routes, menuNames) {
  return routes
    .filter((route) => !route.meta?.permission || menuNames.has(route.meta.permission))
    .map((route) => {
      const next = { ...route }
      if (Array.isArray(route.children) && route.children.length > 0) {
        next.children = filterRoutesByMenu(route.children, menuNames)
      }
      return next
    })
    .filter((route) => !Array.isArray(route.children) || route.children.length > 0 || !route.redirect)
}

export const usePermissionStore = defineStore('permission', () => {
  // 原始菜单数据：直接用于侧边栏渲染。
  const menus = ref([])
  // 过滤后的动态路由：用于 router.addRoute 注入。
  const dynamicRoutes = ref([])
  // 标识当前会话是否已完成动态路由生成，避免重复注入。
  const generated = ref(false)

  // 根据后端返回菜单生成当前用户可访问路由。
  function generateRoutes(serverMenus) {
    menus.value = serverMenus
    const menuNames = flattenMenuNames(serverMenus)
    dynamicRoutes.value = filterRoutesByMenu(asyncRoutes, menuNames)
    generated.value = true
    return dynamicRoutes.value
  }

  // 登录失效或退出时清空权限状态，保证下个账号重新生成。
  function resetRoutes() {
    menus.value = []
    dynamicRoutes.value = []
    generated.value = false
  }

  return { menus, dynamicRoutes, generated, generateRoutes, resetRoutes }
})
