import { dt } from './helpers'

export function seedCourseChapter(db) {
  let id = 1
  db.course.forEach((course) => {
    for (let i = 1; i <= 4; i += 1) {
      db.courseChapter.push({
        id,
        course_id: course.id,
        title: `Chapter ${i} - Course ${course.id}`,
        sort: i,
        created_at: dt(),
        updated_at: dt(),
      })
      id += 1
    }
  })
}
