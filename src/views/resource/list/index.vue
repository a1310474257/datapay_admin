<template>
  <div class="dp-resource-list">
    <el-card class="tab-card" shadow="never">
      <el-tabs v-model="resTab" @tab-change="onTabChange">
        <el-tab-pane label="HR工具" name="1" />
        <el-tab-pane label="调研报告" name="2" />
      </el-tabs>
    </el-card>

    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'resource:create'" type="primary" @click="openDialog()">新建资源</el-button>
      </template>
      <template #cover="{ row }">
        <el-image :src="row.cover" style="width: 48px; height: 48px; border-radius: 6px" />
      </template>
      <template #price="{ row }">
        <span>{{ isFreeRow(row) ? '免费' : `¥ ${fen2yuan(row.price)}` }}</span>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'resource:update'" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-permission="'resource:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑资源' : '新建资源'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="封面" prop="cover">
          <UploadImage v-model="form.cover" folder="resource" ratio="16:9" />
        </el-form-item>
        <el-form-item label="资源类型" prop="resource_type">
          <el-radio-group v-model="form.resource_type" :disabled="!!form.id">
            <el-radio :label="1">HR工具</el-radio>
            <el-radio :label="2">调研报告</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="文件类型" prop="file_type">
          <el-select v-model="form.file_type">
            <el-option label="PDF" value="PDF" />
            <el-option label="DOCX" value="DOCX" />
            <el-option label="ZIP" value="ZIP" />
            <el-option label="MP4" value="MP4" />
          </el-select>
        </el-form-item>
        <el-form-item label="主文件" prop="file_url">
          <!-- use-object-key：上传后存 objectKey 而非公开 URL，后端经 /api/file/{objectKey} 代理下载 -->
          <UploadFile v-model="form.file_url" use-object-key />
        </el-form-item>
        <el-form-item label="预览文件" prop="preview_url">
          <!-- 预览文件公开可访问，存完整 URL 即可 -->
          <UploadFile v-model="form.preview_url" accept=".pdf" />
        </el-form-item>
        <el-form-item label="预览页数" prop="preview_pages">
          <el-input-number v-model="form.preview_pages" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="原价(分)" prop="original_price">
          <el-input-number v-model="form.original_price" :min="0" :max="99999900" @change="onPriceChange" />
        </el-form-item>
        <el-form-item label="售价(分)" prop="price">
          <el-input-number v-model="form.price" :min="0" :max="99999900" :disabled="isFreeForm" />
          <el-alert v-if="isFreeForm" class="mt" title="已设为免费资源，售价锁定为 0" type="success" :closable="false" />
        </el-form-item>
        <el-form-item label="更新日期" prop="update_time">
          <el-date-picker v-model="form.update_time" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
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
import UploadFile from '@/components/UploadFile/index.vue'
import { RESOURCE_TYPE, STATUS_ENABLE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { createResource, deleteResource, getResourceList, updateResource } from '@/api/resource'
import { useTable } from '@/hooks/useTable'

const resTab = ref('1')

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getResourceList,
  defaultParams: {
    keyword: '',
    status: '',
    resource_type: 1,
  },
})

const searchSchema = [
  { prop: 'keyword', label: '标题', type: 'input' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'cover', label: '封面', width: 90, slot: 'cover' },
  { prop: 'title', label: '标题', minWidth: 160 },
  { prop: 'resource_type', label: '类型', width: 110, dict: RESOURCE_TYPE },
  { prop: 'file_type', label: '文件类型', width: 100 },
  { prop: 'price', label: '售价', width: 110, slot: 'price' },
  { prop: 'update_time', label: '更新日期', width: 120 },
  { prop: 'status', label: '状态', width: 90, dict: STATUS_ENABLE },
  { prop: 'actions', label: '操作', width: 160, fixed: 'right', slot: 'actions' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  cover: '',
  resource_type: 1,
  file_type: 'PDF',
  file_url: '',
  preview_url: '',
  preview_pages: 0,
  original_price: 0,
  price: 0,
  update_time: '',
  status: 1,
  brief: '',
  description: '',
  file_size: '',
  pages: 0,
  downloads: 0,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面', trigger: 'change' }],
  file_url: [{ required: true, message: '请上传主文件', trigger: 'change' }],
}

const isFreeForm = computed(() => Number(form.original_price) === 0)

function isFreeRow(row) {
  return Number(row.original_price) === 0
}

function onPriceChange() {
  if (Number(form.original_price) === 0) {
    form.price = 0
  }
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function onTabChange() {
  searchParams.resource_type = Number(resTab.value)
  tableRef.value?.setParams({ ...searchParams, resource_type: Number(resTab.value) })
  tableRef.value?.refresh()
}

function openDialog(row) {
  if (row?.id) {
    Object.assign(form, {
      ...row,
    })
  } else {
    Object.assign(form, {
      id: null,
      title: '',
      cover: '',
      resource_type: Number(resTab.value),
      file_type: 'PDF',
      file_url: '',
      preview_url: '',
      preview_pages: 0,
      original_price: 9900,
      price: 4900,
      update_time: '',
      status: 1,
      brief: '',
      description: '',
      file_size: '1MB',
      pages: 10,
      downloads: 0,
    })
  }
  dialogVisible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (Number(form.original_price) === 0) form.price = 0
  submitting.value = true
  try {
    if (form.id) {
      await updateResource(form.id, { ...form })
    } else {
      await createResource({ ...form })
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    tableRef.value?.refresh()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除「${row.title}」？`, '提示', { type: 'warning' })
    await deleteResource(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}
</script>

<style scoped>
.tab-card {
  margin-bottom: 12px;
}

.mt {
  margin-top: 8px;
}
</style>
