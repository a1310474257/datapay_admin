import { dt, richText } from './helpers'

export function seedNotice(db) {
  for (let i = 1; i <= 8; i += 1) {
    const isLink = i % 3 === 0
    db.notice.push({
      id: i,
      title: `System Notice-${i}`,
      image: '',
      link_url: isLink ? `https://example.com/notice/${i}` : '',
      content: richText(`Notice ${i}`),
      status: 1,
      published_at: dt(),
      created_at: dt(),
      updated_at: dt(),
    })
  }
}
