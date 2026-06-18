import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'
import { dt, pic, richText } from './helpers'

export function seedActivity(db) {
  for (let i = 1; i <= 12; i += 1) {
    const dayOffset = i <= 4 ? 10 : i <= 8 ? 0 : -10
    const activityDate = dayjs().add(dayOffset, 'day')
    const limitCount = faker.number.int({ min: 80, max: 300 })
    const enrolledCount = faker.number.int({ min: 20, max: limitCount })
    db.activity.push({
      id: i,
      category_id: ((i - 1) % db.category.length) + 1,
      title: `线下活动 ${i}`,
      cover: pic(`activity-${i}`),
      description: richText(`活动${i}`),
      activity_date: activityDate.format('YYYY-MM-DD'),
      time_range: '14:00-17:00',
      location: `会议中心${i}号厅`,
      price: faker.number.int({ min: 0, max: 29900 }),
      limit_count: limitCount,
      enrolled_count: enrolledCount,
      agenda: [
        { time: '13:30-14:00', content: '签到入场' },
        { time: '14:00-16:00', content: '主题分享' },
        { time: '16:00-17:00', content: '圆桌交流' },
      ],
      status: 1,
      created_at: dt(),
      updated_at: dt(),
      deleted_at: null,
    })
  }
}
