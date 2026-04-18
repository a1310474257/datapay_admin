<template>
  <div class="dp-system-role">
    <el-card header="角色与权限（Mock）">
      <el-table :data="roles" border>
        <el-table-column prop="name" label="角色" width="160" />
        <el-table-column prop="desc" label="说明" />
        <el-table-column label="权限数" width="100">
          <template #default="{ row }">{{ row.permissions?.length || 0 }}</template>
        </el-table-column>
      </el-table>
      <el-divider />
      <p class="hint">当前登录为超级管理员，拥有全部菜单与按钮权限；真实环境由后端下发 permissions。</p>
    </el-card>
  </div>
</template>

<script setup>
const roles = [
  {
    name: '超级管理员',
    desc: '全部模块与按钮权限',
    permissions: ['*'],
  },
  {
    name: '运营',
    desc: '运营、课程、活动、订单只读',
    permissions: ['Operation', 'Course', 'Activity', 'Order'],
  },
  {
    name: '财务',
    desc: '订单、退款、支付流水',
    permissions: ['Order', 'OrderRefund', 'OrderPayRecord'],
  },
]
</script>

<style scoped>
.hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
