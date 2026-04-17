import dayjs from 'dayjs'
import { faker } from '@faker-js/faker'

faker.seed(20260417)

export const EXPRESS_COMPANIES = ['顺丰', '中通', '圆通', '申通', '京东', '韵达']

export function dt(input = null) {
  return dayjs(input || faker.date.past()).format('YYYY-MM-DD HH:mm:ss')
}

export function dateOnly(input = null) {
  return dayjs(input || faker.date.past()).format('YYYY-MM-DD')
}

export function pic(seed) {
  return `https://picsum.photos/seed/${seed}/800/450`
}

export function richText(title = '内容') {
  return [
    `<p>${title} · 第一段说明，包含业务背景和目标。</p>`,
    `<p>${title} · 第二段说明，包含详细功能描述。</p>`,
    `<p>${title} · 第三段说明，包含操作要点和注意事项。</p>`,
    `<img src="${pic(`rich-${title}`)}" alt="${title}" />`,
  ].join('')
}

export function pick(arr) {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })]
}

export function randomPhone() {
  return `1${faker.number.int({ min: 30, max: 99 })}${faker.string.numeric(8)}`
}

export function randomName() {
  const family = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫']
  const given = ['一', '二', '三', '强', '芳', '静', '婷', '明', '磊', '娜', '阳', '浩']
  return `${pick(family)}${pick(given)}${pick(given)}`
}
