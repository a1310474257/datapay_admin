import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getMyProfile, login as loginApi } from '@/api/admin'
import { getStorageValue, removeStorage, setStorage } from '@/utils/storage'

// token 本地持久化 key，刷新页面后可保持登录态。
const TOKEN_KEY = 'dp_token'

export const useUserStore = defineStore('user', () => {
  // 初始化时优先从 localStorage 读取 token。
  const token = ref(getStorageValue(TOKEN_KEY, ''))
  // profile 存放当前管理员基础信息（昵称、权限等）。
  const profile = ref(null)
  // 权限码数组用于按钮级/路由级权限控制。
  const permissions = ref([])

  // 统一登录态判断，组件中直接使用 isLogin 即可。
  const isLogin = computed(() => Boolean(token.value))

  // 登录流程：换取 token -> 持久化 -> 拉取个人信息。
  async function login(payload) {
    const tokenValue = await loginApi(payload)
    token.value = tokenValue
    setStorage(TOKEN_KEY, tokenValue)
    await fetchProfile()
    return tokenValue
  }

  // 拉取个人信息并同步权限码，供路由守卫和页面权限判断复用。
  async function fetchProfile() {
    const data = await getMyProfile()
    profile.value = data
    permissions.value = data.permissions || []
    return data
  }

  // 退出登录：清空内存与持久化数据，避免脏状态残留。
  function logout() {
    token.value = ''
    profile.value = null
    permissions.value = []
    removeStorage(TOKEN_KEY)
  }

  return {
    token,
    profile,
    permissions,
    isLogin,
    login,
    logout,
    fetchProfile,
  }
})
