import { faker } from '@faker-js/faker'
import { dt, pic, randomPhone } from './helpers'

export function seedUser(db) {
  for (let i = 1; i <= 150; i += 1) {
    db.user.push({
      id: i,
      openid: `openid_${faker.string.alphanumeric(24)}_${i}`,
      nickname: `User${i}`,
      avatar: pic(`user-${i}`),
      phone: randomPhone(),
      status: i <= 10 ? 0 : 1,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
