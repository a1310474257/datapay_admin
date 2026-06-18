import { faker } from '@faker-js/faker'
import { dt, pic, richText } from './helpers'

export function seedCourse(db) {
  for (let i = 1; i <= 30; i += 1) {
    const teacher = db.teacher[(i - 1) % db.teacher.length]
    db.course.push({
      id: i,
      category_id: ((i - 1) % db.category.length) + 1,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      title: `Course ${i}`,
      cover: pic(`course-${i}`),
      brief: `Course ${i} intro for management training.`,
      description: richText(`Course ${i}`),
      total_duration: `${faker.number.int({ min: 8, max: 48 })}h`,
      price: faker.number.int({ min: 19900, max: 129900 }),
      sales: faker.number.int({ min: 20, max: 2000 }),
      chapter_count: 4,
      status: 1,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
