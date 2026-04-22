# DataPay Admin

DataPay 后台管理前端：基于 Vue 3 与 Vite 的单页应用，用于运营配置、课程与订单等业务管理。

## 技术栈

- Vue 3 + Vite 5
- Element Plus（中文 `zhCn` 语言包）
- Vue Router 4（HTML5 History 模式）
- Pinia
- ECharts 6
- SCSS
- Axios、Day.js；图标 `@element-plus/icons-vue`；富文本 `@wangeditor`；本地 Mock 使用 `@faker-js/faker`

## 本地开发

```bash
npm install
npm run dev
```

- 开发地址：`http://localhost:5190`
- 开发服务器：`host` 为 `0.0.0.0`，便于局域网访问

## 构建与预览

```bash
npm run build
npm run preview
```

## 目录结构

```text
src/
├── api/              # 接口封装；在 VITE_USE_MOCK=true 时可走 mockApi / 内存数据
├── assets/styles/    # 全局样式与 Element Plus 覆盖
├── components/       # 可复用业务与通用组件
├── directives/       # 自定义指令（如权限）
├── hooks/            # 组合式函数（表格、上传、字典等）
├── layouts/          # 后台主布局（侧栏、顶栏、标签页等）
├── mock/             # 内存数据库、种子数据与 factories
├── router/           # 路由与按模块拆分的路由表
├── stores/           # Pinia 状态
├── utils/            # 工具函数（存储、价格、日期等）
└── views/            # 页面视图（登录、仪表盘、用户、课程、订单、运营等）
```

## 环境变量

在项目根目录通过 `.env.development` / `.env.production` 配置（示例值以仓库内文件为准）：

- `VITE_API_BASE`：Axios 请求的 `baseURL`（如 `/api`）
- `VITE_USE_MOCK`：为 `true` 时使用内存 Mock；为 `false` 时请求走真实后端（需代理或同域 API）

路径别名：`@` 指向 `src/`。
