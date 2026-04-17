import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'
import { dt } from './helpers'

export function seedUserToken(db) {
  for (let i = 1; i <= 100; i += 1) {
    db.userToken.push({
      id: i,
      user_id: ((i - 1) % db.user.length) + 1,
      token: `token_${faker.string.alphanumeric(48)}`,
      expire_at: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
      created_at: dt(),
    })
  }
}
