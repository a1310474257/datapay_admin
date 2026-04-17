<template>
  <div class="dp-address-snap-view">
    <el-descriptions border :column="2">
      <el-descriptions-item
        v-for="field in fields"
        :key="`field-${field.key}`"
        :label="field.label"
      >
        {{ getValue(field.key) }}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup>
const props = defineProps({
  snap: {
    type: Object,
    default: () => ({}),
  },
})

// 统一地址快照展示字段，避免每个页面重复拼装。
const fields = [
  { key: 'name', label: '收件人' },
  { key: 'phone', label: '手机号' },
  { key: 'province', label: '省份' },
  { key: 'city', label: '城市' },
  { key: 'district', label: '区县' },
  { key: 'detail', label: '详细地址' },
  { key: 'zip_code', label: '邮编' },
]

function getValue(key) {
  return props.snap?.[key] || '—'
}
</script>

<style scoped>
.dp-address-snap-view {
  width: 100%;
}
</style>
