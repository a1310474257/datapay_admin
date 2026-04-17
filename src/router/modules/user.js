// 用户模块路由：当前仅开放用户列表，后续可扩展详情与标签管理。
const userRoutes = [
  {
    path: 'user/list',
    name: 'UserList',
    component: () => import('@/views/user/list/index.vue'),
    meta: { title: '用户列表', icon: 'UserFilled', permission: 'UserList' },
  },
]

export default userRoutes
