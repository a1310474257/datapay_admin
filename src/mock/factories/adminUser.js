export function seedAdminUser(db) {
  db.adminUser.push({
    id: 1,
    username: 'admin',
    password: 'admin',
    nickname: '超级管理员',
  })
}
