import { dt } from './helpers'

export function seedUserResource(db) {
  for (let i = 1; i <= 150; i += 1) {
    db.userResource.push({
      id: i,
      user_id: ((i - 1) % db.user.length) + 1,
      resource_id: ((i - 1) % db.resource.length) + 1,
      order_id: 200 + i,
      created_at: dt(),
    })
  }
}
