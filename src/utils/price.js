// 金额换算统一常量：1 元 = 100 分。
const CENTS_FACTOR = 100

// 分转元，返回固定两位小数字符串，便于直接展示到 UI。
export function fen2yuan(fen) {
  const value = Number.isFinite(Number(fen)) ? Number(fen) : 0
  return (value / CENTS_FACTOR).toFixed(2)
}

// 元转分，支持负数与字符串输入，避免浮点运算误差。
export function yuan2fen(yuan) {
  const normalized = String(yuan ?? '0').trim()
  if (!normalized) return 0
  const negative = normalized.startsWith('-')
  const abs = negative ? normalized.slice(1) : normalized
  const [intPart = '0', decimalPart = ''] = abs.split('.')
  // 只保留前两位小数作为“分”。
  const cents = `${decimalPart}00`.slice(0, 2)
  const result = Number.parseInt(intPart, 10) * CENTS_FACTOR + Number.parseInt(cents, 10)
  return negative ? -result : result
}
