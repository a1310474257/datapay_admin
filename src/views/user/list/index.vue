<template>
  <div class="dp-user-list">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #avatar="{ row }">
        <el-avatar :src="row.avatar" :size="34" />
      </template>
      <template #openid="{ row }">
        {{ maskOpenid(row.openid) }}
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'user:detail'" link type="primary" @click="handleShowDetail(row)">
            详情
          </el-button>
          <el-button
            v-if="row.status === 1"
            v-permission="'user:ban'"
            link
            type="danger"
            @click="handleBan(row)"
          >
            封禁
          </el-button>
          <el-button
            v-else
            v-permission="'user:unban'"
            link
            type="success"
            @click="handleUnban(row)"
          >
            解封
          </el-button>
        </el-space>
      </template>
    </ProTable>

    <UserDetailDrawer v-model:visible="detailVisible" :detail="detailData" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import UserDetailDrawer from '@/views/user/components/UserDetailDrawer.vue'
import { USER_STATUS } from '@/utils/enums'
import { banUser, getUserDetail, getUserList, unbanUser } from '@/api/user'
import { useTable } from '@/hooks/useTable'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getUserList,
  defaultParams: {
    keyword: '',
    status: '',
  },
})

const searchSchema = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '昵称/手机号' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '正常', value: 1 },
      { label: '封禁', value: 0 },
    ],
  },
]

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'avatar', label: '头像', width: 90, slot: 'avatar' },
  { prop: 'nickname', label: '昵称', minWidth: 140 },
  { prop: 'phone', label: '手机号', minWidth: 130 },
  { prop: 'openid', label: 'OpenID', minWidth: 200, slot: 'openid' },
  { prop: 'status', label: '状态', width: 100, dict: USER_STATUS },
  { prop: 'created_at', label: '注册时间', minWidth: 170 },
  { prop: 'actions', label: '操作', width: 180, fixed: 'right', slot: 'actions' },
]

const detailVisible = ref(false)
const detailData = ref({})

// 脱敏 openid 中段，只保留头尾便于客服核对。
function maskOpenid(openid) {
  const value = String(openid || '')
  if (value.length <= 10) return value || '—'
  return `${value.slice(0, 6)}***${value.slice(-4)}`
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

async function handleShowDetail(row) {
  try {
    detailData.value = await getUserDetail(row.id)
    detailVisible.value = true
  } catch (error) {
    ElMessage.error(error?.message || '详情加载失败')
  }
}

async function handleBan(row) {
  try {
    await ElMessageBox.confirm(`确认封禁用户“${row.nickname}”吗？`, '封禁确认', { type: 'warning' })
    await banUser(row.id)
    ElMessage.success('封禁成功')
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '封禁失败')
    }
  }
}

async function handleUnban(row) {
  try {
    await ElMessageBox.confirm(`确认解封用户“${row.nickname}”吗？`, '解封确认', { type: 'warning' })
    await unbanUser(row.id)
    ElMessage.success('解封成功')
    tableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '解封失败')
    }
  }
}
</script>
