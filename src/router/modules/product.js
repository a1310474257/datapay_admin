// 商品模块路由：当前包含商品列表，后续可扩展规格/库存页面。
const productRoutes = [
  {
    path: 'product/list',
    name: 'ProductList',
    component: () => import('@/views/product/list/index.vue'),
    meta: { title: '商品列表', icon: 'Goods', permission: 'ProductList' },
  },
  {
    path: 'product/detail/:id',
    name: 'ProductDetail',
    component: () => import('@/views/product/detail/index.vue'),
    meta: { title: '商品详情', keepAlive: false },
  },
]

export default productRoutes
