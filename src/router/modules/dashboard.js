// 仪表盘路由：后台首页，登录后默认重定向进入该页面。
const dashboardRoutes = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: { title: '仪表盘', icon: 'Odometer', permission: 'Dashboard' },
  },
]

export default dashboardRoutes
