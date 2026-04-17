<template>
  <div class="dp-operation-category">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <ProTable
      ref="tableRef"
      :columns="columns"
      :load-data="loadData"
      :default-sort="{ prop: 'sort', order: 'ascending' }"
    >
      <template #toolbar-left>
        <el-button type="primary" @click="openCreateDialog">新建分类</el-button>
      </template>

      <template #icon="{ row }">
        <el-image
          :src="row.icon"
          fit="cover"
          style="width: 42px; height: 42px; border-radius: 6px"
          preview-teleported
        />
      </template>

      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="620px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="92px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formModel.name" placeholder="请输入分类名称" />
        </el-form-item>

        <el-form-item label="分类图标" prop="icon">
          <UploadImage
            v-model="formModel.icon"
            folder="category"
            ratio="1:1"
          />
        </el-form-item>

        <el-form-item label="业务类型" prop="business_type">
          <el-select v-model="formModel.business_type" placeholder="请选择业务类型">
            <el-option
              v-for="item in businessTypeOptions"
              :key="`bt-${item.value}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="formModel.sort" :min="1" :max="9999" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="formModel.status"
            :active-value="1"
            :inactive-value="0"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-space>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            保存
          </el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import { CATEGORY_BUSINESS_TYPE, STATUS_ENABLE } from '@/utils/enums'
import { createCategory, deleteCategory, getCategoryList, updateCategory } from '@/api/category'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getCategoryList,
  defaultParams: {
    keyword: '',
    status: '',
    business_type: '',
  },
})

// 搜索项 schema 由 SearchForm 驱动，后续新增字段无需改模板。
const searchSchema = [
  { prop: 'keyword', label: '名称', type: 'input', placeholder: '请输入分类名称' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
  {
    prop: 'business_type',
    label: '业务类型',
    type: 'select',
    options: Object.entries(CATEGORY_BUSINESS_TYPE).map(([value, item]) => ({
      value: Number(value),
      label: item.label,
    })),
  },
]

const columns = [
  { prop: 'id', label: 'ID', width: 80, sortable: true },
  { prop: 'name', label: '分类名称', minWidth: 150 },
  { prop: 'icon', label: '图标', width: 100, slot: 'icon' },
  { prop: 'business_type', label: '业务类型', width: 120, dict: CATEGORY_BUSINESS_TYPE },
  { prop: 'sort', label: '排序', width: 100, sortable: true },
  { prop: 'status', label: '状态', width: 100, dict: STATUS_ENABLE },
  { prop: 'created_at', label: '创建时间', minWidth: 170, sortable: true },
  { prop: 'actions', label: '操作', width: 150, fixed: 'right', slot: 'actions' },
]

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const emptyForm = () => ({
  id: undefined,
  name: '',
  icon: '',
  business_type: 1,
  sort: 1,
  status: 1,
})

const formModel = reactive(emptyForm())

const formRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请上传分类图标', trigger: 'change' }],
  business_type: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  sort: [{ required: true, message: '请输入排序值', trigger: 'change' }],
}

const businessTypeOptions = computed(() =>
  Object.entries(CATEGORY_BUSINESS_TYPE).map(([value, item]) => ({
    value: Number(value),
    label: item.label,
  })),
)

function handleSearchModelUpdate(value) {
  Object.keys(searchParams).forEach((key) => delete searchParams[key])
  Object.assign(searchParams, value || {})
}

function resetForm() {
  Object.assign(formModel, emptyForm())
}

function openCreateDialog() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formModel, {
    id: row.id,
    name: row.name,
    icon: row.icon,
    business_type: row.business_type || 1,
    sort: row.sort || 1,
    status: Number(row.status ?? 1),
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const payload = {
      name: formModel.name,
      icon: formModel.icon,
      business_type: formModel.business_type,
      sort: formModel.sort,
      status: formModel.status,
    }
    if (isEdit.value) {
      await updateCategory(formModel.id, payload)
      ElMessage.success('分类更新成功')
    } else {
      await createCategory(payload)
      ElMessage.success('分类创建成功')
    }
    dialogVisible.value = false
    tableRef.value?.refresh()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除分类“${row.name}”吗？`, '删除提示', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.dp-operation-category {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dp-operation-category :deep(.el-input-number),
.dp-operation-category :deep(.el-select) {
  width: 100%;
}
</style>
