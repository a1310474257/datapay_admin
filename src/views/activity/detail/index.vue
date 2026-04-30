<template>
  <div class="dp-activity-detail">
    <el-card class="page-header" shadow="never">
      <div class="header-wrap">
        <div class="title-wrap">
          <div class="header-title">{{ isCreate ? '新建活动' : `活动详情 #${route.params.id}` }}</div>
          <div class="header-subtitle">活动基础信息、嘉宾信息、报名签到统一维护</div>
        </div>
        <el-space>
          <el-button @click="goBack">返回列表</el-button>
          <el-button v-if="activeTab === 'base'" type="primary" :loading="saving" @click="saveBase">
            保存活动
          </el-button>
        </el-space>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="base">
          <el-form
            v-if="activeTab === 'base'"
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
          >
            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="分类" prop="category_id">
                  <DictSelect v-model="form.category_id" dict-key="category" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="上架状态" prop="status">
                  <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
                  <span class="status-hint">{{ form.status === 1 ? '上架中' : '已下架' }}</span>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="活动标题" prop="title">
              <el-input v-model="form.title" maxlength="200" show-word-limit placeholder="请输入活动标题" />
            </el-form-item>

            <el-form-item label="活动封面" prop="cover">
              <!-- 上传字段统一保存 objectKey，预览走 /api/file 中转 -->
              <UploadImage v-model="form.cover" folder="activity" ratio="16:9" use-object-key />
            </el-form-item>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="活动日期" prop="activity_date">
                  <el-date-picker
                    v-model="form.activity_date"
                    type="date"
                    value-format="YYYY-MM-DD"
                    placeholder="请选择日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="活动时段" prop="time_range">
                  <el-input v-model="form.time_range" placeholder="如 14:00-17:00" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="活动地点" prop="location">
                  <el-input v-model="form.location" placeholder="请输入活动地点" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="人数上限" prop="limit_count">
                  <el-input-number v-model="form.limit_count" :min="0" :max="999999" style="width: 100%" />
                  <span class="status-hint">0 表示不限人数</span>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="票价(元)" prop="price">
                  <el-input-number
                    v-model="form.price"
                    :min="0"
                    :max="999999"
                    :precision="2"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="原价(元)" prop="original_price">
                  <el-input-number
                    v-model="form.original_price"
                    :min="0"
                    :max="999999"
                    :precision="2"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="活动议程" prop="agenda">
              <JsonAgendaEditor v-model="form.agenda" />
            </el-form-item>

            <el-form-item label="活动详情" prop="description">
              <RichEditor v-model="form.description" :height="300" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="嘉宾管理" name="speaker" :disabled="isCreate">
          <ProTable v-if="activeTab === 'speaker'" ref="spTableRef" :columns="speakerColumns" :load-data="loadSpeakers">
            <template #toolbar-left>
              <el-button type="primary" @click="openSpeakerDialog()">新增嘉宾</el-button>
            </template>
            <template #avatar="{ row }">
              <el-avatar :size="36" :src="resolveMediaPreviewUrl(row.avatar)" />
            </template>
            <template #actions="{ row }">
              <el-space>
                <el-button link type="primary" @click="openSpeakerDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeSpeaker(row)">删除</el-button>
              </el-space>
            </template>
          </ProTable>
        </el-tab-pane>

        <el-tab-pane label="报名与签到" name="register" :disabled="isCreate">
          <el-card class="stats-card" shadow="never">
            <div class="stats-row">
              <div class="stat-item">
                <div class="stat-label">已报名</div>
                <div class="stat-value">{{ registerStats.enrolled }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">已签到</div>
                <div class="stat-value">{{ registerStats.checked }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">签到率</div>
                <div class="stat-value">{{ registerStats.rate }}%</div>
              </div>
            </div>
          </el-card>

          <SearchForm
            :model-value="registerSearch"
            :schema="registerSearchSchema"
            @update:model-value="handleRegisterSearchUpdate"
            @search="onRegisterSearch"
          />

          <ProTable
            v-if="activeTab === 'register'"
            ref="registerTableRef"
            selectable
            :columns="registerColumns"
            :load-data="loadRegisterData"
            @selection-change="onRegisterSelectionChange"
          >
            <template #toolbar-left>
              <el-space>
                <el-button type="primary" @click="openVerifyDialog">核销码签到</el-button>
                <el-button :disabled="!selectedRegisterRows.length" @click="batchCheckin">批量签到</el-button>
                <el-button :loading="exporting" @click="exportRegisters">导出报名</el-button>
              </el-space>
            </template>
            <template #register_status="{ row }">
              <StatusTag :dict="REGISTER_STATUS" :value="row.register_status" />
            </template>
            <template #actions="{ row }">
              <el-button
                link
                type="primary"
                :disabled="Number(row.register_status) === 2"
                @click="checkinOne(row)"
              >
                签到
              </el-button>
            </template>
          </ProTable>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="speakerDialogVisible"
      :title="speakerForm.id ? '编辑嘉宾' : '新增嘉宾'"
      width="520px"
      destroy-on-close
      append-to-body
    >
      <el-form :model="speakerForm" label-width="80px">
        <el-form-item label="头像">
          <!-- 上传字段统一保存 objectKey，预览走 /api/file 中转 -->
          <UploadImage v-model="speakerForm.avatar" folder="activity" ratio="1:1" use-object-key />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="speakerForm.name" />
        </el-form-item>
        <el-form-item label="头衔">
          <el-input v-model="speakerForm.title" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="speakerDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="speakerSaving" @click="saveSpeaker">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="verifyDialogVisible"
      title="核销码签到"
      width="460px"
      destroy-on-close
      append-to-body
    >
      <el-input
        v-model="verifyCode"
        placeholder="请输入核销码（报名ID）"
        clearable
        @keyup.enter="submitVerifyCheckin"
      />
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifying" @click="submitVerifyCheckin">确认签到</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import SearchForm from '@/components/SearchForm/index.vue'
import DictSelect from '@/components/DictSelect/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import JsonAgendaEditor from '@/components/JsonAgendaEditor/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { REGISTER_STATUS } from '@/utils/enums'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { fen2yuan, yuan2fen } from '@/utils/price'
import { useDictStore } from '@/stores/dict'
import {
  batchCheckinRegister,
  checkinRegister,
  createActivity,
  createRegisterExportTask,
  deleteActivitySpeaker,
  findActivityById,
  getActivityRegisterList,
  getActivitySpeakers,
  getExportTask,
  getRegisterStats,
  saveActivitySpeaker,
  updateActivity,
  verifyRegisterCode,
} from '@/api/activity'

const route = useRoute()
const router = useRouter()
const dictStore = useDictStore()
const isCreate = computed(() => route.params.id === 'new')

const activeTab = ref('base')
const saving = ref(false)
const formRef = ref(null)

const form = reactive({
  category_id: undefined,
  title: '',
  cover: '',
  activity_date: '',
  time_range: '',
  location: '',
  price: 0,
  original_price: 0,
  limit_count: 0,
  agenda: [],
  description: '',
  status: 1,
})

const rules = {
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传活动封面', trigger: 'change' }],
  activity_date: [{ required: true, message: '请选择活动日期', trigger: 'change' }],
  time_range: [{ required: true, message: '请输入活动时段', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动详情', trigger: 'blur' }],
}

const spTableRef = ref(null)
const speakerColumns = [
  { prop: 'avatar', label: '头像', width: 80, slot: 'avatar' },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'title', label: '头衔', minWidth: 160 },
  { prop: 'actions', label: '操作', width: 140, slot: 'actions' },
]

const speakerDialogVisible = ref(false)
const speakerSaving = ref(false)
const speakerForm = reactive({ id: null, avatar: '', name: '', title: '' })

const registerStats = reactive({ enrolled: 0, checked: 0, rate: 0 })
const registerTableRef = ref(null)
const registerSearch = reactive({ keyword: '', register_status: '' })
const selectedRegisterRows = ref([])
const exporting = ref(false)
const verifyDialogVisible = ref(false)
const verifyCode = ref('')
const verifying = ref(false)

const registerSearchSchema = [
  { prop: 'keyword', label: '关键词', type: 'input', placeholder: '姓名/手机号' },
  {
    prop: 'register_status',
    label: '报名状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '已报名', value: 1 },
      { label: '已签到', value: 2 },
    ],
  },
]

const registerColumns = [
  { prop: 'id', label: '报名ID', width: 90 },
  { prop: 'name', label: '姓名', minWidth: 120 },
  { prop: 'phone', label: '手机号', minWidth: 130 },
  { prop: 'register_status', label: '状态', width: 100, slot: 'register_status' },
  { prop: 'created_at', label: '报名时间', minWidth: 170, showOverflowTooltip: true },
  { prop: 'actions', label: '操作', width: 90, slot: 'actions' },
]

function syncTabFromQuery() {
  const tabFromQuery = String(route.query.tab || '')
  if (tabFromQuery && ['base', 'speaker', 'register'].includes(tabFromQuery)) {
    activeTab.value = tabFromQuery
    return
  }
  activeTab.value = 'base'
}

async function loadDetail() {
  if (isCreate.value) return
  const data = await findActivityById(route.params.id)
  Object.assign(form, {
    category_id: data.category_id,
    title: data.title,
    cover: data.cover,
    activity_date: data.activity_date,
    time_range: data.time_range,
    location: data.location,
    // 接口价格单位为分，页面输入单位统一显示为元。
    price: Number(fen2yuan(data.price ?? 0)),
    original_price: Number(fen2yuan(data.original_price ?? 0)),
    limit_count: data.limit_count ?? 0,
    agenda: Array.isArray(data.agenda) ? JSON.parse(JSON.stringify(data.agenda)) : [],
    description: data.description || '',
    status: Number(data.status ?? 1),
  })
}

function loadSpeakers(params) {
  if (isCreate.value) return Promise.resolve({ list: [], total: 0, page: 1, pageSize: 10 })
  return getActivitySpeakers(route.params.id).then((list) => {
    const page = Number(params.page || 1)
    const pageSize = Number(params.pageSize || 10)
    const start = (page - 1) * pageSize
    return { list: list.slice(start, start + pageSize), total: list.length, page, pageSize }
  })
}

function handleRegisterSearchUpdate(value) {
  Object.assign(registerSearch, value || {})
}

function onRegisterSearch() {
  registerTableRef.value?.setParams(registerSearch)
  registerTableRef.value?.refresh()
}

function onRegisterSelectionChange(rows) {
  selectedRegisterRows.value = rows || []
}

function loadRegisterData(params) {
  return getActivityRegisterList({
    ...registerSearch,
    ...params,
    activity_id: route.params.id,
  })
}

async function refreshRegisterStats() {
  if (isCreate.value) return
  const result = await getRegisterStats(route.params.id)
  Object.assign(registerStats, result)
}

async function saveBase() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    // 表单按元输入，提交接口统一转为分，避免金额精度丢失。
    const payload = {
      ...form,
      price: yuan2fen(form.price),
      original_price: yuan2fen(form.original_price),
    }
    if (isCreate.value) {
      const row = await createActivity(payload)
      ElMessage.success('活动创建成功')
      await router.replace(`/activity/detail/${row.id}`)
      syncTabFromQuery()
      await loadDetail()
      return
    }
    await updateActivity(route.params.id, payload)
    ElMessage.success('活动保存成功')
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function openSpeakerDialog(row) {
  if (row?.id) {
    Object.assign(speakerForm, { id: row.id, avatar: row.avatar || '', name: row.name || '', title: row.title || '' })
  } else {
    Object.assign(speakerForm, { id: null, avatar: '', name: '', title: '' })
  }
  speakerDialogVisible.value = true
}

async function saveSpeaker() {
  if (!speakerForm.name) {
    ElMessage.warning('请输入嘉宾姓名')
    return
  }
  speakerSaving.value = true
  try {
    await saveActivitySpeaker(route.params.id, { ...speakerForm })
    ElMessage.success('嘉宾保存成功')
    speakerDialogVisible.value = false
    spTableRef.value?.refresh()
  } catch (error) {
    ElMessage.error(error?.message || '嘉宾保存失败')
  } finally {
    speakerSaving.value = false
  }
}

async function removeSpeaker(row) {
  try {
    await ElMessageBox.confirm(`确认删除嘉宾「${row.name}」？`, '提示', { type: 'warning' })
    await deleteActivitySpeaker(route.params.id, row.id)
    ElMessage.success('嘉宾已删除')
    spTableRef.value?.refresh()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error?.message || '删除失败')
  }
}

async function checkinOne(row) {
  try {
    await checkinRegister(row)
    ElMessage.success('签到成功')
    registerTableRef.value?.refresh()
    refreshRegisterStats()
  } catch (error) {
    ElMessage.error(error?.message || '签到失败')
  }
}

async function batchCheckin() {
  if (!selectedRegisterRows.value.length) {
    ElMessage.warning('请先勾选要签到的报名记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确认批量签到 ${selectedRegisterRows.value.length} 条记录？`, '提示', { type: 'warning' })
    await batchCheckinRegister(selectedRegisterRows.value)
    ElMessage.success('批量签到成功')
    selectedRegisterRows.value = []
    registerTableRef.value?.refresh()
    refreshRegisterStats()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error(error?.message || '批量签到失败')
  }
}

function openVerifyDialog() {
  verifyCode.value = ''
  verifyDialogVisible.value = true
}

async function submitVerifyCheckin() {
  if (!verifyCode.value) {
    ElMessage.warning('请输入核销码')
    return
  }
  verifying.value = true
  try {
    await verifyRegisterCode(route.params.id, verifyCode.value)
    ElMessage.success('核销签到成功')
    verifyDialogVisible.value = false
    registerTableRef.value?.refresh()
    refreshRegisterStats()
  } catch (error) {
    ElMessage.error(error?.message || '核销失败')
  } finally {
    verifying.value = false
  }
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename || 'activity-register.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}

async function exportRegisters() {
  exporting.value = true
  try {
    const { taskId } = await createRegisterExportTask({ activity_id: route.params.id })
    // 导出任务为本地模拟异步，短轮询直至任务完成或失败。
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const task = await getExportTask(taskId)
      if (task.status === 'done') {
        downloadTextFile(task.fileName, task.downloadText || '')
        ElMessage.success('导出成功')
        break
      }
      if (task.status === 'failed') {
        throw new Error(task.message || '导出失败')
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  } catch (error) {
    ElMessage.error(error?.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

function goBack() {
  router.replace({
    path: '/activity/list',
    query: { t: String(Date.now()) },
  })
}

watch(
  () => route.query.tab,
  () => {
    syncTabFromQuery()
  },
)

watch(activeTab, (name) => {
  if (name === 'speaker') spTableRef.value?.refresh()
  if (name === 'register') {
    refreshRegisterStats()
    registerTableRef.value?.setParams(registerSearch)
    registerTableRef.value?.refresh()
  }
})

onMounted(async () => {
  await dictStore.loadCategory()
  syncTabFromQuery()
  await loadDetail()
  if (activeTab.value === 'register') {
    refreshRegisterStats()
  }
})
</script>

<style scoped>
.page-header {
  margin-bottom: 12px;
}

.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-wrap {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-hint {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.stats-card {
  margin-bottom: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-item {
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  padding: 10px 12px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.stat-value {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
</style>
