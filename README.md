# DataPay Admin 管理后台

DataPay Admin 是一个基于 Vue 3 的后台管理系统，用于用户、财务与报表相关业务管理。

## 技术栈

- Vue 3 + Vite 5
- Element Plus（中文语言包 `zhCn`）
- Vue Router 4
- Pinia
- ECharts 6
- SCSS

## 环境要求

- Node.js 18 及以上
- npm 9 及以上

## 快速开始

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

- 默认 Host：`0.0.0.0`
- 默认端口：`5190`

### 打包生产环境

```bash
npm run build
```

### 本地预览生产包

```bash
npm run preview
```

## 项目目录结构

```text
src/
├── assets/                # 全局静态资源与样式
│   └── styles/index.scss
├── components/            # 可复用公共组件
├── layouts/               # 布局组件
│   └── AdminLayout.vue
├── router/                # 路由配置与导航守卫
│   └── index.js
├── stores/                # Pinia 状态管理
│   └── user.js
└── views/                 # 页面视图（按业务模块划分）
    ├── login/
    ├── dashboard/
    ├── users/
    ├── transactions/
    ├── bills/
    ├── withdraw/
    ├── reports/
    └── settings/
```

## 核心业务模块

- 用户管理：`/users`、`/roles`
- 财务管理：`/transactions`、`/bills`、`/withdraw`
- 数据报表：`/reports/daily`、`/reports/monthly`
- 系统设置：`/settings`

## 常用脚本

- `npm run dev`：启动本地开发服务
- `npm run build`：构建生产环境资源
- `npm run preview`：本地预览生产构建结果

## 说明

- 路径别名 `@` 指向 `src/`。
- 图标库 `@element-plus/icons-vue` 在应用入口中全局注册。
