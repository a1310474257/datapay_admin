<template>
  <div class="dp-teacher-page">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'teacher:create'" type="primary" @click="openCreateDialog">新增讲师</el-button>
      </template>
      <template #avatar="{ row }">
        <el-avatar :src="resolveTeacherAvatar(row.avatar)" :size="34" />
      </template>
      <template #brief="{ row }">
        <el-tooltip :content="row.brief || row.intro || '—'" placement="top">
          <span class="ellipsis">{{ row.brief || row.intro || '—' }}</span>
        </el-tooltip>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'teacher:update'" link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button v-permission="'teacher:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑讲师' : '新增讲师'" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="90px">
        <el-form-item label="头像" prop="avatar">
          <UploadImage v-model="formModel.avatar" folder="teacher" ratio="1:1" use-object-key />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formModel.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-input v-model="formModel.title" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="简介" prop="brief">
          <el-input v-model="formModel.brief" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formModel.sort" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="formModel.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-space>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
        </el-space>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import { STATUS_ENABLE } from '@/utils/enums'
import { createTeacher, deleteTeacher, getTeacherList, updateTeacher } from '@/api/teacher'
import { useTable } from '@/hooks/useTable'
import { useDictStore } from '@/stores/dict'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'

const dictStore = useDictStore()
const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getTeacherList,
  defaultParams: {
    keyword: '',
    status: '',
  },
})

const searchSchema = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '姓名/职称/简介' },
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
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'avatar', label: '头像', width: 90, slot: 'avatar' },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'title', label: '职称', minWidth: 160 },
  { prop: 'brief', label: '简介', minWidth: 220, slot: 'brief' },
  { prop: 'status', label: '状态', width: 100, dict: STATUS_ENABLE },
  { prop: 'sort', label: '排序', width: 90 },
  { prop: 'created_at', label: '创建时间', minWidth: 170 },
  { prop: 'actions', label: '操作', width: 150, fixed: 'right', slot: 'actions' },
]

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const formModel = reactive({
  id: undefined,
  avatar: '',
  name: '',
  title: '',
  brief: '',
  sort: 1,
  status: 1,
})

const formRules = {
  avatar: [{ required: true, message: '请上传讲师头像', trigger: 'change' }],
  name: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }],
  title: [{ required: true, message: '请输入讲师职称', trigger: 'blur' }],
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function resetForm() {
  Object.assign(formModel, {
    id: undefined,
    avatar: '',
    name: '',
    title: '',
    brief: '',
    sort: 1,
    status: 1,
  })
}

/**
 * 讲师头像地址解析：
 * 1. 兼容历史 http(s)/data 直链；
 * 2. objectKey 统一通过后端 /api/file 中转访问，避免前端直连对象存储。
 */
function resolveTeacherAvatar(value) {
  return resolveMediaPreviewUrl(value)
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
    avatar: row.avatar,
    name: row.name,
    title: row.title,
    brief: row.brief || row.intro || '',
    sort: Number(row.sort || 1),
    status: Number(row.status ?? 1),
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      avatar: formModel.avatar,
      name: formModel.name,
      title: formModel.title,
      brief: formModel.brief,
      sort: formModel.sort,
      status: formModel.status,
    }
    if (isEdit.value) {
      await updateTeacher(formModel.id, payload)
      ElMessage.success('讲师更新成功')
    } else {
      await createTeacher(payload)
      ElMessage.success('讲师创建成功')
    }
    await dictStore.loadTeacher({ force: true })
    dialogVisible.value = false
    tableRef.value?.refresh()
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确认删除讲师“${row.name}”吗？`, '删除确认', { type: 'warning' })
    await deleteTeacher(row.id)
    ElMessage.success('删除成功')
    await dictStore.loadTeacher({ force: true })
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.ellipsis {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
