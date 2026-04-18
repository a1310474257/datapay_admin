import { dt } from './helpers'

const words = ['职业规划', '绩效面谈', '薪酬体系', '组织诊断', '课程推荐', '活动报名', '团队管理', '人才盘点']

export function seedHotSearch(db) {
  db.hotSearch.push(
    ...words.map((keyword, i) => ({
      id: i + 1,
      keyword,
      sort: i + 1,
      hits: (i + 1) * 120,
      status: 1,
      created_at: dt(),
      updated_at: dt(),
    })),
  )
}
