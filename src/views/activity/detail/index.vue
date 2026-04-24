<template>
  <div class="dp-activity-detail">
    <el-card>
      <template #header>
        <div class="header-wrap">
          <span>{{ isCreate ? '新建活动' : `活动详情 #${route.params.id}` }}</span>
          <el-space>
            <el-button @click="goBack">返回</el-button>
            <el-button v-if="tab === 'base'" type="primary" :loading="saving" @click="saveBase">保存</el-button>
          </el-space>
        </div>
      </template>

      <el-tabs v-model="tab">
        <el-tab-pane label="基本信息" name="base">
          <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="分类" prop="category_id">
              <DictSelect v-model="form.category_id" dict-key="category" />
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="封面" prop="cover">
              <UploadImage v-model="form.cover" folder="activity" ratio="16:9" />
            </el-form-item>
            <el-form-item label="活动日" prop="activity_date">
              <el-date-picker v-model="form.activity_date" type="date" value-format="YYYY-MM-DD" />
            </el-form-item>
            <el-form-item label="时段" prop="time_range">
              <el-input v-model="form.time_range" placeholder="如 14:00-17:00" />
            </el-form-item>
            <el-form-item label="地点" prop="location">
              <el-input v-model="form.location" />
            </el-form-item>
            <el-form-item label="票价(分)" prop="price">
              <el-input-number v-model="form.price" :min="0" />
            </el-form-item>
            <el-form-item label="原价(分)" prop="original_price">
              <el-input-number v-model="form.original_price" :min="0" />
            </el-form-item>
            <el-form-item label="人数上限" prop="limit_count">
              <el-input-number v-model="form.limit_count" :min="0" />
              <span class="hint">0 表示不限</span>
            </el-form-item>
            <el-form-item label="议程" prop="agenda">
              <JsonAgendaEditor v-model="form.agenda" />
            </el-form-item>
            <el-form-item label="详情" prop="description">
              <RichEditor v-model="form.description" :height="280" />
            </el-form-item>
            <el-form-item label="上架" prop="status">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="嘉宾" name="speaker" :disabled="isCreate">
          <ProTable ref="spTableRef" :columns="spColumns" :load-data="loadSpeakers">
            <template #toolbar-left>
              <el-button type="primary" @click="openSp()">新增嘉宾</el-button>
            </template>
            <template #avatar="{ row }">
              <el-avatar :src="row.avatar" :size="36" />
            </template>
            <template #actions="{ row }">
              <el-space>
                <el-button link type="primary" @click="openSp(row)">编辑</el-button>
                <el-button link type="danger" @click="removeSp(row)">删除</el-button>
              </el-space>
            </template>
          </ProTable>
        </el-tab-pane>
        <el-tab-pane label="报名情况" name="stat" :disabled="isCreate">
          <el-descriptions border :column="2">
            <el-descriptions-item label="已报名">{{ stats.enrolled }}</el-descriptions-item>
            <el-descriptions-item label="已签到">{{ stats.checked }}</el-descriptions-item>
            <el-descriptions-item label="签到率">{{ stats.rate }}%</el-descriptions-item>
          </el-descriptions>
          <el-table :data="regPreview" border class="mt" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="手机" />
            <el-table-column prop="register_status" label="状态" width="100">
              <template #default="{ row }">
                <StatusTag :dict="REGISTER_STATUS" :value="row.register_status" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="spVisible" :title="spForm.id ? '编辑嘉宾' : '新增嘉宾'" width="520px" destroy-on-close>
      <el-form :model="spForm" label-width="80px">
        <el-form-item label="头像">
          <UploadImage v-model="spForm.avatar" folder="activity" ratio="1:1" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="spForm.name" />
        </el-form-item>
        <el-form-item label="头衔">
          <el-input v-model="spForm.title" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="spForm.brief" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="spVisible = false">取消</el-button>
        <el-button type="primary" :loading="spSaving" @click="saveSp">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import DictSelect from '@/components/DictSelect/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import JsonAgendaEditor from '@/components/JsonAgendaEditor/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { REGISTER_STATUS } from '@/utils/enums'
import {
  createActivity,
  deleteActivitySpeaker,
  findActivityById,
  getActivityRegisterList,
  getActivitySpeakers,
  getRegisterStats,
  saveActivitySpeaker,
  updateActivity,
} from '@/api/activity'
import { useDictStore } from '@/stores/dict'

const route = useRoute()
const router = useRouter()
const dictStore = useDictStore()
const isCreate = computed(() => route.params.id === 'new')

const tab = ref('base')
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
  enrolled_count: 0,
  agenda: [],
  description: '',
  status: 1,
})

const rules = {
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面', trigger: 'change' }],
  activity_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
}

const spTableRef = ref(null)
const spColumns = [
  { prop: 'avatar', label: '头像', width: 80, slot: 'avatar' },
  { prop: 'name', label: '姓名', minWidth: 100 },
  { prop: 'title', label: '头衔', minWidth: 120 },
  { prop: 'brief', label: '简介', minWidth: 160, showOverflowTooltip: true },
  { prop: 'actions', label: '操作', width: 140, slot: 'actions' },
]

const spVisible = ref(false)
const spSaving = ref(false)
const spForm = reactive({ id: null, avatar: '', name: '', title: '', brief: '' })

const stats = reactive({ enrolled: 0, checked: 0, rate: 0 })
const regPreview = ref([])

async function load() {
  if (isCreate.value) return
  const data = await findActivityById(route.params.id)
  Object.assign(form, {
    category_id: data.category_id,
    title: data.title,
    cover: data.cover,
    activity_date: data.activity_date,
    time_range: data.time_range,
    location: data.location,
    price: data.price,
    original_price: data.original_price,
    limit_count: data.limit_count,
    enrolled_count: data.enrolled_count,
    agenda: data.agenda?.length ? JSON.parse(JSON.stringify(data.agenda)) : [],
    description: data.description,
    status: data.status,
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

async function refreshStats() {
  if (isCreate.value) return
  const s = await getRegisterStats(route.params.id)
  Object.assign(stats, s)
  const res = await getActivityRegisterList({ activity_id: route.params.id, page: 1, pageSize: 8 })
  regPreview.value = res.list || []
}

watch(tab, (name) => {
  if (name === 'speaker') spTableRef.value?.refresh()
  if (name === 'stat') refreshStats()
})

async function saveBase() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    if (isCreate.value) {
      const row = await createActivity({ ...form })
      ElMessage.success('已创建')
      router.replace(`/activity/detail/${row.id}`)
      return
    }
    await updateActivity(route.params.id, { ...form })
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function openSp(row) {
  if (row?.id) {
    Object.assign(spForm, { ...row })
  } else {
    Object.assign(spForm, { id: null, avatar: '', name: '', title: '', brief: '' })
  }
  spVisible.value = true
}

async function saveSp() {
  spSaving.value = true
  try {
    await saveActivitySpeaker(route.params.id, { ...spForm })
    ElMessage.success('已保存')
    spVisible.value = false
    spTableRef.value?.refresh()
  } catch (e) {
    ElMessage.error(e?.message || '失败')
  } finally {
    spSaving.value = false
  }
}

async function removeSp(row) {
  try {
    await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
    await deleteActivitySpeaker(route.params.id, row.id)
    ElMessage.success('已删除')
    spTableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '失败')
  }
}

function goBack() {
  router.push('/activity/list')
}

onMounted(async () => {
  await dictStore.loadCategory()
  load()
})
</script>

<style scoped>
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.mt {
  margin-top: 12px;
}
</style>
