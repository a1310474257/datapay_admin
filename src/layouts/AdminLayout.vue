<template>
  <!-- 后台整体布局：左侧菜单 + 右侧顶部栏 + 页面内容区域 -->
  <div class="admin-layout">
    <Sidebar />
    <div class="main-wrapper">
      <Navbar />
      <div class="content-wrapper">
        <!-- 子路由内容渲染出口 -->
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
// 左侧导航与顶部导航拆分成独立组件，便于后续单独维护和复用。
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

.main-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  padding: 16px;
  overflow: auto;
}
</style>
