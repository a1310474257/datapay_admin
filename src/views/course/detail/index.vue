<template>
  <div class="dp-course-detail">
    <el-card>
      <template #header>
        <div class="header-wrap">
          <span>{{ isCreateMode ? '新建课程' : `课程详情 #${route.params.id}` }}</span>
          <el-space>
            <el-button @click="goBack">返回列表</el-button>
            <el-button v-if="activeTab === 'base'" type="primary" :loading="submitting" @click="handleSubmit">
              保存
            </el-button>
          </el-space>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <el-tab-pane label="基本信息" name="base">
          <el-form ref="formRef" :model="formModel" :rules="rules" label-width="110px">
            <el-form-item label="课程分类" prop="category_id">
              <DictSelect v-model="formModel.category_id" dict-key="category" />
            </el-form-item>
            <el-form-item label="讲师" prop="teacher_id">
              <DictSelect v-model="formModel.teacher_id" dict-key="teacher" @change="handleTeacherChange" />
            </el-form-item>
            <el-form-item label="课程标题" prop="title">
              <el-input v-model="formModel.title" maxlength="200" show-word-limit />
            </el-form-item>
            <el-form-item label="课程封面" prop="cover">
              <!-- 与首页轮播一致：上传存 objectKey，预览走 /api/file；详情见 doc/首页轮播图上传下载模式说明.md -->
              <UploadImage v-model="formModel.cover" folder="course" ratio="16:9" use-object-key />
            </el-form-item>
            <el-form-item label="课程简介" prop="brief">
              <el-input v-model="formModel.brief" type="textarea" :rows="3" maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item label="课程详情" prop="description">
              <RichEditor v-model="formModel.description" :height="360" />
            </el-form-item>
            <el-form-item label="总时长" prop="total_duration">
              <el-input v-model="formModel.total_duration" placeholder='如 "32 小时"' />
            </el-form-item>
            <el-form-item label="售价" prop="price">
              <PriceInput v-model="formModel.price" />
            </el-form-item>
            <el-form-item label="原价" prop="original_price">
              <PriceInput v-model="formModel.original_price" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-switch v-model="formModel.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <!-- 新建课程时 route 为 /course/detail/new，不可用「new」调用 /admin/courses/{courseId}/...，否则后端 path 变量 courseId 无法转为 Long -->
        <el-tab-pane label="章节课时" name="chapter" :disabled="isCreateMode">
          <ChapterLessonTree
            v-if="!isCreateMode"
            v-model:tree="chapterTree"
            :course-id="route.params.id"
            :loading="chapterSaving"
            @save="saveChapterTree"
          />
        </el-tab-pane>
        <el-tab-pane label="配套资料" name="material" :disabled="isCreateMode">
          <ProTable v-if="!isCreateMode" ref="matTableRef" :columns="matColumns" :load-data="loadMaterials">
            <template #toolbar-left>
              <el-button type="primary" @click="openMaterialDialog()">新增资料</el-button>
            </template>
            <!-- 下载按钮：通过 JS fetch 携带管理员 JWT 下载，避免新标签页丢失鉴权头 -->
            <template #url="{ row }">
              <el-button
                v-if="row.url"
                link
                type="primary"
                :loading="downloadingId === row.id"
                @click="handleDownloadMaterial(row)"
              >下载</el-button>
              <span v-else>—</span>
            </template>
            <template #actions="{ row }">
              <el-space>
                <el-button link type="primary" @click="openMaterialDialog(row)">编辑</el-button>
                <el-button link type="danger" @click="removeMaterial(row)">删除</el-button>
              </el-space>
            </template>
          </ProTable>
        </el-tab-pane>
        <el-tab-pane label="其他配置" name="other">
          <el-empty description="预留扩展：推荐位、标签等" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="matDialog" :title="matForm.id ? '编辑资料' : '新增资料'" width="560px" destroy-on-close>
      <el-form ref="matFormRef" :model="matForm" :rules="matRules" label-width="96px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="matForm.title" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="matForm.type" placeholder="选择类型">
            <el-option label="PDF" value="PDF" />
            <el-option label="DOCX" value="DOCX" />
            <el-option label="ZIP" value="ZIP" />
            <el-option label="MP4" value="MP4" />
          </el-select>
        </el-form-item>
        <!-- use-object-key：资料文件落库 objectKey；管理员通过 /api/file 直通 BOS 下载，
             小程序用户需已购校验后通过同一接口下载；
             init-name：编辑时注入已存储的原始文件名，避免回显 BOS UUID -->
        <el-form-item label="文件" prop="url">
          <UploadFile
            v-model="matForm.url"
            :use-object-key="true"
            :init-name="matForm.file_name"
            @name-resolved="(n) => (matForm.file_name = n)"
            @size-resolved="(s) => (matForm.file_size = s)"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="matForm.sort" :min="1" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="matDialog = false">取消</el-button>
        <el-button type="primary" :loading="matSaving" @click="submitMaterial">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { downloadWithAuth } from '@/utils/download'
import DictSelect from '@/components/DictSelect/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import PriceInput from '@/components/PriceInput/index.vue'
import UploadFile from '@/components/UploadFile/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import ChapterLessonTree from '@/components/ChapterLessonTree/index.vue'
import {
  createCourse,
  findCourseById,
  getChapters,
  getMaterials,
  saveChapters,
  saveMaterial,
  deleteMaterial,
  updateCourse,
} from '@/api/course'
import { useDictStore } from '@/stores/dict'

const route = useRoute()
const router = useRouter()
const dictStore = useDictStore()
const activeTab = ref('base')
const formRef = ref(null)
const submitting = ref(false)
const formModel = reactive({
  category_id: undefined,
  teacher_id: undefined,
  teacher_name: '',
  title: '',
  cover: '',
  brief: '',
  description: '',
  total_duration: '',
  price: 0,
  original_price: 0,
  status: 1,
  chapter_count: 0,
  sales: 0,
})

const isCreateMode = computed(() => route.params.id === 'new')

const rules = {
  category_id: [{ required: true, message: '请选择课程分类', trigger: 'change' }],
  teacher_id: [{ required: true, message: '请选择讲师', trigger: 'change' }],
  title: [{ required: true, message: '请输入课程标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传课程封面', trigger: 'change' }],
  description: [{ required: true, message: '请输入课程详情', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'change' }],
  original_price: [{ required: true, message: '请输入原价', trigger: 'change' }],
}

const chapterTree = ref([])
const chapterSaving = ref(false)

const matTableRef = ref(null)
const matDialog = ref(false)
const matSaving = ref(false)
// 正在下载的资料 id，用于按钮 loading 状态；同时只允许一个下载任务
const downloadingId = ref(null)
const matFormRef = ref(null)
const matForm = reactive({
  id: null,
  title: '',
  type: 'PDF',
  url: '',
  // 资料文件原始名称，供 UploadFile initName 回显时显示友好名称而非 BOS UUID
  file_name: '',
  // 格式化后的文件大小（如 "1.2 MB"），由 UploadFile size-resolved 事件或后端回填
  file_size: '',
  sort: 1,
})
const matRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  url: [{ required: true, message: '请上传文件', trigger: 'change' }],
}

const matColumns = [
  { prop: 'title', label: '标题', minWidth: 160 },
  { prop: 'type', label: '类型', width: 100 },
  { prop: 'file_size', label: '大小', width: 100 },
  { prop: 'url', label: '下载链接', minWidth: 140, slot: 'url' },
  { prop: 'sort', label: '排序', width: 80 },
  { prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' },
]

function assignForm(data = {}) {
  Object.assign(formModel, {
    category_id: data.category_id,
    teacher_id: data.teacher_id,
    teacher_name: data.teacher_name || '',
    title: data.title || '',
    cover: data.cover || '',
    brief: data.brief || '',
    description: data.description || '',
    total_duration: data.total_duration || '',
    price: Number(data.price || 0),
    original_price: Number(data.original_price || 0),
    status: Number(data.status ?? 1),
    chapter_count: Number(data.chapter_count || 0),
    sales: Number(data.sales || 0),
  })
}

function handleTeacherChange(teacherId) {
  const teacher = (dictStore.teacher || []).find((item) => Number(item.id) === Number(teacherId))
  formModel.teacher_name = teacher?.name || ''
}

async function loadDetail() {
  if (isCreateMode.value) return
  try {
    const data = await findCourseById(route.params.id)
    assignForm(data)
  } catch (error) {
    ElMessage.error(error?.message || '课程详情加载失败')
    goBack()
  }
}

async function loadChapterData() {
  if (isCreateMode.value) return
  try {
    chapterTree.value = await getChapters(route.params.id)
  } catch (e) {
    ElMessage.error(e?.message || '章节加载失败')
  }
}

async function onTabChange(name) {
  if (name === 'chapter') await loadChapterData()
  if (name === 'material') matTableRef.value?.refresh()
}

async function saveChapterTree() {
  if (isCreateMode.value) return
  chapterSaving.value = true
  try {
    await saveChapters(route.params.id, chapterTree.value)
    ElMessage.success('章节已保存')
    await loadChapterData()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    chapterSaving.value = false
  }
}

function loadMaterials(params) {
  const rawId = route.params.id
  // 避免 /course/detail/new 或非法 id 请求 /admin/courses/{courseId}/materials
  if (rawId === 'new' || rawId == null || String(rawId).trim() === '') {
    return Promise.resolve({
      list: [],
      total: 0,
      page: Number(params.page || 1),
      pageSize: Number(params.pageSize || 10),
    })
  }
  const num = Number(rawId)
  if (Number.isNaN(num) || num < 1) {
    return Promise.resolve({
      list: [],
      total: 0,
      page: Number(params.page || 1),
      pageSize: Number(params.pageSize || 10),
    })
  }
  return getMaterials(rawId).then((all) => {
    const page = Number(params.page || 1)
    const pageSize = Number(params.pageSize || 10)
    const start = (page - 1) * pageSize
    return {
      list: all.slice(start, start + pageSize),
      total: all.length,
      page,
      pageSize,
    }
  })
}

function openMaterialDialog(row) {
  if (row?.id) {
    Object.assign(matForm, {
      id: row.id,
      title: row.title,
      type: row.type,
      url: row.url,
      // 回显存储的原始文件名，用于 UploadFile initName 显示友好名称
      file_name: row.file_name || '',
      // 回显存储的文件大小，编辑时若不重新上传则保持原值
      file_size: row.file_size || '',
      sort: row.sort,
    })
  } else {
    Object.assign(matForm, { id: null, title: '', type: 'PDF', url: '', file_name: '', file_size: '', sort: 1 })
  }
  matDialog.value = true
}

async function submitMaterial() {
  const ok = await matFormRef.value?.validate().catch(() => false)
  if (!ok) return
  matSaving.value = true
  try {
    await saveMaterial(route.params.id, { ...matForm })
    ElMessage.success('资料已保存')
    matDialog.value = false
    matTableRef.value?.refresh()
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    matSaving.value = false
  }
}

async function handleDownloadMaterial(row) {
  if (!row.url) return
  downloadingId.value = row.id
  try {
    // 携带管理员 JWT 发起 fetch 请求，避免新标签页丢失鉴权头导致 401
    await downloadWithAuth(resolveMediaPreviewUrl(row.url), row.title || undefined)
  } catch {
    // 错误已在 downloadWithAuth 内部弹 ElMessage，此处不重复提示
  } finally {
    downloadingId.value = null
  }
}

async function removeMaterial(row) {
  try {
    await ElMessageBox.confirm('确认删除该资料？', '提示', { type: 'warning' })
    await deleteMaterial(row.id, route.params.id)
    ElMessage.success('已删除')
    matTableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (!formModel.teacher_name) {
      handleTeacherChange(formModel.teacher_id)
    }
    const payload = { ...formModel }
    if (isCreateMode.value) {
      const created = await createCourse(payload)
      ElMessage.success('课程创建成功')
      await dictStore.loadCategory({ force: true })
      await dictStore.loadTeacher({ force: true })
      router.replace(`/course/detail/${created.id}`)
      return
    }
    await updateCourse(route.params.id, payload)
    ElMessage.success('课程保存成功')
    await dictStore.loadCategory({ force: true })
    await dictStore.loadTeacher({ force: true })
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  // 优先用浏览器历史回退，避免 router.push 在历史栈追加新条目导致循环
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/course/list')
  }
}

onMounted(async () => {
  await Promise.all([dictStore.loadCategory(), dictStore.loadTeacher()])
  loadDetail()
})
</script>

<style scoped>
.header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
