import { dt, pic } from './helpers'

export function seedBanner(db) {
  for (let i = 1; i <= 6; i += 1) {
    db.banner.push({
      id: i,
      image: pic(`banner-${i}`),
      type: ((i - 1) % 4) + 1,
      target_id: i,
      title: `Homepage Banner-${i}`,
      sort: i,
      status: 1,
      created_at: dt(),
      updated_at: dt(),
    })
  }
}
