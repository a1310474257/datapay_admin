import { mockApi } from './mockApi'
import { db } from '@/mock'

// 分类列表：支持关键字、状态、业务类型筛选 + 分页 + 排序。
export const getCategoryList = (params = {}) =>
  mockApi.crud(db.category, params, {
    searchFields: ['name'],
    filterFields: ['status', 'business_type'],
    defaultSort: 'sort,asc',
  })

export const createCategory = (data) => mockApi.create(db.category, data)

export const updateCategory = (id, data) => mockApi.update(db.category, id, data)

export const deleteCategory = (id) => mockApi.remove(db.category, id)
