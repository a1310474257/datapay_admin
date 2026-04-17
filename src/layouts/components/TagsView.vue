<template>
  <!-- 历史访问标签页，支持点击跳转和关闭 -->
  <div class="tags-view">
    <el-tag
      v-for="item in tagsStore.visitedViews"
      :key="item.path"
      :type="item.path === route.path ? 'primary' : 'info'"
      effect="plain"
      closable
      @close="closeTag(item.path)"
      @click="go(item.path)"
    >
      {{ item.title }}
    </el-tag>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useTagsViewStore } from '@/stores/tagsView'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsViewStore()

// 点击标签后跳转到对应路由。
function go(path) {
  router.push(path)
}

// 关闭标签：
// - 从 store 删除；
// - 如果关闭的是当前页，则回到默认首页防止页面空白。
function closeTag(path) {
  tagsStore.delView(path)
  if (route.path === path) {
    router.push('/dashboard')
  }
}
</script>

<style lang="scss" scoped>
.tags-view {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.el-tag {
  cursor: pointer;
}
</style>
