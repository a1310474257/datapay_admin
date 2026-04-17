// 活动模块路由：活动列表与报名管理页面统一放在该分组。
const activityRoutes = [
  {
    path: 'activity/list',
    name: 'ActivityList',
    component: () => import('@/views/activity/list/index.vue'),
    meta: { title: '活动列表', icon: 'Calendar', permission: 'ActivityList' },
  },
  {
    path: 'activity/register',
    name: 'ActivityRegister',
    component: () => import('@/views/activity/register/index.vue'),
    meta: { title: '报名管理', icon: 'EditPen', permission: 'ActivityRegister' },
  },
]

export default activityRoutes
