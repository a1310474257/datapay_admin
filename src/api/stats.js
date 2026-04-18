import dayjs from 'dayjs'
import { db } from '@/mock'
import { ORDER_TYPE } from '@/utils/enums'
import { delay } from './mockApi'

// 仪表盘概览：输出第3批要求的 5 个数值卡片指标。
export async function getOverview() {
  await delay()
  const today = dayjs().format('YYYY-MM-DD')
  const todayUsers = db.user.filter((item) => String(item.created_at || '').startsWith(today)).length
  const todayOrders = db.order.filter((item) => String(item.created_at || '').startsWith(today)).length
  const todayGmv = db.order
    .filter((item) => String(item.created_at || '').startsWith(today) && Number(item.status) >= 1)
    .reduce((sum, item) => sum + Number(item.actual_pay || 0), 0)
  const pendingRefund = db.refund.filter((item) => Number(item.status) === 0).length
  const waitShipOrder = db.order.filter((item) => Number(item.status) === 1 && Number(item.order_type) === 5).length

  return {
    todayUsers,
    todayOrders,
    todayGmv,
    pendingRefund,
    waitShipOrder,
  }
}

// 近 30 天 GMV 折线（按天聚合实付）。
export async function getGmvTrend() {
  await delay()
  const days = []
  for (let i = 29; i >= 0; i -= 1) {
    days.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
  }
  const series = days.map((d) => {
    const sum = db.order
      .filter(
        (o) =>
          String(o.created_at || '').startsWith(d) && [1, 2, 3, 4, 5].includes(Number(o.status)),
      )
      .reduce((s, o) => s + Number(o.actual_pay || 0), 0)
    return Math.round(sum / 100) / 100
  })
  return { dates: days, values: series }
}

// 订单类型分布（饼图）。
export async function getOrderTypeDistribution() {
  await delay()
  const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  db.order.forEach((o) => {
    if (o.deleted_at != null) return
    const t = Number(o.order_type)
    if (map[t] !== undefined) map[t] += 1
  })
  return Object.entries(map).map(([key, value]) => ({
    name: ORDER_TYPE[Number(key)]?.label || `类型${key}`,
    value,
  }))
}

// Top10 课程销售额（分转元后）。
export async function getTopCourses() {
  await delay()
  const map = {}
  db.orderItem.forEach((item) => {
    const order = db.order.find((o) => Number(o.id) === Number(item.order_id))
    if (!order || Number(order.order_type) !== 1) return
    const cid = Number(item.item_id)
    if (!cid) return
    map[cid] = (map[cid] || 0) + Number(item.price || 0) * Number(item.quantity || 0)
  })
  const rows = Object.entries(map)
    .map(([id, fen]) => {
      const course = db.course.find((c) => Number(c.id) === Number(id))
      return { title: course?.title || `课程#${id}`, amountYuan: Math.round(fen / 100) / 100 }
    })
    .sort((a, b) => b.amountYuan - a.amountYuan)
    .slice(0, 10)
  return rows
}

// 热门活动报名率漏斗（简化：取前 5 个活动）。
export async function getActivityFunnel() {
  await delay()
  return db.activity.slice(0, 5).map((a) => {
    const regs = db.activityRegister.filter((r) => Number(r.activity_id) === Number(a.id))
    const checked = regs.filter((r) => Number(r.register_status) === 2).length
    const rate = regs.length ? Math.round((checked / regs.length) * 100) : 0
    return { name: a.title, enrolled: regs.length, checked, rate }
  })
}
