<template>
  <div class="dp-resource-list">
    <!-- 页头：把 tab 与说明合并到一张卡片里，避免多个独立卡片视觉割裂 -->
    <el-card class="page-header" shadow="never">
      <div class="header-bar">
        <div class="header-title">
          <span class="title">内容管理</span>
          <span class="subtitle">HR工具与调研报告</span>
        </div>
        <el-tabs v-model="resTab" class="header-tabs" @tab-change="onTabChange">
          <el-tab-pane label="HR工具" name="1" />
          <el-tab-pane label="调研报告" name="2" />
        </el-tabs>
      </div>
    </el-card>

    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />

    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'resource:create'" type="primary" @click="openDialog()">
          新建{{ resTab === '1' ? 'HR工具' : '调研报告' }}
        </el-button>
      </template>

      <!-- 封面：objectKey 通过 resolveMediaPreviewUrl 转 /api/file 代理地址 -->
      <template #cover="{ row }">
        <el-image
          :src="resolveMediaPreviewUrl(row.cover)"
          fit="cover"
          style="width: 56px; height: 56px; border-radius: 6px"
          :preview-src-list="row.cover ? [resolveMediaPreviewUrl(row.cover)] : []"
          preview-teleported
          hide-on-click-modal
        />
      </template>

      <!-- 售价：售价为 0 视作免费 -->
      <template #price="{ row }">
        <span :class="{ 'free-tag': isFreeRow(row) }">
          {{ isFreeRow(row) ? '免费' : `¥ ${fen2yuan(row.price)}` }}
        </span>
      </template>

      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'resource:update'" link type="primary" @click="openDialog(row)">
            编辑
          </el-button>
          <el-button v-permission="'resource:delete'" link type="danger" @click="handleDelete(row)">
            删除
          </el-button>
        </el-space>
      </template>
    </ProTable>

    <!-- 编辑对话框：用 el-row/el-col 排版，避免单列过长 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑资源' : '新建资源'"
      width="780px"
      destroy-on-close
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="92px"
        label-position="right"
        v-loading="detailLoading"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资源类型" prop="resource_type">
              <el-radio-group v-model="form.resource_type" @change="val => loadCategoriesByType(val)">
                <el-radio :label="1">HR工具</el-radio>
                <el-radio :label="2">调研报告</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%" clearable>
                <el-option
                  v-for="opt in categoryOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="封面" prop="cover">
          <!-- use-object-key：上传后存 objectKey，访问由 /api/file 代理 -->
          <UploadImage v-model="form.cover" folder="resource" ratio="16:9" use-object-key />
        </el-form-item>

        <!-- 统一文件列表：替代原「主文件」+「预览文件」+「附件」三块 -->
        <el-form-item label="文件列表" prop="files" :error="filesError">
          <div class="file-list-panel">
            <!-- 已上传文件 -->
            <div
              v-for="(item, idx) in form.files"
              :key="idx"
              class="file-list-row"
              :class="{ 'is-preview': item.isPreview }"
            >
              <!-- 左：类型标签 + 文件名 + 大小 -->
              <div class="file-list-row__info">
                <el-tag :type="fileTagType(item.type)" size="small" class="file-type-tag">{{ item.type || 'FILE' }}</el-tag>
                <span class="file-list-row__name" :title="item.name">{{ item.name }}</span>
                <span class="file-list-row__size">{{ item.size }}</span>
              </div>
              <!-- 右：操作按钮 -->
              <div class="file-list-row__actions">
                <el-tooltip content="上移" placement="top">
                  <el-button link size="small" :disabled="idx === 0" @click="moveFile(idx, -1)">↑</el-button>
                </el-tooltip>
                <el-tooltip content="下移" placement="top">
                  <el-button link size="small" :disabled="idx === form.files.length - 1" @click="moveFile(idx, 1)">↓</el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button link type="danger" size="small" @click="removeFile(idx)">删除</el-button>
                </el-tooltip>
                <el-divider direction="vertical" />
                <!-- 预览文件标记 -->
                <el-tooltip :content="item.isPreview ? '取消预览文件' : '指定为预览文件'" placement="top">
                  <el-button
                    link
                    :type="item.isPreview ? 'warning' : 'info'"
                    size="small"
                    @click="togglePreview(idx)"
                  >{{ item.isPreview ? '★ 预览中' : '☆ 设预览' }}</el-button>
                </el-tooltip>
                <!-- 预览页数（仅预览文件显示） -->
                <template v-if="item.isPreview">
                  <span class="preview-pages-label">预览页数</span>
                  <el-input-number
                    v-model="item.previewPages"
                    :min="0"
                    :max="999"
                    size="small"
                    style="width: 80px"
                  />
                </template>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="!form.files.length" class="file-list-empty">暂无文件，请点击下方按钮上传</div>

            <!-- 上传按钮 -->
            <el-upload
              multiple
              :auto-upload="false"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.mp4"
              :show-file-list="false"
              :on-change="handleFileAdd"
            >
              <el-button size="small" :loading="fileUploading" type="primary" plain>
                {{ fileUploading ? `上传中 ${uploadingCount} / 排队 ${uploadQueue.length}` : '+ 上传文件（可多选）' }}
              </el-button>
            </el-upload>
            <div class="file-list-tip">支持 PDF / Word / Excel / PPT / ZIP / MP4；可多选批量上传，新文件追加到末尾；最多指定一个文件为「预览文件」；批量上传会按 {{ MAX_UPLOAD_CONCURRENCY }} 个并发受控执行，避免页面卡顿</div>
            <div v-if="uploadIssueFiles.length" class="upload-issues">
              <div class="upload-issues__header">
                <span>上传失败/跳过文件</span>
                <el-button link type="primary" size="small" @click="clearUploadIssues">清空</el-button>
              </div>
              <div
                v-for="item in uploadIssueFiles"
                :key="`${item.name}-${item.time}`"
                class="upload-issues__item"
              >
                <span class="upload-issues__name" :title="item.name">{{ item.name }}</span>
                <span class="upload-issues__reason">{{ item.reason }}</span>
              </div>
            </div>
          </div>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="售价(元)" prop="price">
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
        </el-row>

        <!-- 调研报告必填简介；HR工具可选 -->
        <el-form-item v-if="form.resource_type === 2" label="简介" prop="brief">
          <el-input
            v-model="form.brief"
            type="textarea"
            :rows="2"
            placeholder="请输入资源简介（必填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item v-if="form.resource_type === 2" label="详细介绍" prop="description">
          <RichEditor v-model="form.description" :height="220" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="更新日期" prop="update_time">
              <el-date-picker
                v-model="form.update_time"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="资料最后更新日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
              <span class="status-hint">{{ form.status === 1 ? '已上架' : '已下架' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUpload } from '@/hooks/useUpload'
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import { RESOURCE_TYPE, STATUS_ENABLE } from '@/utils/enums'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { fen2yuan, yuan2fen } from '@/utils/price'
import {
  createResource,
  deleteResource,
  findResourceById,
  getResourceList,
  updateResource,
} from '@/api/resource'
import { getCategoryList } from '@/api/category'
import { useTable } from '@/hooks/useTable'

// 分类选项：根据 resource_type 动态加载 (scene: 5=HR工具, 6=调研报告)
const categoryOptions = ref([])
async function loadCategoriesByType(resourceType) {
  const scene = resourceType === 2 ? 6 : 5
  try {
    const result = await getCategoryList({ business_type: scene, status: 1, pageSize: 500 })
    categoryOptions.value = (result?.list || []).map(c => ({ value: c.id, label: c.name }))
  } catch {
    categoryOptions.value = []
  }
}

// 搜索栏分类选项：随 tab 切换加载
const searchCategoryOptions = ref([])
async function loadSearchCategories(resourceType) {
  const scene = resourceType === 2 ? 6 : 5
  try {
    const result = await getCategoryList({ business_type: scene, status: 1, pageSize: 500 })
    searchCategoryOptions.value = [
      { value: '', label: '全部' },
      ...(result?.list || []).map(c => ({ value: c.id, label: c.name })),
    ]
  } catch {
    searchCategoryOptions.value = []
  }
}

const resTab = ref('1')

onMounted(() => {
  loadCategoriesByType(1)
  loadSearchCategories(1)
})

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getResourceList,
  defaultParams: {
    keyword: '',
    status: '',
    resource_type: 1,
  },
})

const searchSchema = computed(() => [
  { prop: 'keyword', label: '标题', type: 'input', placeholder: '资源标题关键字' },
  {
    prop: 'category_id',
    label: '分类',
    type: 'select',
    options: searchCategoryOptions.value,
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
])

const columns = [
  { prop: 'id', label: 'ID', width: 72 },
  { prop: 'cover', label: '封面', width: 80, slot: 'cover' },
  { prop: 'title', label: '标题', minWidth: 180, showOverflowTooltip: true },
  { prop: 'resource_type', label: '类型', width: 100, dict: RESOURCE_TYPE },
  { prop: 'file_type', label: '文件', width: 80 },
  { prop: 'price', label: '售价', width: 100, slot: 'price' },
  { prop: 'downloads', label: '下载', width: 80 },
  { prop: 'update_time', label: '更新日期', width: 110 },
  { prop: 'status', label: '状态', width: 80, dict: STATUS_ENABLE },
  { prop: 'actions', label: '操作', width: 130, fixed: 'right', slot: 'actions' },
]

const dialogVisible = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const formRef = ref(null)

// form.files 每项：{ name, url, type, size, isPreview, previewPages }
const form = reactive({
  id: null,
  title: '',
  cover: '',
  category_id: undefined,
  resource_type: 1,
  price: 0,
  update_time: '',
  status: 1,
  brief: '',
  description: '',
  pages: 0,
  downloads: 0,
  files: [],
})

// 文件列表错误提示（手动校验）
const filesError = ref('')
const uploadIssueFiles = ref([])

const rules = computed(() => ({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面', trigger: 'change' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  ...(form.resource_type === 2 ? {
    brief: [{ required: true, message: '请输入简介', trigger: 'blur' }],
    description: [{ required: true, message: '请输入详细介绍', trigger: 'blur' }],
  } : {}),
}))

function isFreeRow(row) {
  return Number(row.price) === 0
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function onTabChange() {
  const newType = Number(resTab.value)
  Object.assign(searchParams, {
    keyword: '',
    status: '',
    category_id: undefined,
    resource_type: newType,
  })
  tableRef.value?.setParams({ ...searchParams })
  tableRef.value?.refresh()
  loadCategoriesByType(newType)
  loadSearchCategories(newType)
}

/** 把历史的 file_url / preview_url 迁移到新 files 数组格式 */
function migrateToFiles(detail) {
  let files = []
  try { files = JSON.parse(detail.extra_files || '[]') } catch { files = [] }
  // 如果 extra_files 为空，则从旧字段重建，保证历史数据可编辑
  if (!Array.isArray(files) || files.length === 0) {
    files = []
    if (detail.file_url) {
      files.push({
        name: detail.file_url.split('/').pop() || '主文件',
        url: detail.file_url,
        type: detail.file_type || 'FILE',
        size: detail.file_size || '',
        isPreview: false,
        previewPages: 0,
      })
    }
    if (detail.preview_url) {
      files.push({
        name: detail.preview_url.split('/').pop() || '预览文件',
        url: detail.preview_url,
        type: detail.file_type || 'FILE',
        size: '',
        isPreview: true,
        previewPages: detail.preview_pages ?? 0,
      })
    }
  } else {
    // 确保每项都有 isPreview / previewPages 字段（兼容旧格式）
    files = files.map(f => ({
      isPreview: false,
      previewPages: 0,
      ...f,
    }))
  }
  return files
}

async function openDialog(row) {
  resetForm()
  filesError.value = ''
  clearUploadIssues()
  if (row?.id) {
    detailLoading.value = true
    dialogVisible.value = true
    try {
      const detail = await findResourceById(row.id)
      const rt = detail.resource_type ?? 1
      loadCategoriesByType(rt)
      Object.assign(form, {
        id: detail.id,
        title: detail.title || '',
        cover: detail.cover || '',
        category_id: detail.category_id ?? undefined,
        resource_type: rt,
        price: Number(fen2yuan(detail.price ?? 0)),
        update_time: detail.update_time || '',
        status: detail.status ?? 1,
        brief: detail.brief || '',
        description: detail.description || '',
        pages: detail.pages ?? 0,
        downloads: detail.downloads ?? 0,
        files: migrateToFiles(detail),
      })
    } catch (e) {
      ElMessage.error(e?.message || '加载详情失败')
      dialogVisible.value = false
    } finally {
      detailLoading.value = false
    }
  } else {
    Object.assign(form, { resource_type: Number(resTab.value) })
    dialogVisible.value = true
  }
}

function resetForm() {
  Object.assign(form, {
    id: null,
    title: '',
    cover: '',
    category_id: undefined,
    resource_type: Number(resTab.value),
    price: 0,
    update_time: '',
    status: 1,
    brief: '',
    description: '',
    pages: 0,
    downloads: 0,
    files: [],
  })
  filesError.value = ''
  clearUploadIssues()
}

/** 从 files 数组派生后端所需的 file_url/preview_url/file_type 等字段 */
function buildPayloadFiles() {
  const previewFile = form.files.find(f => f.isPreview)
  const mainFile = form.files.find(f => !f.isPreview) || form.files[0]
  return {
    file_url: mainFile?.url || '',
    file_type: mainFile?.type || 'FILE',
    file_size: mainFile?.size || '',
    preview_url: previewFile?.url || '',
    preview_pages: previewFile?.previewPages || 0,
    extra_files: JSON.stringify(form.files),
  }
}

async function submit() {
  filesError.value = ''
  if (fileUploading.value) {
    ElMessage.warning('文件仍在上传，请等待上传完成后再保存')
    return
  }
  if (!form.files.length) {
    filesError.value = '请至少上传一个文件'
    return
  }
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    const payload = {
      ...form,
      ...buildPayloadFiles(),
      price: yuan2fen(form.price),
    }
    if (form.id) {
      await updateResource(form.id, payload)
    } else {
      await createResource(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    const savedType = String(form.resource_type)
    if (savedType !== resTab.value) {
      resTab.value = savedType
      Object.assign(searchParams, { keyword: '', status: '', category_id: undefined, resource_type: Number(savedType) })
      tableRef.value?.setParams({ ...searchParams })
    }
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

// ===== 文件列表管理 =====
// 批量上传采用受控并发池，避免大批文件同时上传挤占浏览器和后端连接。
const uploadingCount = ref(0)
const uploadQueue = ref([])
const MAX_UPLOAD_CONCURRENCY = 3
const uploadingTotal = computed(() => uploadingCount.value + uploadQueue.value.length)
const fileUploading = computed(() => uploadingTotal.value > 0)
const uploadingFileNames = new Set()

const EXT_TYPE_MAP = { PDF: 'PDF', DOC: 'DOCX', DOCX: 'DOCX', XLS: 'XLSX', XLSX: 'XLSX', PPT: 'PPTX', PPTX: 'PPTX', ZIP: 'ZIP', MP4: 'MP4' }
const TAG_TYPE_MAP = { PDF: 'danger', DOCX: 'primary', XLSX: 'success', PPTX: 'warning', ZIP: 'info', MP4: '' }

function fileTagType(type) {
  return TAG_TYPE_MAP[type] || ''
}

function removeFile(idx) {
  form.files.splice(idx, 1)
}

function moveFile(idx, dir) {
  const to = idx + dir
  if (to < 0 || to >= form.files.length) return
  ;[form.files[idx], form.files[to]] = [form.files[to], form.files[idx]]
}

function togglePreview(idx) {
  const wasPreview = form.files[idx].isPreview
  form.files.forEach(f => { f.isPreview = false })
  if (!wasPreview) form.files[idx].isPreview = true
}

function normalizeFileName(name) {
  return String(name || '').trim().toLowerCase()
}

function hasSameFileName(name) {
  const normalized = normalizeFileName(name)
  if (!normalized) return false
  return form.files.some(item => normalizeFileName(item.name) === normalized)
    || uploadingFileNames.has(normalized)
}

function addUploadIssue(name, reason) {
  uploadIssueFiles.value.push({
    name: name || '未命名文件',
    reason,
    time: Date.now() + Math.random(),
  })
}

function clearUploadIssues() {
  uploadIssueFiles.value = []
}

async function handleFileAdd(file) {
  if (!file?.raw) return
  const fileName = file.name || file.raw.name || ''
  const normalizedName = normalizeFileName(fileName)
  if (hasSameFileName(fileName)) {
    addUploadIssue(fileName, '文件名重复，已跳过')
    ElMessage.warning(`「${fileName}」文件名重复，已跳过`)
    return
  }
  uploadingFileNames.add(normalizedName)
  uploadQueue.value.push({
    raw: file.raw,
    name: fileName,
    normalizedName,
    size: file.size || file.raw.size || 0,
  })
  processUploadQueue()
}

function processUploadQueue() {
  while (uploadingCount.value < MAX_UPLOAD_CONCURRENCY && uploadQueue.value.length) {
    const task = uploadQueue.value.shift()
    uploadingCount.value++
    void uploadSingleFile(task)
  }
}

async function uploadSingleFile(task) {
  const fileName = task.name
  filesError.value = ''
  try {
    const { upload } = useUpload()
    const objectKey = await upload(task.raw, 'resource', { returnObjectKey: true })
    const ext = (fileName || '').split('.').pop().toUpperCase()
    const type = EXT_TYPE_MAP[ext] || 'FILE'
    const sizeKB = task.size ? (task.size / 1024) : 0
    const sizeStr = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)}MB` : `${sizeKB.toFixed(0)}KB`
    form.files.push({ name: fileName, url: objectKey, type, size: sizeStr, isPreview: false, previewPages: 0 })
    ElMessage.success(`「${fileName}」已上传`)
  } catch (e) {
    const reason = e?.message || '未知错误'
    addUploadIssue(fileName, reason)
    ElMessage.error(`「${fileName}」上传失败：${reason}`)
  } finally {
    uploadingFileNames.delete(task.normalizedName)
    uploadingCount.value--
    processUploadQueue()
  }
}
</script>

<style scoped>
/* 页头卡片：标题 + 资源大类 tabs 同行展示 */
.page-header {
  margin-bottom: 12px;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-title {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.header-title .title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-title .subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 把 tabs 自带的下边线去掉，避免和卡片底边线打架 */
.header-tabs :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: none;
}

.header-tabs :deep(.el-tabs__nav-wrap)::after {
  height: 0;
}

/* 列表免费标签视觉 */
.free-tag {
  color: var(--el-color-success);
  font-weight: 600;
}

/* 表单内提示与开关辅助文案 */
.free-alert {
  margin-top: -8px;
  margin-bottom: 16px;
}

.status-hint {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* ===== 统一文件列表面板 ===== */
.file-list-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-list-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.file-list-row.is-preview {
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}

.file-list-row__info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-type-tag {
  flex-shrink: 0;
}

.file-list-row__name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list-row__size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.file-list-row__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.preview-pages-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.file-list-empty {
  padding: 16px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);
}

.file-list-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.upload-issues {
  margin-top: 4px;
  padding: 8px 10px;
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 6px;
  background: var(--el-color-warning-light-9);
}

.upload-issues__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-warning-dark-2);
}

.upload-issues__item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.6;
}

.upload-issues__name {
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.upload-issues__reason {
  color: var(--el-text-color-secondary);
}
</style>
