import { faker } from '@faker-js/faker'
import { dateOnly, dt, pic, richText } from './helpers'

export function seedResource(db) {
  for (let i = 1; i <= 25; i += 1) {
    const type = i <= 12 ? 1 : 2
    db.resource.push({
      id: i,
      resource_type: type,
      category_id: ((i - 1) % db.category.length) + 1,
      title: `${type === 1 ? 'HR工具' : '调研报告'} ${i}`,
      cover: pic(`resource-${i}`),
      brief: `资源${i}简介，支持下载与预览。`,
      description: richText(`资源${i}`),
      file_type: 'PDF',
      file_url: `https://example.com/resource/${i}.pdf`,
      file_size: `${faker.number.int({ min: 5, max: 30 })}MB`,
      pages: faker.number.int({ min: 20, max: 260 }),
      preview_pages: faker.number.int({ min: 3, max: 30 }),
      preview_url: `https://example.com/resource/preview/${i}.pdf`,
      downloads: faker.number.int({ min: 100, max: 5000 }),
      price: faker.number.int({ min: 9900, max: 59900 }),
      update_time: dateOnly(),
      status: 1,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
