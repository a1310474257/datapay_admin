import dayjs from 'dayjs'

// 格式化任意日期时间输入，默认输出“年-月-日 时:分:秒”。
export function formatDateTime(d, pattern = 'YYYY-MM-DD HH:mm:ss') {
  return dayjs(d).format(pattern)
}

// 统一获取当前时间字符串，避免各处重复拼接格式。
export function now() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss')
}
