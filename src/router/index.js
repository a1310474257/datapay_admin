import { createRouter, createWebHistory } from 'vue-router'

// 常驻路由：
// - 不依赖权限，系统启动时即注册；
// - 主要包含登录页和错误页；
// - 业务路由由权限模块在登录后动态注入。
export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'AnyNotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', public: true },
  },
]

// 采用 HTML5 History 模式，路径更简洁（无 #）。
const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
})

export default router
