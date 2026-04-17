<template>
  <!-- 侧边栏基于权限菜单渲染，支持折叠态 -->
  <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <div class="logo">DataPay</div>
    <el-scrollbar class="menu-scroll">
      <el-menu :default-active="route.path" router :collapse="appStore.sidebarCollapsed">
        <template v-for="menu in permissionStore.menus" :key="menu.name">
          <el-menu-item v-if="!menu.children?.length" :index="menu.path">
            <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
            <span>{{ menuTitle(menu.name) }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="menu.path">
            <template #title>
              <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
              <span>{{ menuTitle(menu.name) }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.name" :index="child.path">
              <el-icon><component :is="child.icon || 'Menu'" /></el-icon>
              <span>{{ menuTitle(child.name) }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()

// 路由 name 到中文标题的映射：
// 菜单接口返回 name，这里统一映射展示文案，避免在多个地方重复维护。
const nameMap = {
  Dashboard: '仪表盘',
  Operation: '运营管理',
  OperationCategory: '分类管理',
  OperationBanner: '轮播图',
  OperationNotice: '公告',
  OperationHotSearch: '热搜词',
  User: '用户管理',
  UserList: '用户列表',
  Course: '课程管理',
  CourseTeacher: '讲师',
  CourseList: '课程列表',
  CourseProgress: '学习进度',
  Resource: '资源管理',
  ResourceList: '资源列表',
  Activity: '活动管理',
  ActivityList: '活动列表',
  ActivityRegister: '报名管理',
  Product: '商品管理',
  ProductList: '商品列表',
  Order: '订单管理',
  OrderList: '订单列表',
  OrderRefund: '退款审核',
  OrderPayRecord: '支付流水',
  System: '系统设置',
  SystemProfile: '个人信息',
  SystemAdmin: '管理员',
  SystemRole: '角色权限',
  SystemLog: '操作日志',
}

// 根据菜单 name 获取展示标题，未命中时回退 name 原值。
function menuTitle(name) {
  return nameMap[name] || name
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  transition: width 0.25s;

  &.collapsed {
    width: 64px;
  }
}

.logo {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  color: #409eff;
  font-weight: 700;
  border-bottom: 1px solid #eef2f6;
}

.menu-scroll {
  height: calc(100vh - 56px);
}

.el-menu {
  border-right: none;
}
</style>
