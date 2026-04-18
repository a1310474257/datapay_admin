<template>
  <div class="dp-system-admin">
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button type="primary" @click="openDialog()">新建管理员</el-button>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-if="row.id !== 1" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="visible" :title="form.id ? '编辑管理员' : '新建管理员'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="新建必填，编辑留空则不改" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
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
import ProTable from '@/components/ProTable/index.vue'
import { createAdminUser, deleteAdminUser, getAdminUserList, updateAdminUser } from '@/api/systemAdmin'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData } = useTable({
  loadApi: getAdminUserList,
  defaultParams: { keyword: '' },
})

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'username', label: '账号', minWidth: 120 },
  { prop: 'nickname', label: '昵称', minWidth: 120 },
  { prop: 'actions', label: '操作', width: 140, slot: 'actions' },
]

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  username: '',
  password: '',
  nickname: '',
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

function openDialog(row) {
  if (row?.id) {
    Object.assign(form, { id: row.id, username: row.username, password: '', nickname: row.nickname })
  } else {
    Object.assign(form, { id: null, username: '', password: '', nickname: '' })
  }
  visible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (!form.id && !form.password) {
    ElMessage.warning('请设置初始密码')
    return
  }
  submitting.value = true
  try {
    const payload = { username: form.username, nickname: form.nickname }
    if (form.password) payload.password = form.password
    if (form.id) {
      await updateAdminUser(form.id, payload)
    } else {
      await createAdminUser(payload)
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
    await ElMessageBox.confirm('确认删除该管理员？', '提示', { type: 'warning' })
    await deleteAdminUser(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}
</script>
