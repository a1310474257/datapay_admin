<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <!-- Logo -->
      <div class="logo-wrap" :class="{ collapsed: isCollapse }">
        <div class="logo-icon">
          <el-icon size="20" color="#fff"><DataBoard /></el-icon>
        </div>
        <transition name="fade">
          <span v-if="!isCollapse" class="logo-text">DataPay</span>
        </transition>
      </div>

      <!-- 菜单 -->
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :collapse="isCollapse"
          :collapse-transition="false"
          :default-active="$route.path"
          router
          class="side-menu"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>工作台</template>
          </el-menu-item>

          <el-sub-menu index="user-mgmt">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/users">用户列表</el-menu-item>
            <el-menu-item index="/roles">角色权限</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="finance-mgmt">
            <template #title>
              <el-icon><CreditCard /></el-icon>
              <span>财务管理</span>
            </template>
            <el-menu-item index="/transactions">交易记录</el-menu-item>
            <el-menu-item index="/bills">账单管理</el-menu-item>
            <el-menu-item index="/withdraw">提现申请</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="data-mgmt">
            <template #title>
              <el-icon><TrendCharts /></el-icon>
              <span>数据报表</span>
            </template>
            <el-menu-item index="/reports/daily">日报</el-menu-item>
            <el-menu-item index="/reports/monthly">月报</el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>系统设置</template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>

      <!-- 折叠按钮 -->
      <div class="collapse-trigger" @click="isCollapse = !isCollapse">
        <el-icon><DArrowLeft v-if="!isCollapse" /><DArrowRight v-else /></el-icon>
      </div>
    </el-aside>

    <el-container class="main-container">
      <!-- 顶部导航栏 -->
      <el-header class="topbar">
        <div class="topbar-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <!-- 全屏 -->
          <el-tooltip content="全屏" placement="bottom">
            <div class="action-btn" @click="toggleFullscreen">
              <el-icon size="18"><FullScreen /></el-icon>
            </div>
          </el-tooltip>

          <!-- 通知 -->
          <el-tooltip content="消息通知" placement="bottom">
            <div class="action-btn">
              <el-badge :value="5" :max="99">
                <el-icon size="18"><Bell /></el-icon>
              </el-badge>
            </div>
          </el-tooltip>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-avatar-wrap">
              <div class="user-avatar">
                {{ userStore.userInfo?.name?.charAt(0) }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ userStore.userInfo?.name }}</span>
                <span class="user-role">管理员</span>
              </div>
              <el-icon size="12" class="arrow-icon"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><UserFilled /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon> 账号设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>

      <!-- 底部 -->
      <el-footer class="footer" height="40px">
        <span>© 2026 DataPay · 数据支付管理平台 · v1.0.0</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)
const currentRoute = route

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

async function handleCommand(cmd) {
  if (cmd === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('已安全退出')
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: #1e1e2d;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  overflow: hidden;
  position: relative;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

.logo-wrap {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;

  &.collapsed {
    justify-content: center;
    padding: 0;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 18px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 2px;
    white-space: nowrap;
  }
}

.menu-scrollbar {
  flex: 1;
}

.side-menu {
  border: none;
  background: transparent;

  :deep(.el-menu-item) {
    color: #a0a0b8;
    height: 48px;
    margin: 2px 8px;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: rgba(99, 102, 241, 0.12) !important;
      color: #fff !important;
    }

    &.is-active {
      background: rgba(99, 102, 241, 0.2) !important;
      color: #a5b4fc !important;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: #6366f1;
        border-radius: 0 3px 3px 0;
      }
    }
  }

  :deep(.el-sub-menu__title) {
    color: #a0a0b8;
    height: 48px;
    margin: 2px 8px;
    border-radius: 8px;

    &:hover {
      background: rgba(99, 102, 241, 0.12) !important;
      color: #fff !important;
    }
  }

  :deep(.el-sub-menu .el-menu-item) {
    padding-left: 52px !important;
    height: 40px;
    font-size: 13px;
  }

  :deep(.el-menu--inline) {
    background: rgba(0, 0, 0, 0.1) !important;
    border-radius: 8px;
    margin: 0 8px;
  }
}

.collapse-trigger {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #5c5c7a;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #a0a0b8;
    background: rgba(255, 255, 255, 0.04);
  }
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.topbar {
  height: 60px !important;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f5;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
  z-index: 10;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f5f5ff;
    color: #6366f1;
  }
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5ff;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
  }

  .user-meta {
    display: flex;
    flex-direction: column;

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.3;
    }

    .user-role {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
    }
  }

  .arrow-icon {
    color: #9ca3af;
  }
}

.main-content {
  background: #f4f6fb;
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #f0f0f5;
  font-size: 12px;
  color: #c0c0d0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.2s ease;
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
}
</style>
