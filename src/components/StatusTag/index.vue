<template>
  <span class="dp-status-tag">
    <!-- 字典未命中时兜底展示短横线，避免页面出现空白。 -->
    <el-tag v-if="resolvedItem" :type="resolvedItem.type || ''" disable-transitions>
      {{ resolvedItem.label }}
    </el-tag>
    <span v-else>—</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 字典结构约定为：{ [value]: { label, type } }。
  dict: {
    type: Object,
    default: () => ({}),
  },
  // 允许 number/string，兼容后端返回的数值与字符串两种场景。
  value: {
    type: [Number, String],
    default: '',
  },
})

// 同时尝试原值与字符串值，保证 1 和 '1' 都能命中。
const resolvedItem = computed(() => props.dict?.[props.value] || props.dict?.[String(props.value)] || null)
</script>

<style scoped>
.dp-status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
}
</style>
