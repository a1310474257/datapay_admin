<template>
  <!-- 用户下拉菜单：头像、昵称、个人信息入口、退出登录 -->
  <el-dropdown @command="onCommand">
    <span class="trigger">
      <el-avatar :size="30">{{ userStore.profile?.nickname?.slice(0, 1) || 'A' }}</el-avatar>
      <span class="name">{{ userStore.profile?.nickname || '管理员' }}</span>
      <el-icon><ArrowDown /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="profile">Profile</el-dropdown-item>
        <el-dropdown-item command="logout" divided>Logout</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

// 统一处理下拉菜单命令，避免模板内出现复杂分支逻辑。
function onCommand(command) {
  if (command === 'profile') {
    router.push('/system/profile')
    return
  }
  if (command === 'logout') {
    // 退出时同时清空用户信息与动态路由状态，确保重新登录后按新权限加载。
    userStore.logout()
    permissionStore.resetRoutes()
    ElMessage.success('Logged out')
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.name {
  font-size: 14px;
  color: #374151;
}
</style>
