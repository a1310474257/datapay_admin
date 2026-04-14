import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('dp_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('dp_userInfo') || 'null'))

  function login(username, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          const mockToken = 'dp-token-' + Date.now()
          const mockUser = {
            id: 1,
            name: '超级管理员',
            username: 'admin',
            email: 'admin@datapay.com',
            role: 'admin',
            avatar: ''
          }
          token.value = mockToken
          userInfo.value = mockUser
          localStorage.setItem('dp_token', mockToken)
          localStorage.setItem('dp_userInfo', JSON.stringify(mockUser))
          resolve(mockUser)
        } else {
          reject(new Error('账号或密码错误，请重试'))
        }
      }, 800)
    })
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('dp_token')
    localStorage.removeItem('dp_userInfo')
  }

  return { token, userInfo, login, logout }
})
