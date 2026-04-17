<template>
  <div class="dp-price-input">
    <!-- 使用数字输入框承载“元”视图值，组件外仍然维护“分”作为真实值。 -->
    <el-input-number
      v-model="displayYuan"
      :min="yuanMin"
      :max="yuanMax"
      :precision="precision"
      :step="step"
      :placeholder="placeholder"
      controls-position="right"
      @change="emitFenValue"
      @blur="emitFenValue(displayYuan)"
    />
    <span class="prefix">¥</span>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { fen2yuan, yuan2fen } from '@/utils/price'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
  min: {
    type: Number,
    default: undefined,
  },
  max: {
    type: Number,
    default: undefined,
  },
  precision: {
    type: Number,
    default: 2,
  },
  placeholder: {
    type: String,
    default: '请输入金额',
  },
})

const emit = defineEmits(['update:modelValue'])

// 内部维护“元”数值，输入体验更自然。
const displayYuan = ref(Number(fen2yuan(props.modelValue)))

// 根据精度计算步长，例如 precision=2 时步长为 0.01。
const step = computed(() => 1 / Math.pow(10, props.precision || 2))
const yuanMin = computed(() => (props.min === undefined ? undefined : Number(fen2yuan(props.min))))
const yuanMax = computed(() => (props.max === undefined ? undefined : Number(fen2yuan(props.max))))

watch(
  () => props.modelValue,
  (value) => {
    const next = Number(fen2yuan(value))
    // 做等值判断，避免 v-model 回写时出现无意义循环更新。
    if (displayYuan.value !== next) {
      displayYuan.value = next
    }
  },
)

function emitFenValue(rawValue) {
  const normalized = Number.isFinite(Number(rawValue)) ? Number(rawValue) : 0
  let fenValue = yuan2fen(normalized)

  // 在 emit 前做上下限钳制，确保最终提交值合法。
  if (typeof props.min === 'number') {
    fenValue = Math.max(fenValue, props.min)
  }
  if (typeof props.max === 'number') {
    fenValue = Math.min(fenValue, props.max)
  }

  const clampedYuan = Number(fen2yuan(fenValue))
  if (displayYuan.value !== clampedYuan) {
    displayYuan.value = clampedYuan
  }
  emit('update:modelValue', fenValue)
}
</script>

<style scoped>
.dp-price-input {
  position: relative;
  width: 100%;
}

.dp-price-input :deep(.el-input-number) {
  width: 100%;
}

.prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--el-text-color-secondary);
  pointer-events: none;
}

.dp-price-input :deep(.el-input__inner) {
  padding-left: 26px;
}
</style>
