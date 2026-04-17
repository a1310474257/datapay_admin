// 系统模块路由：个人信息、管理员、角色权限、操作日志等后台配置页面。
const systemRoutes = [
  {
    path: 'system/profile',
    name: 'SystemProfile',
    component: () => import('@/views/system/profile/index.vue'),
    meta: { title: '个人信息', icon: 'UserFilled', permission: 'SystemProfile' },
  },
  {
    path: 'system/admin',
    name: 'SystemAdmin',
    component: () => import('@/views/system/admin/index.vue'),
    meta: { title: '管理员', icon: 'Lock', permission: 'SystemAdmin' },
  },
  {
    path: 'system/role',
    name: 'SystemRole',
    component: () => import('@/views/system/role/index.vue'),
    meta: { title: '角色权限', icon: 'Key', permission: 'SystemRole' },
  },
  {
    path: 'system/log',
    name: 'SystemLog',
    component: () => import('@/views/system/log/index.vue'),
    meta: { title: '操作日志', icon: 'DocumentCopy', permission: 'SystemLog' },
  },
]

export default systemRoutes
