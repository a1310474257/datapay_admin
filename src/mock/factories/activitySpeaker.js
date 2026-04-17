import { dt, pic } from './helpers'

export function seedActivitySpeaker(db) {
  let id = 1
  db.activity.forEach((activity) => {
    for (let i = 1; i <= 3; i += 1) {
      db.activitySpeaker.push({
        id,
        activity_id: activity.id,
        name: `嘉宾${activity.id}-${i}`,
        title: '资深专家',
        avatar: pic(`speaker-${id}`),
        sort: i,
        created_at: dt(),
      })
      id += 1
    }
  })
}
