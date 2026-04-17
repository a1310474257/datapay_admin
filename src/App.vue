<template>
  <!-- 使用 Element Plus 全局配置容器，统一设置中文语言包 -->
  <el-config-provider :locale="zhCn">
    <!-- 根路由出口：登录页与后台布局都在此处切换 -->
    <router-view />
  </el-config-provider>
</template>

<script setup>
// Element Plus 简体中文语言包。
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
