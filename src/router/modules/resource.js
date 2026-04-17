// 资源模块路由：用于管理文档、工具等可下载资源。
const resourceRoutes = [
  {
    path: 'resource/list',
    name: 'ResourceList',
    component: () => import('@/views/resource/list/index.vue'),
    meta: { title: '资源列表', icon: 'Document', permission: 'ResourceList' },
  },
]

export default resourceRoutes
