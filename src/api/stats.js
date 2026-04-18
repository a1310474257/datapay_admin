import dayjs from 'dayjs'
import { db } from '@/mock'
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
