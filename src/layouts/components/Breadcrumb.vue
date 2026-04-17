<template>
  <!-- 面包屑根据当前匹配路由链动态生成 -->
  <el-breadcrumb separator="/">
    <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="{ path: item.path }">
      {{ item.meta.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 过滤掉没有标题或根路径项，避免出现空白/无意义层级。
const breadcrumbs = computed(() => route.matched.filter((item) => item.meta?.title && item.path !== '/'))
</script>
