import { now } from '@/utils/date'

// 模拟网络延迟，让前端交互更接近真实接口体验。
export const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

// 为每张“表”（数组）维护独立自增计数器。
const counters = new WeakMap()

// 初始化并获取当前表的最大 ID 计数。
function getCounter(table) {
  if (!counters.has(table)) {
    const maxId = table.reduce((max, row) => Math.max(max, Number(row.id || 0)), 0)
    counters.set(table, maxId)
  }
  return counters.get(table)
}

// 生成下一条记录 ID。
function nextId(table) {
  const value = getCounter(table) + 1
  counters.set(table, value)
  return value
}

// 将字符串数字转为 number，便于和表字段做严格相等比较。
function toNumberIfNumeric(raw) {
  if (typeof raw !== 'string') return raw
  if (raw.trim() === '') return raw
  if (/^-?\d+$/.test(raw)) return Number(raw)
  return raw
}

// 通用排序器：支持 "字段,asc|desc" 的排序参数格式。
function sortRows(rows, sortText) {
  if (!sortText) return rows
  const [field, order = 'desc'] = String(sortText).split(',')
  const direction = order === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    if (a[field] === b[field]) return 0
    return a[field] > b[field] ? direction : -direction
  })
}

export const mockApi = {
  // 通用分页查询：
  // 支持关键字检索、字段过滤、排序和分页切片。
  async crud(table, params = {}, { searchFields = [], filterFields = [], defaultSort } = {}) {
    await delay()
    // deleted_at 约定为软删除标记，默认不返回已删除数据。
    let rows = [...table].filter((row) => row.deleted_at == null)

    // 关键字搜索：只在声明的 searchFields 上做包含匹配。
    if (params.keyword) {
      rows = rows.filter((row) => searchFields.some((field) => String(row[field] ?? '').includes(params.keyword)))
    }

    // 精确过滤：用于状态、分类等枚举字段筛选。
    filterFields.forEach((field) => {
      if (params[field] !== undefined && params[field] !== '') {
        const expected = toNumberIfNumeric(params[field])
        rows = rows.filter((row) => row[field] === expected)
      }
    })

    // 分页切片，返回前端常用结构。
    const sorted = sortRows(rows, params.sort || defaultSort)
    const page = Number(params.page || 1)
    const pageSize = Number(params.pageSize || 10)
    const start = (page - 1) * pageSize
    const list = sorted.slice(start, start + pageSize)

    return { list, total: sorted.length, page, pageSize }
  },

  // 新增记录：自动补齐 id、创建时间、更新时间。
  async create(table, data) {
    await delay()
    const stamp = now()
    const row = {
      id: nextId(table),
      ...data,
      created_at: data.created_at || stamp,
      updated_at: data.updated_at || stamp,
    }
    table.push(row)
    return row
  },

  // 更新记录：按 id 定位后做浅合并更新。
  async update(table, id, data) {
    await delay()
    const target = table.find((row) => Number(row.id) === Number(id))
    if (!target) throw new Error('记录不存在')
    Object.assign(target, data, { updated_at: now() })
    return target
  },

  // 删除记录：支持软删除（存在 deleted_at 字段）和硬删除两种策略。
  async remove(table, id) {
    await delay()
    const index = table.findIndex((row) => Number(row.id) === Number(id))
    if (index < 0) throw new Error('记录不存在')
    if (Object.prototype.hasOwnProperty.call(table[index], 'deleted_at')) {
      table[index].deleted_at = now()
      table[index].updated_at = now()
      return table[index]
    }
    const [row] = table.splice(index, 1)
    return row
  },

  // 根据 id 查询单条记录（默认过滤软删除数据）。
  async findById(table, id) {
    await delay()
    const row = table.find((item) => Number(item.id) === Number(id) && item.deleted_at == null)
    return row || null
  },
}
