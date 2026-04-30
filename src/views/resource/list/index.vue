<template>
  <div class="dp-resource-list">
    <!-- 页头：把 tab 与说明合并到一张卡片里，避免多个独立卡片视觉割裂 -->
    <el-card class="page-header" shadow="never">
      <div class="header-bar">
        <div class="header-title">
          <span class="title">资源管理</span>
          <span class="subtitle">HR 工具与调研报告，统一资源池</span>
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
          新建资源
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

      <!-- 售价：原价为 0 视作免费 -->
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
            <el-form-item label="分类" prop="category_id">
              <!-- categoryId 后端 @NotNull 必填 -->
              <DictSelect v-model="form.category_id" dict-key="category" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源类型" prop="resource_type">
              <el-radio-group v-model="form.resource_type">
                <el-radio :label="1">HR工具</el-radio>
                <el-radio :label="2">调研报告</el-radio>
              </el-radio-group>
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

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="文件类型" prop="file_type">
              <el-select v-model="form.file_type" style="width: 100%">
                <el-option label="PDF" value="PDF" />
                <el-option label="DOCX" value="DOCX" />
                <el-option label="ZIP" value="ZIP" />
                <el-option label="MP4" value="MP4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预览页数" prop="preview_pages">
              <el-input-number
                v-model="form.preview_pages"
                :min="0"
                :max="999"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主文件" prop="file_url">
          <!-- 仅允许文档类文件；use-object-key：落库 objectKey，下载经 /api/file 代理 -->
          <UploadFile
            v-model="form.file_url"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip"
            use-object-key
            @size-resolved="val => form.file_size = val"
          />
        </el-form-item>

        <el-form-item label="预览文件" prop="preview_url">
          <!-- 预览文件同样限制文档类；use-object-key：同样走 /api/file 代理 -->
          <UploadFile
            v-model="form.preview_url"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip"
            use-object-key
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="原价(元)" prop="original_price">
              <!-- 表单单位为元；提交时元转分（接口仍按分） -->
              <el-input-number
                v-model="form.original_price"
                :min="0"
                :max="999999"
                :precision="2"
                :step="1"
                style="width: 100%"
                @change="onPriceChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="售价(元)" prop="price">
              <el-input-number
                v-model="form.price"
                :min="0"
                :max="999999"
                :precision="2"
                :step="1"
                :disabled="isFreeForm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-alert
          v-if="isFreeForm"
          class="free-alert"
          title="原价为 0 时该资源视为免费，售价已锁定为 0"
          type="success"
          :closable="false"
        />

        <el-form-item label="简介" prop="brief">
          <!-- brief 后端 @NotBlank 必填，纯文本摘要 -->
          <el-input
            v-model="form.brief"
            type="textarea"
            :rows="2"
            placeholder="请输入资源简介（必填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="详细介绍" prop="description">
          <!-- description 后端 @NotBlank 必填，富文本HTML -->
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
import SearchForm from '@/components/SearchForm/index.vue'
import ProTable from '@/components/ProTable/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import UploadFile from '@/components/UploadFile/index.vue'
import DictSelect from '@/components/DictSelect/index.vue'
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
import { useTable } from '@/hooks/useTable'
import { useDictStore } from '@/stores/dict'

// 加载分类字典，供 category_id 选择器使用
const dictStore = useDictStore()
onMounted(() => dictStore.loadCategory())

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
  { prop: 'keyword', label: '标题', type: 'input', placeholder: '资源标题关键字' },
  { prop: 'category_id', label: '分类', type: 'dict-select', dictKey: 'category' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '上架', value: 1 },
      { label: '下架', value: 0 },
    ],
  },
]

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

// 表单内价格单位为元；与列表/接口的分单位通过 fen2yuan/yuan2fen 互转
const form = reactive({
  id: null,
  title: '',
  cover: '',
  category_id: undefined,
  resource_type: 1,
  file_type: 'PDF',
  file_url: '',
  preview_url: '',
  preview_pages: 0,
  original_price: 0, // 元
  price: 0, // 元
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
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  brief: [{ required: true, message: '请输入简介', trigger: 'blur' }],
  description: [{ required: true, message: '请输入详细介绍', trigger: 'blur' }],
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
  // 切 tab 时重置所有搜索条件，只保留新 resource_type；
  // 避免携带上一个 tab 的 category_id 等旧筛选导致新 tab 无数据
  const newType = Number(resTab.value)
  Object.assign(searchParams, {
    keyword: '',
    status: '',
    category_id: undefined,
    resource_type: newType,
  })
  tableRef.value?.setParams({ ...searchParams })
  tableRef.value?.refresh()
}

// 列表行字段是 ItemVO（精简版），编辑时必须拉取详情才能拿到 brief/description/file_url 等
async function openDialog(row) {
  resetForm()
  if (row?.id) {
    detailLoading.value = true
    dialogVisible.value = true
    try {
      const detail = await findResourceById(row.id)
      Object.assign(form, {
        id: detail.id,
        title: detail.title || '',
        cover: detail.cover || '',
        category_id: detail.category_id ?? undefined,
        resource_type: detail.resource_type ?? 1,
        file_type: detail.file_type || 'PDF',
        file_url: detail.file_url || '',
        preview_url: detail.preview_url || '',
        preview_pages: detail.preview_pages ?? 0,
        // 接口返回单位为分，表单显示单位为元
        original_price: Number(fen2yuan(detail.original_price ?? 0)),
        price: Number(fen2yuan(detail.price ?? 0)),
        update_time: detail.update_time || '',
        status: detail.status ?? 1,
        brief: detail.brief || '',
        description: detail.description || '',
        file_size: detail.file_size || '',
        pages: detail.pages ?? 0,
        downloads: detail.downloads ?? 0,
      })
    } catch (e) {
      ElMessage.error(e?.message || '加载详情失败')
      dialogVisible.value = false
    } finally {
      detailLoading.value = false
    }
  } else {
    Object.assign(form, {
      resource_type: Number(resTab.value),
    })
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
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (Number(form.original_price) === 0) form.price = 0
  submitting.value = true
  try {
    // 元转分：接口单位仍按分，前端只是显示口径换成元
    const payload = {
      ...form,
      original_price: yuan2fen(form.original_price),
      price: yuan2fen(form.price),
    }
    if (form.id) {
      await updateResource(form.id, payload)
    } else {
      await createResource(payload)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false

    // 若保存的资源类型与当前 tab 不一致（如把 HR工具 改成调研报告），
    // 自动切换到对应 tab 后再刷新，否则资源会"消失"在当前 tab
    const savedType = String(form.resource_type)
    if (savedType !== resTab.value) {
      resTab.value = savedType
      Object.assign(searchParams, {
        keyword: '',
        status: '',
        category_id: undefined,
        resource_type: Number(savedType),
      })
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
</style>
