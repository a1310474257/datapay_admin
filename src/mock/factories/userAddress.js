import { faker } from '@faker-js/faker'
import { dt, randomName, randomPhone } from './helpers'

const provinces = ['广东省', '浙江省', '江苏省', '北京市', '上海市', '四川省']
const cities = ['深圳市', '广州市', '杭州市', '南京市', '北京市', '成都市']

export function seedUserAddress(db) {
  for (let i = 1; i <= 300; i += 1) {
    const userId = ((i - 1) % db.user.length) + 1
    db.userAddress.push({
      id: i,
      user_id: userId,
      name: randomName(),
      phone: randomPhone(),
      province: provinces[i % provinces.length],
      city: cities[i % cities.length],
      district: `第${(i % 10) + 1}区`,
      detail: `${faker.location.streetAddress()} ${faker.location.secondaryAddress()}`,
      is_default: i % 2 === 0 ? 1 : 0,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
