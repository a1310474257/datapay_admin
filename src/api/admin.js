import dayjs from 'dayjs'
import { db } from '@/mock'

// Mock 登录 token 前缀：仅用于本地开发环境标识。
const TOKEN_PREFIX = 'dp-admin-token-'

// 后台菜单树（Mock 版本）：
// 结构与侧边栏/权限路由保持一致，后续切换真实接口时可直接复用。
const menus = [
  { path: '/dashboard', name: 'Dashboard', icon: 'Odometer' },
  {
    path: '/operation', name: 'Operation', icon: 'SetUp', children: [
      { path: '/operation/category', name: 'OperationCategory', icon: 'CollectionTag' },
      { path: '/operation/banner', name: 'OperationBanner', icon: 'Picture' },
      { path: '/operation/notice', name: 'OperationNotice', icon: 'Bell' },
      { path: '/operation/hot-search', name: 'OperationHotSearch', icon: 'Search' },
    ]
  },
  {
    path: '/user', name: 'User', icon: 'User', children: [
      { path: '/user/list', name: 'UserList', icon: 'UserFilled' },
    ]
  },
  {
    path: '/course', name: 'Course', icon: 'Reading', children: [
      { path: '/course/teacher', name: 'CourseTeacher', icon: 'Avatar' },
      { path: '/course/list', name: 'CourseList', icon: 'Tickets' },
      { path: '/course/progress', name: 'CourseProgress', icon: 'DataLine' },
    ]
  },
  {
    path: '/resource', name: 'Resource', icon: 'FolderOpened', children: [
      { path: '/resource/list', name: 'ResourceList', icon: 'Document' },
    ]
  },
  {
    path: '/activity', name: 'Activity', icon: 'Calendar', children: [
      { path: '/activity/list', name: 'ActivityList', icon: 'Calendar' },
      { path: '/activity/register', name: 'ActivityRegister', icon: 'EditPen' },
    ]
  },
  {
    path: '/product', name: 'Product', icon: 'ShoppingBag', children: [
      { path: '/product/list', name: 'ProductList', icon: 'Goods' },
    ]
  },
  {
    path: '/order', name: 'Order', icon: 'List', children: [
      { path: '/order/list', name: 'OrderList', icon: 'List' },
      { path: '/order/refund', name: 'OrderRefund', icon: 'RefreshLeft' },
      { path: '/order/pay-record', name: 'OrderPayRecord', icon: 'Wallet' },
    ]
  },
  {
    path: '/system', name: 'System', icon: 'Setting', children: [
      { path: '/system/profile', name: 'SystemProfile', icon: 'UserFilled' },
      { path: '/system/admin', name: 'SystemAdmin', icon: 'Lock' },
      { path: '/system/role', name: 'SystemRole', icon: 'Key' },
      { path: '/system/log', name: 'SystemLog', icon: 'DocumentCopy' },
    ]
  },
]

// 登录接口（Mock）：
// - 仅在 VITE_USE_MOCK=true 时可用；
// - 简化为校验账号密码后返回伪 token。
export async function login({ username, password }) {
  if (import.meta.env.VITE_USE_MOCK !== 'true') {
    throw new Error('真实登录接口未接入')
  }
  const admin = db.adminUser[0]
  if (!admin || username !== admin.username || password !== admin.password) {
    throw new Error('账号或密码错误')
  }
  return `${TOKEN_PREFIX}${dayjs().valueOf()}`
}

// 获取当前管理员信息（Mock）。
export async function getMyProfile() {
  const admin = db.adminUser[0]
  return {
    id: admin.id,
    username: admin.username,
    nickname: admin.nickname,
    avatar: '',
    // 权限码与路由 meta.permission 对齐，控制动态路由注入范围。
    permissions: [
      'Dashboard', 'Operation', 'OperationCategory', 'OperationBanner', 'OperationNotice', 'OperationHotSearch',
      'User', 'UserList', 'Course', 'CourseTeacher', 'CourseList', 'CourseProgress', 'Resource', 'ResourceList',
      'Activity', 'ActivityList', 'ActivityRegister', 'Product', 'ProductList', 'Order', 'OrderList',
      'OrderRefund', 'OrderPayRecord', 'System', 'SystemProfile', 'SystemAdmin', 'SystemRole', 'SystemLog',
    ],
  }
}

// 获取当前管理员菜单（Mock）。
export async function getMyMenus() {
  return menus
}
