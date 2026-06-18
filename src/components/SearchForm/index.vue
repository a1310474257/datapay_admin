<template>
  <div class="dp-search-form">
    <el-form label-width="88px" @submit.prevent="emitSearch" @keyup.enter="emitSearch">
      <div class="search-form-row">
        <div
          v-for="item in schema"
          :key="`field-${item.prop}`"
          class="search-form-item"
          :style="getItemStyle(item)"
        >
          <el-form-item :label="item.label">
            <template v-if="item.type === 'input'">
              <el-input
                :model-value="formModel[item.prop]"
                :placeholder="item.placeholder || `请输入${item.label}`"
                clearable
                @update:model-value="(value) => updateField(item.prop, value)"
              />
            </template>

            <template v-else-if="item.type === 'select'">
              <el-select
                :model-value="formModel[item.prop]"
                :placeholder="item.placeholder || `请选择${item.label}`"
                clearable
                @update:model-value="(value) => updateField(item.prop, value)"
              >
                <el-option
                  v-for="opt in item.options || []"
                  :key="`opt-${item.prop}-${opt.value}`"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </template>

            <template v-else-if="item.type === 'dict-select'">
              <DictSelect
                :dict-key="item.dictKey"
                :model-value="formModel[item.prop]"
                :multiple="item.multiple || false"
                :placeholder="item.placeholder || `请选择${item.label}`"
                @update:model-value="(value) => updateField(item.prop, value)"
              />
            </template>

            <template v-else-if="item.type === 'date'">
              <el-date-picker
                type="date"
                value-format="YYYY-MM-DD"
                :model-value="formModel[item.prop]"
                :placeholder="item.placeholder || `请选择${item.label}`"
                @update:model-value="(value) => updateField(item.prop, value)"
              />
            </template>

            <template v-else-if="item.type === 'daterange'">
              <el-date-picker
                type="daterange"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :model-value="formModel[item.prop]"
                @update:model-value="(value) => updateField(item.prop, value)"
              />
            </template>

            <template v-else-if="item.type === 'switch'">
              <el-switch
                :model-value="formModel[item.prop]"
                @update:model-value="(value) => updateField(item.prop, value)"
              />
            </template>
          </el-form-item>
        </div>

        <div class="action-col">
          <el-space>
            <el-button type="primary" @click="emitSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-space>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import DictSelect from '@/components/DictSelect/index.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  schema: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'search'])
const formModel = reactive({})

// 外部 modelValue 变化时回灌，支持父组件在 reset 时直接改值。
watch(
  () => props.modelValue,
  (value) => {
    Object.keys(formModel).forEach((key) => delete formModel[key])
    Object.assign(formModel, value || {})
  },
  { immediate: true, deep: true },
)

function updateField(prop, value) {
  formModel[prop] = value
  emit('update:modelValue', { ...formModel })
}

function emitSearch() {
  emit('search')
}

function getItemStyle(item = {}) {
  const explicitWidth = Number(item.width || 0)
  const span = Number(item.span || 0)
  let width = item.type === 'daterange' ? 360 : 280
  if (span >= 8) width = 360
  if (explicitWidth > 0) width = explicitWidth
  return {
    flex: `1 1 ${width}px`,
    maxWidth: `${Math.max(width, 280)}px`,
  }
}

function getResetValue(type) {
  if (type === 'switch') return false
  if (type === 'daterange') return []
  return ''
}

function handleReset() {
  props.schema.forEach((item) => {
    formModel[item.prop] = getResetValue(item.type)
  })
  emit('update:modelValue', { ...formModel })
  emit('search')
}
</script>

<style scoped>
.dp-search-form {
  padding: 16px 16px 4px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: #fff;
  margin-bottom: 12px;
}

.search-form-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 18px;
}

.search-form-item {
  min-width: 260px;
}

.action-col {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-start;
  align-items: flex-start;
  padding-top: 1px;
}

.dp-search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.dp-search-form :deep(.el-select),
.dp-search-form :deep(.el-date-editor),
.dp-search-form :deep(.el-input) {
  width: 100%;
}
</style>
