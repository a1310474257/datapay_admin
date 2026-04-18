<template>
  <div class="dp-notice-page">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'notice:create'" type="primary" @click="openDialog()">新建公告</el-button>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'notice:update'" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-permission="'notice:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="visible" :title="form.id ? '编辑公告' : '新建公告'" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <RichEditor v-model="form.content" :height="360" />
        </el-form-item>
        <el-form-item label="发布时间" prop="published_at">
          <el-date-picker
            v-model="form.published_at"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import { STATUS_ENABLE } from '@/utils/enums'
import { createNotice, deleteNotice, getNoticeList, updateNotice } from '@/api/notice'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getNoticeList,
  defaultParams: { keyword: '', status: '' },
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
  { prop: 'title', label: '标题', minWidth: 200 },
  { prop: 'published_at', label: '发布时间', minWidth: 170 },
  { prop: 'status', label: '状态', width: 90, dict: STATUS_ENABLE },
  { prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' },
]

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  title: '',
  content: '',
  published_at: '',
  status: 1,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'change' }],
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function openDialog(row) {
  if (row?.id) {
    Object.assign(form, { ...row })
  } else {
    Object.assign(form, {
      id: null,
      title: '',
      content: '',
      published_at: '',
      status: 1,
    })
  }
  visible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (form.id) {
      await updateNotice(form.id, { ...form })
    } else {
      await createNotice({ ...form })
    }
    ElMessage.success('保存成功')
    visible.value = false
    tableRef.value?.refresh()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    await deleteNotice(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}
</script>
