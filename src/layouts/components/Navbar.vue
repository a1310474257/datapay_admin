<template>
  <!-- 顶部导航：左侧折叠按钮+面包屑，右侧标签页+用户菜单 -->
  <header class="navbar">
    <div class="left">
      <el-button link @click="appStore.toggleSidebar">
        <el-icon><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else /></el-icon>
      </el-button>
      <Breadcrumb />
    </div>
    <div class="right">
      <TagsView />
      <UserDropdown />
    </div>
  </header>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useTagsViewStore } from '@/stores/tagsView'
import Breadcrumb from './Breadcrumb.vue'
import TagsView from './TagsView.vue'
import UserDropdown from './UserDropdown.vue'

const route = useRoute()
const appStore = useAppStore()
const tagsStore = useTagsViewStore()

// 监听当前路由变化，自动将页面加入 tags-view。
watch(
  () => route.fullPath,
  () => {
    tagsStore.addView(route)
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.navbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.right {
  margin-left: auto;
}
</style>
