import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/stores/user'

// 生成请求追踪 ID，用于后端日志排查同一请求链路。
function generateRequestId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`
}

// Axios 实例：统一基础地址、超时、鉴权头、错误处理。
// 约定：dev 下通过 Vite 代理转发 /api -> 后端 http://127.0.0.1:8900
// 后端响应结构为 { code, message, data }，其中 code === 200 代表成功。
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const userStore = useUserStore()
  config.headers = config.headers || {}
  // 约定使用 Bearer Token 传递登录态。
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  } else {
    delete config.headers.Authorization
  }
  config.headers['X-Request-Id'] = generateRequestId()

  // GET 请求参数清洗：移除 undefined 与空字符串，避免产生无意义查询条件。
  if (String(config.method || '').toLowerCase() === 'get' && config.params) {
    const cleanParams = {}
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') cleanParams[key] = value
    })
    config.params = cleanParams
  }

  return config
})

// 统一登出 + 跳转登录页
function redirectToLogin() {
  const userStore = useUserStore()
  userStore.logout()
  const current = router.currentRoute.value
  if (current && current.path !== '/login') {
    const redirect = encodeURIComponent(current.fullPath)
    router.replace(`/login?redirect=${redirect}`)
  }
}

request.interceptors.response.use(
  (response) => {
    const payload = response.data || {}
    const { code, message, data } = payload

    // DataPay 统一成功码
    if (code === 200 || code === 0) {
      return data
    }

    // 30xxx 段 = 鉴权相关（Spring Security 直接抛 401 时由下方错误分支处理）
    if (code === 30001 || code === 30002) {
      redirectToLogin()
      return Promise.reject(new Error(message || '登录状态失效'))
    }
    if (code === 30003) {
      ElMessage.error(message || '权限不足')
      return Promise.reject(new Error(message || '权限不足'))
    }

    // 其余业务错误统一提示并抛出
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    // Spring Security 的 401 会直接在 HTTP 层返回
    const status = error?.response?.status
    if (status === 401) {
      ElMessage.error('请先登录')
      redirectToLogin()
      return Promise.reject(error)
    }
    if (status === 403) {
      ElMessage.error('权限不足')
      return Promise.reject(error)
    }
    // 后端自定义业务异常会被 GlobalExceptionHandler 处理成 HTTP 200 + code !=200
    // 这里兜底处理其它网络/网关错误
    const backendMsg = error?.response?.data?.message
    ElMessage.error(backendMsg || error?.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

export default request
