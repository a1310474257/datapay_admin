import { dt } from './helpers'

const materialTypes = ['PDF', 'DOCX', 'ZIP']

export function seedCourseMaterial(db) {
  let id = 1
  db.course.forEach((course) => {
    for (let i = 1; i <= 3; i += 1) {
      db.courseMaterial.push({
        id,
        course_id: course.id,
        title: `Course ${course.id} Material ${i}`,
        type: materialTypes[(i - 1) % materialTypes.length],
        file_size: `${2 + i}.0MB`,
        url: `https://example.com/material/${id}`,
        sort: i,
        created_at: dt(),
        updated_at: dt(),
      })
      id += 1
    }
  })
}
