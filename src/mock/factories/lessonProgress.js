import { faker } from '@faker-js/faker'
import { dt } from './helpers'

export function seedLessonProgress(db) {
  for (let i = 1; i <= 1000; i += 1) {
    const lesson = db.courseLesson[(i - 1) % db.courseLesson.length]
    db.lessonProgress.push({
      id: i,
      user_id: ((i - 1) % db.user.length) + 1,
      course_id: lesson.course_id,
      lesson_id: lesson.id,
      watched_sec: faker.number.int({ min: 30, max: lesson.duration_sec }),
      is_finished: i % 3 === 0 ? 1 : 0,
      updated_at: dt(),
    })
  }
}
