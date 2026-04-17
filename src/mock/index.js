import { db } from './db'
import { seed } from './seed'

// 仅用于本地开发调试：将内存数据库挂到全局，便于在浏览器控制台直接查看。
window.__db = db

export { db, seed }
