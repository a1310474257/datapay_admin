import { dt } from './helpers'

export function seedUserCourse(db) {
  for (let i = 1; i <= 200; i += 1) {
    db.userCourse.push({
      id: i,
      user_id: ((i - 1) % db.user.length) + 1,
      course_id: ((i - 1) % db.course.length) + 1,
      order_id: i,
      created_at: dt(),
    })
  }
}
