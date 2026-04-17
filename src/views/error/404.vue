<template>
  <div class="error-page">
    <el-result icon="warning" title="404" sub-title="页面不存在">
      <template #extra>
        <el-button type="primary" @click="$router.push('/dashboard')">回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
}
</style>
