import { db, resetDb } from './db'
import { seedCategory } from './factories/category'
import { seedBanner } from './factories/banner'
import { seedNotice } from './factories/notice'
import { seedHotSearch } from './factories/hotSearch'
import { seedUser } from './factories/user'
import { seedUserAddress } from './factories/userAddress'
import { seedUserToken } from './factories/userToken'
import { seedTeacher } from './factories/teacher'
import { seedCourse } from './factories/course'
import { seedCourseChapter } from './factories/courseChapter'
import { seedCourseLesson } from './factories/courseLesson'
import { seedCourseMaterial } from './factories/courseMaterial'
import { seedUserCourse } from './factories/userCourse'
import { seedLessonProgress } from './factories/lessonProgress'
import { seedResource } from './factories/resource'
import { seedUserResource } from './factories/userResource'
import { seedActivity } from './factories/activity'
import { seedActivitySpeaker } from './factories/activitySpeaker'
import { seedActivityRegister } from './factories/activityRegister'
import { seedProduct } from './factories/product'
import { seedProductImage } from './factories/productImage'
import { seedProductSpec } from './factories/productSpec'
import { seedProductSpecValue } from './factories/productSpecValue'
import { seedOrder } from './factories/order'
import { seedOrderItem } from './factories/orderItem'
import { seedRefund } from './factories/refund'
import { seedPayRecord } from './factories/payRecord'
import { seedAdminUser } from './factories/adminUser'

// seeded 标记避免重复灌数导致数据膨胀；
// force=true 时可强制重新初始化。
let seeded = false

export function seed(force = false) {
  if (seeded && !force) {
    return db
  }

  // 每次灌数前先清空内存数据库，保证数据一致性。
  resetDb()
  // 下面按业务域顺序注入基础数据，便于定位某类数据的来源。
  seedCategory(db)
  seedBanner(db)
  seedNotice(db)
  seedHotSearch(db)
  seedUser(db)
  seedUserAddress(db)
  seedUserToken(db)
  seedTeacher(db)
  seedCourse(db)
  seedCourseChapter(db)
  seedCourseLesson(db)
  seedCourseMaterial(db)
  seedUserCourse(db)
  seedLessonProgress(db)
  seedResource(db)
  seedUserResource(db)
  seedActivity(db)
  seedActivitySpeaker(db)
  seedActivityRegister(db)
  seedProduct(db)
  seedProductImage(db)
  seedProductSpec(db)
  seedProductSpecValue(db)
  seedOrder(db)
  seedOrderItem(db)
  seedRefund(db)
  seedPayRecord(db)
  seedAdminUser(db)

  // 标记初始化完成，后续调用默认直接复用现有数据。
  seeded = true
  return db
}
