import { dt, randomName, randomPhone } from './helpers'

export function seedActivityRegister(db) {
  for (let i = 1; i <= 200; i += 1) {
    const user = db.user[(i - 1) % db.user.length]
    const activity = db.activity[(i - 1) % db.activity.length]
    db.activityRegister.push({
      id: i,
      activity_id: activity.id,
      user_id: user.id,
      order_id: i % 4 === 0 ? 0 : 300 + i,
      name: randomName(),
      phone: randomPhone(),
      email: `user${i}@example.com`,
      company: `Company ${(i % 20) + 1}`,
      remark: '',
      register_status: i % 5 === 0 ? 2 : 1,
      created_at: dt(),
      updated_at: dt(),
    })
  }
}
