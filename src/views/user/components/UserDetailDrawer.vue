<template>
  <el-drawer :model-value="visible" title="用户详情" size="520px" @close="emit('update:visible', false)">
    <div class="dp-user-detail">
      <div class="avatar-wrap">
        <el-avatar :size="72" :src="detail?.avatar" />
      </div>
      <el-descriptions border :column="1">
        <el-descriptions-item label="昵称">{{ detail?.nickname || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail?.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ detail?.openid || '—' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ detail?.gender || '—' }}</el-descriptions-item>
        <el-descriptions-item label="生日">{{ detail?.birthday || '—' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detail?.created_at || '—' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ detail?.last_login_at || '—' }}</el-descriptions-item>
      </el-descriptions>
    </div>
  </el-drawer>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible'])
</script>

<style scoped>
.avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
</style>
