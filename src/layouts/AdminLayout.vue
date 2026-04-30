<template>
  <!-- 后台整体布局：左侧菜单 + 右侧顶部栏 + 页面内容区域 -->
  <div class="admin-layout">
    <Sidebar />
    <div class="main-wrapper">
      <Navbar />
      <div class="content-wrapper">
        <!--
          列表页通过 cachedViews（meta.keepAlive!==false 的页面 name）做缓存。
          注意：以前的写法在 keep-alive 内部用 v-if 切换组件，会导致 Vue 3
          缓存判定失效（详情页返回列表页时，列表组件可能被错误销毁/无法显示），
          这里统一让 component 始终位于 keep-alive 内，由 :include 决定是否缓存。
        -->
        <router-view v-slot="{ Component, route }">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.fullPath" />
          </keep-alive>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTagsViewStore } from '@/stores/tagsView'
// 左侧导航与顶部导航拆分成独立组件，便于后续单独维护和复用。
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'

const tagsViewStore = useTagsViewStore()
const cachedViews = computed(() => tagsViewStore.cachedViews)
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
