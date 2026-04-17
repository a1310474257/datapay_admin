import { faker } from '@faker-js/faker'
import { dt } from './helpers'

export function seedCourseLesson(db) {
  let id = 1
  db.courseChapter.forEach((chapter) => {
    const lessonCount = chapter.id % 2 === 0 ? 4 : 5
    for (let i = 1; i <= lessonCount; i += 1) {
      db.courseLesson.push({
        id,
        course_id: chapter.course_id,
        chapter_id: chapter.id,
        title: `Lesson ${chapter.id}-${i}`,
        duration_sec: faker.number.int({ min: 600, max: 3200 }),
        video_url: `https://example.com/video/${id}.mp4`,
        is_free: i === 1 ? 1 : 0,
        sort: i,
        created_at: dt(),
        updated_at: dt(),
      })
      id += 1
    }
  })
}
