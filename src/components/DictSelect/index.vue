<template>
  <el-select
    class="dp-dict-select"
    :model-value="modelValue"
    :filterable="filterable"
    :multiple="multiple"
    :placeholder="placeholder"
    clearable
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </el-select>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDictStore } from '@/stores/dict'

const props = defineProps({
  dictKey: {
    type: String,
    required: true,
    validator(value) {
      return ['category', 'teacher', 'express'].includes(value)
    },
  },
  modelValue: {
    type: [Number, String, Array],
    default: null,
  },
  filterable: {
    type: Boolean,
    default: true,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
})

const emit = defineEmits(['update:modelValue'])
const dictStore = useDictStore()

// 将组件层 dictKey 映射到 store 中的具体字段名，避免把 store 结构泄漏到外部。
const storeKeyMap = {
  category: 'category',
  teacher: 'teacher',
  express: 'expressCompany',
}

// 将组件层 dictKey 映射到 store 的加载函数。
const loadMap = {
  category: () => dictStore.loadCategory(),
  teacher: () => dictStore.loadTeacher(),
  express: () => dictStore.loadExpress(),
}

const options = computed(() => dictStore[storeKeyMap[props.dictKey]] || [])

onMounted(() => {
  loadMap[props.dictKey]?.()
})
</script>
