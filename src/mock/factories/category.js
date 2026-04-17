import { dt, pic } from './helpers'

const names = ['课程', 'HR工具', '调研报告', '活动', '商品', '通用', '热门', '推荐', '新手', '进阶', '企业', '实战']

export function seedCategory(db) {
  db.category.push(
    ...names.map((name, i) => ({
      id: i + 1,
      name,
      icon: pic(`category-${i + 1}`),
      // 按序轮转业务类型，保证筛选条件能覆盖 1~5。
      business_type: (i % 5) + 1,
      sort: i + 1,
      status: 1,
      created_at: dt(),
      updated_at: dt(),
    })),
  )
}
