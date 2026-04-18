// 订单模块路由：包含订单列表、退款审核、支付流水三条核心链路。
const orderRoutes = [
  {
    path: 'order/list',
    name: 'OrderList',
    component: () => import('@/views/order/list/index.vue'),
    meta: { title: '订单列表', icon: 'List', permission: 'OrderList' },
  },
  {
    path: 'order/detail/:id',
    name: 'OrderDetail',
    component: () => import('@/views/order/detail/index.vue'),
    meta: { title: '订单详情', keepAlive: false },
  },
  {
    path: 'order/refund',
    name: 'OrderRefund',
    component: () => import('@/views/order/refund/index.vue'),
    meta: { title: '退款审核', icon: 'RefreshLeft', permission: 'OrderRefund' },
  },
  {
    path: 'order/pay-record',
    name: 'OrderPayRecord',
    component: () => import('@/views/order/pay-record/index.vue'),
    meta: { title: '支付流水', icon: 'Wallet', permission: 'OrderPayRecord' },
  },
]

export default orderRoutes
