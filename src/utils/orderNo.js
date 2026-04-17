import dayjs from 'dayjs'

// 当日流水号计数器：日期变化时会自动归零。
let serial = 0
let dateKey = ''

// 订单号规则：DP + YYYYMMDD + 4位自增序号（示例：DP202604170001）。
export function genOrderNo() {
  const today = dayjs().format('YYYYMMDD')
  // 跨天后重置计数，确保每天从 0001 开始。
  if (today !== dateKey) {
    dateKey = today
    serial = 0
  }
  serial += 1
  return `DP${today}${String(serial).padStart(4, '0')}`
}
