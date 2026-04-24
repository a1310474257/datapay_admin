import request from './request'

// =====================================================================
// 后台认证相关接口（对应后端 /api/admin/auth/*）
// =====================================================================

/**
 * 管理员登录。
 * @returns {Promise<string>} JWT token 字符串
 */
export async function login({ username, password }) {
  // 后端返回 AdminLoginVO: { token, expiration, adminInfo }
  const data = await request.post('/api/admin/auth/login', { username, password })
  return data.token
}

/**
 * 获取当前登录管理员信息，附带权限码（按 role 推导）。
 * @returns {Promise<object>} AdminInfoVO + permissions 数组
 */
export async function getMyProfile() {
  const data = await request.get('/api/admin/auth/me')
  // AdminInfoVO 没有 permissions 字段，按 role 全量授权
  // ROLE_SUPER / ROLE_ADMIN 均视为全权限（后台是内部系统）
  return {
    ...data,
    permissions: ALL_PERMISSIONS,
  }
}

/**
 * 获取侧边栏菜单树（纯前端路由配置，无需后端接口）。
 * @returns {Promise<Array>} 菜单树
 */
export async function getMyMenus() {
  return MENUS
}

// =====================================================================
// 权限码与菜单（前端静态定义）
// =====================================================================

const ALL_PERMISSIONS = [
  'Dashboard',
  'Operation', 'OperationCategory', 'OperationBanner', 'OperationNotice', 'OperationHotSearch',
  'User', 'UserList',
  'Course', 'CourseTeacher', 'CourseList', 'CourseProgress',
  'Resource', 'ResourceList',
  'Activity', 'ActivityList', 'ActivityRegister',
  'Product', 'ProductList',
  'Order', 'OrderList', 'OrderRefund', 'OrderPayRecord',
  'System', 'SystemProfile', 'SystemAdmin', 'SystemRole', 'SystemLog',
  // 按钮级权限码
  'category:create', 'category:update', 'category:delete',
  'user:ban', 'user:unban', 'user:detail',
  'teacher:create', 'teacher:update', 'teacher:delete',
  'course:create', 'course:update', 'course:delete', 'course:publish',
  'order:cancel', 'order:remark', 'order:ship',
  'product:create', 'product:update', 'product:delete',
  'refund:approve', 'refund:reject',
  'banner:create', 'banner:update', 'banner:delete',
  'notice:create', 'notice:update', 'notice:delete',
  'hotSearch:create', 'hotSearch:update', 'hotSearch:delete',
  'resource:create', 'resource:update', 'resource:delete',
  'activity:create', 'activity:update', 'activity:delete',
]

const MENUS = [
  { path: '/dashboard', name: 'Dashboard', icon: 'Odometer' },
  {
    path: '/operation', name: 'Operation', icon: 'SetUp', children: [
      { path: '/operation/category', name: 'OperationCategory', icon: 'CollectionTag' },
      { path: '/operation/banner', name: 'OperationBanner', icon: 'Picture' },
      { path: '/operation/notice', name: 'OperationNotice', icon: 'Bell' },
      { path: '/operation/hot-search', name: 'OperationHotSearch', icon: 'Search' },
    ],
  },
  {
    path: '/user', name: 'User', icon: 'User', children: [
      { path: '/user/list', name: 'UserList', icon: 'UserFilled' },
    ],
  },
  {
    path: '/course', name: 'Course', icon: 'Reading', children: [
      { path: '/course/teacher', name: 'CourseTeacher', icon: 'Avatar' },
      { path: '/course/list', name: 'CourseList', icon: 'Tickets' },
      { path: '/course/progress', name: 'CourseProgress', icon: 'DataLine' },
    ],
  },
  {
    path: '/resource', name: 'Resource', icon: 'FolderOpened', children: [
      { path: '/resource/list', name: 'ResourceList', icon: 'Document' },
    ],
  },
  {
    path: '/activity', name: 'Activity', icon: 'Calendar', children: [
      { path: '/activity/list', name: 'ActivityList', icon: 'Calendar' },
      { path: '/activity/register', name: 'ActivityRegister', icon: 'EditPen' },
    ],
  },
  {
    path: '/product', name: 'Product', icon: 'ShoppingBag', children: [
      { path: '/product/list', name: 'ProductList', icon: 'Goods' },
    ],
  },
  {
    path: '/order', name: 'Order', icon: 'List', children: [
      { path: '/order/list', name: 'OrderList', icon: 'List' },
      { path: '/order/refund', name: 'OrderRefund', icon: 'RefreshLeft' },
      { path: '/order/pay-record', name: 'OrderPayRecord', icon: 'Wallet' },
    ],
  },
  {
    path: '/system', name: 'System', icon: 'Setting', children: [
      { path: '/system/profile', name: 'SystemProfile', icon: 'UserFilled' },
      { path: '/system/admin', name: 'SystemAdmin', icon: 'Lock' },
      { path: '/system/role', name: 'SystemRole', icon: 'Key' },
      { path: '/system/log', name: 'SystemLog', icon: 'DocumentCopy' },
    ],
  },
]
