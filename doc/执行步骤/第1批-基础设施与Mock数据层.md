# 第 1 批 · 基础设施 + Mock 数据层

> 工期：约 **2 天**
> 设计依据：[`../后台前端设计方案.md`](../后台前端设计方案.md) §三、§四、§五、§六、§八、§九、附录 A、附录 B

## 一、本批目标

搭建项目骨架，使 `npm run dev` 能起来并看到**空的登录页 + 空布局 + 空菜单**，同时 `window.__db` 暴露 28 张 `dp_*` 内存表、有种子数据。**本批不做业务页面，不做公共组件**。

## 二、前置条件

- 已有脚手架：Vue 3 + Vite + Pinia + Element Plus + Vue Router，能 `npm run dev`
- 已安装依赖：`element-plus / @element-plus/icons-vue / pinia / vue-router / sass`
- 已存在文件：`src/main.js`、`src/App.vue`、`src/router/index.js`、`src/stores/user.js`、`src/layouts/AdminLayout.vue`、`src/views/login/index.vue`、`src/views/dashboard/index.vue`、`src/assets/styles/index.scss`
- 已有设计方案文档 + 4 条项目 Cursor 规则

## 三、任务清单（按顺序）

### 1.1 清理脚手架

删除 / 清空 Vite 默认残留：

- 删除 `src/components/HelloWorld.vue`
- 删除 `src/assets/vue.svg`、`src/assets/hero.png`（如非业务用）、`src/assets/vite.svg`
- 删除 `src/style.css`（样式统一走 `src/assets/styles/`）
- 检查 `src/App.vue`、`index.html` 不再引用上述资源

### 1.2 更新项目文档

- 更新 `README.md`：描述 DataPay Admin 定位、技术栈、启动命令、目录结构
- `.cursor/rules/project-architecture.mdc` 已存在，**校对**其业务模块划分与设计方案 §三一致

### 1.3 安装新依赖

```bash
npm i axios dayjs @faker-js/faker
npm i @wangeditor/editor @wangeditor/editor-for-vue
npm i vuedraggable@next
# echarts 已装
```

> **注意**：不要指定特定版本号，用最新稳定版即可。

### 1.4 环境变量

新建：

- `.env.development`
  ```
  VITE_API_BASE=/api
  VITE_USE_MOCK=true
  ```
- `.env.production`
  ```
  VITE_API_BASE=/api
  VITE_USE_MOCK=false
  ```

### 1.5 工具层 `src/utils/`

按设计方案 §五、附录 A 创建：

| 文件 | 导出 |
|---|---|
| `enums.js` | `STATUS_ENABLE / STATUS_ONLINE / USER_STATUS / BANNER_TYPE / RESOURCE_TYPE / ORDER_TYPE / ORDER_STATUS / REGISTER_STATUS / ACTIVITY_STATUS / PAY_RECORD_STATUS / REFUND_STATUS`（**严格照搬附录 A**） |
| `price.js` | `fen2yuan(fen) → string`（两位小数）、`yuan2fen(yuan) → int`（整数运算避浮点） |
| `date.js` | `formatDateTime(d, pattern)` 默认 `'YYYY-MM-DD HH:mm:ss'`；`now()` |
| `storage.js` | 简单封装 `localStorage` / `sessionStorage`（支持 JSON 对象） |
| `orderNo.js` | `genOrderNo() → 'DP' + YYYYMMDD + 4位递增序号` |

### 1.6 HTTP 层 `src/api/request.js`

基于 `axios` 实现拦截器：

- 请求拦截：注入 `Authorization: Bearer <token>`、`X-Request-Id`（用时间戳+随机数）；清理 GET 的 `undefined/''`
- 响应拦截：
  - `code === 0` → return `res.data.data`
  - `code === 1002` → 清 token、跳 `/login?redirect=<current>`
  - `code === 1003` → `ElMessage.error`
  - 其他非零 → `ElMessage.error(message)` 并 `reject`
  - HTTP 非 2xx → 统一提示"网络异常，请稍后重试"
- `baseURL` 读 `import.meta.env.VITE_API_BASE`，超时 10s

### 1.7 Mock 层 `src/mock/`

**目录结构**：

```
src/mock/
├── index.js          # 导出 { db, seed }，暴露 window.__db
├── db.js             # 28 张内存表（空数组）
├── seed.js           # 调度 28 个工厂函数
└── factories/
    ├── category.js
    ├── banner.js
    ├── notice.js
    ├── hotSearch.js
    ├── user.js
    ├── userAddress.js
    ├── userToken.js
    ├── teacher.js
    ├── course.js
    ├── courseChapter.js
    ├── courseLesson.js
    ├── courseMaterial.js
    ├── userCourse.js
    ├── lessonProgress.js
    ├── resource.js
    ├── userResource.js
    ├── activity.js
    ├── activitySpeaker.js
    ├── activityRegister.js
    ├── product.js
    ├── productImage.js
    ├── productSpec.js
    ├── productSpecValue.js
    ├── order.js
    ├── orderItem.js
    ├── refund.js
    ├── payRecord.js
    └── adminUser.js
```

**关键要求**：

- 表名与字段**必须**与 `datapay_ui/doc/数据库设计文档.md` 的 28 张 `dp_*` 表 1:1 对齐
- 金额字段为整数"分"
- 时间字段为 `YYYY-MM-DD HH:mm:ss` 字符串
- 图片：`https://picsum.photos/seed/<id>/800/450`
- 数据量遵循设计方案 [附录 B](../后台前端设计方案.md#附录-bmock-数据量规划)
- **关联完整性**：`course.teacher_id` 必须指向存在的 teacher；`order.items` 指向存在的 course/product/resource；等等
- `adminUser` 固定写入 `{ id: 1, username: 'admin', password: 'admin', nickname: '超级管理员' }`
- `db.js` 的表默认值全部是 `[]`，seed 后填充
- `window.__db = db` 便于调试

### 1.8 通用 Mock API `src/api/mockApi.js`

按设计方案 §6.2 实现：

```js
export const delay = (ms = 150) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
  async crud(table, params, { searchFields = [], filterFields = [], defaultSort } = {}) { ... },
  async create(table, data) { ... },   // 分配 id(自增)、created_at、updated_at
  async update(table, id, data) { ... }, // 合并 updated_at
  async remove(table, id) { ... },      // 软删除：设置 deleted_at；若表不支持软删，splice
  async findById(table, id) { ... },
}
```

**CRUD 细节**：

- 关键词搜索：`searchFields.some(f => String(row[f] || '').includes(params.keyword))`
- 筛选：`filterFields.forEach(f => params[f] !== undefined && params[f] !== '' → row[f] === params[f])`
- 排序：支持 `params.sort = 'field,asc|desc'`，未指定用 `defaultSort`
- 分页：`params.page`（默认 1）、`params.pageSize`（默认 10），切片
- 软删除过滤：默认 `deleted_at == null`
- 返回 `{ list, total, page, pageSize }`

### 1.9 启动时 seed

在 `src/main.js` 顶部加入：

```js
if (import.meta.env.VITE_USE_MOCK === 'true') {
  const { seed } = await import('@/mock')
  seed()
}
```

注意 `createApp` 前完成 seed。

### 1.10 Pinia Stores 扩展 `src/stores/`

新增/扩展 5 个 store（按设计方案 §八表格）：

| 文件 | state | actions | 持久化 |
|---|---|---|---|
| `user.js`（已存在，重写） | `token / profile / permissions` | `login / logout / fetchProfile` | `token` → localStorage |
| `permission.js`（新） | `menus / dynamicRoutes / generated` | `generateRoutes(menus)` | 否 |
| `app.js`（新） | `sidebarCollapsed / device / theme` | `toggleSidebar / setTheme` | `collapsed` → localStorage |
| `tagsView.js`（新） | `visitedViews / cachedViews` | `addView / delView / delOthersViews / delAllViews` | sessionStorage |
| `dict.js`（新） | `category[] / teacher[] / expressCompany[]` | `loadCategory / loadTeacher / loadExpress`（内部带 TTL 缓存） | sessionStorage |

### 1.11 路由拆分 `src/router/`

- `router/index.js` 只保留白名单：`/login`、`/404`、通配跳 `/404`
- 新建 `router/modules/` 目录，创建 9 个空壳路由文件：`dashboard.js / operation.js / user.js / course.js / resource.js / activity.js / product.js / order.js / system.js`
  - 每个文件 export 一个路由数组（内容为 P0 所属路径的占位组件即可）
  - `component` 用 `() => import('@/views/...')`，目标视图文件可先创建成只含 `<template><div>占位</div></template>` 的占位页
- 新建 `src/permission.js`：
  - `router.beforeEach` 守卫
  - 未登录 → `/login?redirect=...`（白名单放行）
  - 已登录但无 permissions → `await userStore.fetchProfile()` + `GET /admin/menus` → `permissionStore.generateRoutes(menus)` → `router.addRoute(...)` → `next({ ...to, replace: true })`
- 在 `main.js` 引入 `./permission`

### 1.12 Mock admin 接口（为守卫兜底）

新建 `src/api/admin.js`：

```js
export const login = ({ username, password }) => { ... } // mock：admin/admin 返 token 字符串
export const getMyProfile = () => { ... }                 // 返 { id, username, nickname, avatar, permissions: [] }
export const getMyMenus = () => { ... }                   // 返菜单树（设计方案 §9.2）
```

**menus** 按 §9.2 返回完整结构（即使 P0 页面还没做，路径和 meta 也都配齐；path、name、icon、children）。

### 1.13 布局重写 `src/layouts/AdminLayout.vue`

拆成 5 个子组件：

```
src/layouts/
├── AdminLayout.vue         # 壳：左侧栏 + 顶部 + <router-view>
└── components/
    ├── Sidebar.vue         # 消费 permissionStore.menus 渲染 <el-menu>
    ├── Navbar.vue          # 折叠按钮 + 面包屑 + 标签页 + 头像
    ├── Breadcrumb.vue      # 基于 route.matched
    ├── TagsView.vue        # 消费 tagsViewStore
    └── UserDropdown.vue    # 头像下拉（个人信息 / 退出登录）
```

布局主色 `#409EFF`，三段式：侧边栏可折叠、顶部 + 内容区。

### 1.14 全局样式 `src/assets/styles/`

```
styles/
├── index.scss              # 聚合入口（已存在，重写）
├── variables.scss          # $primary / $success / $warning / $danger / $info / 间距 / 字号
├── element-overrides.scss  # Element Plus 微调（圆角、表格 hover…）
└── transitions.scss        # fade / slide 过渡
```

`index.scss` 依次 `@use` variables、overrides、transitions，并写全局 reset（`* { box-sizing: border-box; } body { margin: 0 }` 等）。

### 1.15 登录页与 404 占位

- `src/views/login/index.vue`：账号 / 密码 / 登录按钮。提交 → `userStore.login({ username, password })` → 跳 `redirect || '/dashboard'`
- `src/views/error/404.vue`：新建，居中提示 + 回首页按钮

## 四、文件产出清单

本批次应产出约 **70+ 个文件**，核心清单：

```
.env.development / .env.production
README.md（更新）
src/main.js（改）
src/permission.js（新）
src/utils/{enums,price,date,storage,orderNo}.js
src/api/{request,mockApi,admin}.js
src/mock/{index,db,seed}.js + factories/28 个
src/stores/{user,app,permission,tagsView,dict}.js
src/router/index.js（改）+ modules/9 个
src/layouts/AdminLayout.vue（重写）+ components/5 个
src/assets/styles/{index,variables,element-overrides,transitions}.scss
src/views/login/index.vue（改）
src/views/error/404.vue（新）
src/views/*/index.vue（9 域下每个 P0 路径的占位页）
```

## 五、关键实现细节（不可漏）

1. **字段对齐 DB**：每个 factory 必须覆盖该表所有字段，包括 `id / created_at / updated_at / deleted_at`
2. **id 自增**：mock DB 的每张表维护自增计数器，`mockApi.create` 统一分配
3. **金额只在展示层转元**：mock 数据里必须是整数"分"
4. **时间一律字符串**：`dayjs(faker.date.past()).format('YYYY-MM-DD HH:mm:ss')`
5. **关联完整性**：seed 顺序：字典类 → 用户 → 讲师 → 课程/资源/活动/商品 → 订单 → 订单附属
6. **seed 一次性全量**：不支持热追加；`window.__db` 只读观察
7. **permission 动态路由**：`asyncRoutes` 定义完整 9 域路由，按后端 menus 的 name 集合过滤注入；**未匹配的路由不注入**
8. **不做业务交互**：占位页只需空 `<div>` 或"施工中"文案
9. **不引入 MSW**：所有 mock 走 `api/*.js` 内部分支 `if (VITE_USE_MOCK === 'true')`

## 六、验收标准

| # | 验收点 |
|---|---|
| A1 | `npm run dev` 无报错，端口 5190 能访问 |
| A2 | 访问 `/` → 未登录 → 跳 `/login` |
| A3 | `admin / admin` 登录成功 → 跳 `/dashboard` |
| A4 | 左侧菜单显示 9 个业务域，点击能跳到对应占位页（不白屏） |
| A5 | 顶部有折叠按钮、面包屑、头像下拉；退出登录能回 `/login` |
| A6 | 浏览器控制台 `window.__db` 输出 28 张表，行数符合附录 B |
| A7 | `window.__db.order[0]` 字段齐全，金额是整数，时间是字符串 |
| A8 | `window.__db.course[0].teacher_id` 能在 `window.__db.teacher` 里找到 |
| A9 | 刷新任意已登录页面不会退回 `/login`（token 持久化生效） |
| A10 | 随机访问 `/not-exist` → 404 页面 |

## 七、交接给第 2 批的契约

下一批（公共组件）会直接消费以下稳定产出，**第 1 批交付后这些不得再变**：

1. **`mockApi.crud` 签名**：`crud(table, params, { searchFields, filterFields, defaultSort })` 返回 `{ list, total, page, pageSize }`
2. **列表 params 结构**：`{ page, pageSize, keyword, sort, ...filters }`
3. **`utils/enums.js`** 的字典 key 与 value 结构：`{ label, type? }`
4. **`utils/price.js`** 的 `fen2yuan / yuan2fen` 签名
5. **Pinia `dict` store** 的 `loadCategory / loadTeacher / loadExpress` 返回值结构：`[{ id, name, ... }]`
6. **`stores/user.permissions`** 为字符串数组，指令 `v-permission` 将消费之
7. **axios 响应拦截已返回 `res.data.data`**，业务代码直接拿数据

## 八、风险与注意事项

| 风险 | 应对 |
|---|---|
| seed 耗时过长 | 目标 < 400ms；避免嵌套循环，用 `faker` 但量不爆 |
| 字段对不上 DB | 每写完一个 factory 立刻对照 `datapay_ui/doc/数据库设计文档.md` 自检 |
| 动态路由刷新丢失 | `permission.js` 守卫要在 `next(to, replace)` 之前完成 `addRoute` |
| 标签页 `keep-alive` 串 id | 详情页**不纳入** keep-alive，或按 `name+id` 拼 key |
| Element Plus 中文 | 根 `<el-config-provider :locale="zhCn">` 必须包裹 `<router-view>` |
| 不要实现业务逻辑 | 本批只搭地基，业务表单/表格一律占位 |

## 九、完成后输出

在 PR / 提交描述中附：

- 新增/修改文件数
- `window.__db` 截图（控制台）
- `admin/admin` 登录流程截图
- 运行 `npm run build` 通过无报错
