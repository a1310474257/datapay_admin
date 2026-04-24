import dayjs from 'dayjs'
import request from './request'

// Dashboard 统计：优先对接 /api/admin/orders/statistics；
// 其他概览指标（如今日新增用户、各类型销售）后端尚未提供专门接口，
// 这里退化为“用 orders 列表现有能力推导”的近似值。

const ORDER_TYPE_LABEL = {
  course: '课程',
  'hr-tool': 'HR工具',
  'research-report': '调研报告',
  activity: '活动',
  product: '商品',
}

async function fetchStatistics(startDate, endDate) {
  try {
    return await request.get('/admin/orders/statistics', {
      params: { startDate, endDate },
    })
  } catch (e) {
    return null
  }
}

export async function getOverview() {
  const today = dayjs().format('YYYY-MM-DD')
  const [todayStats, pendingRefundPage, waitShipPage] = await Promise.all([
    fetchStatistics(today, today),
    request.get('/admin/orders', { params: { status: 'refunding', page: 1, size: 1 } }).catch(() => null),
    request.get('/admin/orders', { params: { status: 'paid', type: 'product', page: 1, size: 1 } }).catch(() => null),
  ])
  return {
    todayUsers: 0, // 后端暂未提供用户增量接口
    todayOrders: Number(todayStats?.orderCount || 0),
    todayGmv: Number(todayStats?.paidAmount || 0),
    pendingRefund: Number(pendingRefundPage?.total || 0),
    waitShipOrder: Number(waitShipPage?.total || 0),
  }
}

// 近 30 天 GMV 折线：按日逐天调 statistics。
// 后端当前没有按日聚合接口，30 次调用可接受；真实生产建议后端补 daily 接口。
export async function getGmvTrend() {
  const days = []
  for (let i = 29; i >= 0; i -= 1) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
  }
  const values = await Promise.all(days.map(async (d) => {
    const stat = await fetchStatistics(d, d)
    const fen = Number(stat?.paidAmount || 0)
    return Math.round(fen / 100) / 100
  }))
  return { dates: days, values }
}

// 订单类型分布：使用近 30 天统计的 typeDistribution。
export async function getOrderTypeDistribution() {
  const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
  const end = dayjs().format('YYYY-MM-DD')
  const stat = await fetchStatistics(start, end)
  const dist = stat?.typeDistribution || {}
  return Object.entries(dist).map(([type, count]) => ({
    name: ORDER_TYPE_LABEL[type] || type,
    value: Number(count || 0),
  }))
}

// Top10 课程销售：后端暂无专门接口，返回空数组。
// 后续可在后端新增 /api/admin/stats/top-courses 接口。
export async function getTopCourses() {
  return []
}

// 热门活动报名率：前端简化为近期活动列表 + 报名率。
// 这里返回空，让图表退化成提示“暂无数据”，避免调用超多接口。
export async function getActivityFunnel() {
  return []
}
