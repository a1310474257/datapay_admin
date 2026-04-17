import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 生成请求追踪 ID，用于后端日志排查同一请求链路。
function generateRequestId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`
}

// Axios 实例：统一基础地址、超时、鉴权头、错误处理。
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000,
})

request.interceptors.request.use((config) => {
  const userStore = useUserStore()
  config.headers = config.headers || {}
  // 约定使用 Bearer Token 传递登录态。
  config.headers.Authorization = userStore.token ? `Bearer ${userStore.token}` : ''
  // 为每个请求附加唯一 ID，便于网关与后端链路追踪。
  config.headers['X-Request-Id'] = generateRequestId()

  // GET 请求参数清洗：移除 undefined 与空字符串，避免产生无意义查询条件。
  if (String(config.method || '').toLowerCase() == 'get' && config.params) {
    const cleanParams = {}
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') cleanParams[key] = value
    })
    config.params = cleanParams
  }

  return config
})

request.interceptors.response.use(
  (response) => {
    // 统一响应结构约定：{ code, message, data }。
    const payload = response.data || {}
    const { code, message, data } = payload
    if (code === 0) return data

    // 1002: 登录失效，清空本地状态并跳登录页。
    if (code === 1002) {
      const userStore = useUserStore()
      userStore.logout()
      const redirect = encodeURIComponent(router.currentRoute.value.fullPath)
      router.replace(`/login?redirect=${redirect}`)
      return Promise.reject(new Error(message || '登录状态失效'))
    }

    // 1003: 权限不足，提示后由页面决定后续处理。
    if (code === 1003) {
      ElMessage.error(message || '权限不足')
      return Promise.reject(new Error(message || '权限不足'))
    }

    // 其余业务错误统一提示，并抛出错误供调用方 catch。
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    // 网络/超时/网关错误统一在此兜底。
    ElMessage.error('网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

export default request
