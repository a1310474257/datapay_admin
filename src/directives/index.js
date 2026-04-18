import { permissionDirective } from './permission'

// 统一注册自定义指令，后续扩展只需在此集中维护。
export function setupDirectives(app) {
  app.directive('permission', permissionDirective)
}
