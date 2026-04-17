// 内存数据库：每个字段代表一张“表”，值为数组。
// 所有 mock API 操作均直接读写该对象。
export const db = {
  category: [],
  banner: [],
  notice: [],
  hotSearch: [],
  user: [],
  userAddress: [],
  userToken: [],
  teacher: [],
  course: [],
  courseChapter: [],
  courseLesson: [],
  courseMaterial: [],
  userCourse: [],
  lessonProgress: [],
  resource: [],
  userResource: [],
  activity: [],
  activitySpeaker: [],
  activityRegister: [],
  product: [],
  productImage: [],
  productSpec: [],
  productSpecValue: [],
  order: [],
  orderItem: [],
  refund: [],
  payRecord: [],
  adminUser: [],
}

// 将所有“表”清空，常用于 seed 前重置。
export function resetDb() {
  Object.keys(db).forEach((key) => {
    db[key].length = 0
  })
}
