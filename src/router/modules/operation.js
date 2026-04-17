// 运营模块路由：分类、轮播图、公告、热搜词等运营配置页面。
const operationRoutes = [
  {
    path: 'operation/category',
    name: 'OperationCategory',
    component: () => import('@/views/operation/category/index.vue'),
    meta: { title: '分类管理', icon: 'CollectionTag', permission: 'OperationCategory' },
  },
  {
    path: 'operation/banner',
    name: 'OperationBanner',
    component: () => import('@/views/operation/banner/index.vue'),
    meta: { title: '轮播图', icon: 'Picture', permission: 'OperationBanner' },
  },
  {
    path: 'operation/notice',
    name: 'OperationNotice',
    component: () => import('@/views/operation/notice/index.vue'),
    meta: { title: '公告', icon: 'Bell', permission: 'OperationNotice' },
  },
  {
    path: 'operation/hot-search',
    name: 'OperationHotSearch',
    component: () => import('@/views/operation/hot-search/index.vue'),
    meta: { title: '热搜词', icon: 'Search', permission: 'OperationHotSearch' },
  },
]

export default operationRoutes
