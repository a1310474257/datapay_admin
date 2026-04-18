import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './permission'
import './assets/styles/index.scss'
import { setupDirectives } from './directives'

// 项目统一入口：
// 1. 根据环境变量决定是否初始化 Mock 数据；
// 2. 创建 Vue 应用并注册 Pinia、Router、Element Plus；
// 3. 全局注册 Element Plus 图标，避免在页面中逐个引入。
async function bootstrap() {
  // 本地开发模式下可通过 VITE_USE_MOCK=true 启用内存数据库。
  if (import.meta.env.VITE_USE_MOCK === 'true') {
    const { seed } = await import('@/mock')
    // 首次进入时注入一份完整业务数据，便于页面联调。
    seed()
  }

  const app = createApp(App)
  const pinia = createPinia()

  // 将所有 Element Plus 图标组件注册为全局组件，
  // 模板里可以直接使用 <UserFilled /> 这类图标标签。
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  // 插件注册顺序保持稳定，最后挂载到根节点。
  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)
  // 第3批开始引入按钮级权限指令（v-permission）。
  setupDirectives(app)
  app.mount('#app')
}

// 启动应用（保持 async 入口，便于后续接入异步初始化流程）。
bootstrap()
