<template>
  <div class="dp-hot-search-page">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'hotSearch:create'" type="primary" @click="openDialog()">新建热搜</el-button>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'hotSearch:update'" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-permission="'hotSearch:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="visible" :title="form.id ? '编辑热搜' : '新建热搜'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="关键字" prop="keyword">
          <el-input v-model="form.keyword" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="点击量" prop="hits">
          <el-input-number v-model="form.hits" :min="0" :max="99999999" />
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
import { STATUS_ENABLE } from '@/utils/enums'
import { createHotSearch, deleteHotSearch, getHotSearchList, updateHotSearch } from '@/api/hotSearch'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getHotSearchList,
  defaultParams: { keyword: '', status: '' },
})

const searchSchema = [{ prop: 'keyword', label: '关键字', type: 'input' }]

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'keyword', label: '关键字', minWidth: 160 },
  { prop: 'sort', label: '排序', width: 90 },
  { prop: 'hits', label: '点击量', width: 110 },
  { prop: 'status', label: '状态', width: 90, dict: STATUS_ENABLE },
  { prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' },
]

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  keyword: '',
  sort: 1,
  hits: 0,
  status: 1,
})

const rules = {
  keyword: [{ required: true, message: '请输入关键字', trigger: 'blur' }],
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function openDialog(row) {
  if (row?.id) {
    Object.assign(form, { ...row })
  } else {
    Object.assign(form, { id: null, keyword: '', sort: 1, hits: 0, status: 1 })
  }
  visible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (form.id) {
      await updateHotSearch(form.id, { ...form })
    } else {
      await createHotSearch({ ...form })
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
    await deleteHotSearch(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}
</script>
