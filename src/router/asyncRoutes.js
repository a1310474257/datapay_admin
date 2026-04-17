import AdminLayout from '@/layouts/AdminLayout.vue'
import dashboardRoutes from './modules/dashboard'
import operationRoutes from './modules/operation'
import userRoutes from './modules/user'
import courseRoutes from './modules/course'
import resourceRoutes from './modules/resource'
import activityRoutes from './modules/activity'
import productRoutes from './modules/product'
import orderRoutes from './modules/order'
import systemRoutes from './modules/system'

// 异步路由：
// 通过权限模块在运行时筛选后注入，用于实现“按菜单下发页面权限”。
export const asyncRoutes = [
  {
    // 顶层布局路由，所有后台页面都渲染在 AdminLayout 内。
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    meta: { permission: 'Dashboard' },
    children: [
      // 将各业务模块拆分为独立路由文件，便于维护和按需扩展。
      ...dashboardRoutes,
      ...operationRoutes,
      ...userRoutes,
      ...courseRoutes,
      ...resourceRoutes,
      ...activityRoutes,
      ...productRoutes,
      ...orderRoutes,
      ...systemRoutes,
    ],
  },
]
