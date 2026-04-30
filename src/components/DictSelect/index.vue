<template>
  <el-select
    class="dp-dict-select"
    :model-value="modelValue"
    :filterable="filterable"
    :multiple="multiple"
    :placeholder="placeholder"
    :loading="loading"
    clearable
    @visible-change="onDropdownVisibleChange"
    @update:model-value="handleUpdate"
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
import { computed, onMounted, ref } from 'vue'
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

const emit = defineEmits(['update:modelValue', 'change'])
const dictStore = useDictStore()
/** 下拉展开从服务端刷新字典时的 loading（分类、讲师走接口） */
const loading = ref(false)

// 将组件层 dictKey 映射到 store 中的具体字段名，避免把 store 结构泄漏到外部。
const storeKeyMap = {
  category: 'category',
  teacher: 'teacher',
  express: 'expressCompany',
}

// 将组件层 dictKey 映射到 store 的加载函数（需向下传递 force 等选项）。
const loadMap = {
  category: (opt) => dictStore.loadCategory(opt),
  teacher: (opt) => dictStore.loadTeacher(opt),
  express: (opt) => dictStore.loadExpress(opt),
}

const options = computed(() => dictStore[storeKeyMap[props.dictKey]] || [])

onMounted(() => {
  runLoad({ force: false })
})

/**
 * 展开下拉时强制拉最新字典（便于后台新增分类/讲师后立即可选）。
 * 快递公司仍为本地枚举，仅首次缓存加载。
 */
async function onDropdownVisibleChange(visible) {
  if (!visible) return
  await runLoad({ force: props.dictKey !== 'express' })
}

async function runLoad({ force }) {
  const loader = loadMap[props.dictKey]
  if (!loader) return
  loading.value = true
  try {
    await loader({ force })
  } finally {
    loading.value = false
  }
}

function handleUpdate(value) {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
