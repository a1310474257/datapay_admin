// 以下枚举统一采用 { value: { label, type } } 结构，
// 可直接驱动 Element Plus 标签、下拉框与状态展示组件。
export const STATUS_ENABLE = {
  0: { label: '禁用', type: 'info' },
  1: { label: '启用', type: 'success' },
}

export const STATUS_ONLINE = {
  0: { label: '下架', type: 'info' },
  1: { label: '上架', type: 'success' },
}

export const USER_STATUS = {
  0: { label: '封禁', type: 'danger' },
  1: { label: '正常', type: 'success' },
}

export const BANNER_TYPE = {
  1: { label: '课程' },
  2: { label: '活动' },
  3: { label: '商品' },
  4: { label: 'HR工具' },
}

export const RESOURCE_TYPE = {
  1: { label: 'HR工具' },
  2: { label: '调研报告' },
}

export const ORDER_TYPE = {
  1: { label: '课程' },
  2: { label: 'HR工具' },
  3: { label: '调研报告' },
  4: { label: '活动' },
  5: { label: '商品' },
}

// 分类业务类型：用于运营分类管理中的“业务归属”展示与筛选。
export const CATEGORY_BUSINESS_TYPE = {
  1: { label: '课程', type: 'success' },
  2: { label: 'HR工具', type: 'warning' },
  3: { label: '调研报告', type: 'primary' },
  4: { label: '活动', type: 'danger' },
  5: { label: '商品', type: '' },
}

export const ORDER_STATUS = {
  0: { label: '待付款', type: 'warning' },
  1: { label: '已付款', type: 'primary' },
  2: { label: '已发货', type: 'primary' },
  3: { label: '已完成', type: 'success' },
  4: { label: '退款中', type: 'warning' },
  5: { label: '已退款', type: 'info' },
  6: { label: '已取消', type: 'info' },
}

export const REGISTER_STATUS = {
  1: { label: '已报名', type: 'warning' },
  2: { label: '已签到', type: 'success' },
}

export const ACTIVITY_STATUS = {
  upcoming: { label: '未开始', type: 'info' },
  enrolling: { label: '报名中', type: 'success' },
  ended: { label: '已结束', type: 'info' },
}

export const PAY_RECORD_STATUS = {
  1: { label: '已支付', type: 'success' },
  2: { label: '已退款', type: 'info' },
}

export const REFUND_STATUS = {
  0: { label: '待审批', type: 'warning' },
  1: { label: '已通过', type: 'success' },
  2: { label: '已拒绝', type: 'info' },
}
