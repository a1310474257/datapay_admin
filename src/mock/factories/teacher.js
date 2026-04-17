import { dt, pic } from './helpers'

export function seedTeacher(db) {
  for (let i = 1; i <= 12; i += 1) {
    db.teacher.push({
      id: i,
      name: `Teacher ${i}`,
      avatar: pic(`teacher-${i}`),
      title: `Senior Consultant ${i}`,
      intro: `Teacher ${i} focuses on organizational development and productivity.`,
      status: 1,
      created_at: dt(),
      updated_at: dt(),
    })
  }
}
