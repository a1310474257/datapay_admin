<template>
  <div class="dp-banner-page">
    <SearchForm
      :model-value="searchParams"
      :schema="searchSchema"
      @update:model-value="handleSearchModelUpdate"
      @search="onSearch"
    />
    <ProTable ref="tableRef" :columns="columns" :load-data="loadData">
      <template #toolbar-left>
        <el-button v-permission="'banner:create'" type="primary" @click="openDialog()">新建轮播</el-button>
      </template>
      <template #image="{ row }">
        <el-image :src="resolveBannerImage(row.image)" style="width: 120px; height: 40px; border-radius: 4px" />
      </template>
      <template #type="{ row }">
        <span>{{ BANNER_TYPE[row.type]?.label }}</span>
      </template>
      <template #target="{ row }">
        <span>{{ row.target_title || '—' }}</span>
      </template>
      <template #actions="{ row }">
        <el-space>
          <el-button v-permission="'banner:update'" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-permission="'banner:delete'" link type="danger" @click="handleDelete(row)">删除</el-button>
        </el-space>
      </template>
    </ProTable>

    <el-dialog v-model="visible" :title="form.id ? '编辑轮播' : '新建轮播'" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="图片 3:1" prop="image">
          <UploadImage v-model="form.image" folder="banner" ratio="3:1" use-object-key />
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="跳转类型" prop="type">
          <el-select v-model="form.type" @change="onTypeChange">
            <el-option v-for="(item, key) in BANNER_TYPE" :key="key" :label="item.label" :value="Number(key)" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="Number(form.type) === 2" label="资源类型" prop="resource_type">
          <el-select v-model="form.resource_type" placeholder="请选择资源类型" @change="onResourceTypeChange">
            <el-option v-for="(item, key) in RESOURCE_TYPE" :key="key" :label="item.label" :value="Number(key)" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转目标" prop="target_id">
          <TargetPicker
            v-model:id="form.target_id"
            v-model:title="targetTitle"
            :type="Number(form.type)"
            :resource-type="form.resource_type"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="1" :max="9999" />
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
import UploadImage from '@/components/UploadImage/index.vue'
import TargetPicker from '@/components/TargetPicker/index.vue'
import { BANNER_TYPE, RESOURCE_TYPE, STATUS_ENABLE } from '@/utils/enums'
import { createBanner, deleteBanner, getBannerList, updateBanner } from '@/api/banner'
import { useTable } from '@/hooks/useTable'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'

const { tableRef, searchParams, loadData, onSearch } = useTable({
  loadApi: getBannerList,
  defaultParams: { keyword: '', status: '', type: '' },
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
  { prop: 'image', label: '图片', width: 140, slot: 'image' },
  { prop: 'title', label: '标题', minWidth: 140 },
  { prop: 'type', label: '类型', width: 100, slot: 'type' },
  { prop: 'target', label: '目标', minWidth: 160, slot: 'target' },
  { prop: 'sort', label: '排序', width: 80 },
  { prop: 'status', label: '状态', width: 90, dict: STATUS_ENABLE },
  { prop: 'actions', label: '操作', width: 140, fixed: 'right', slot: 'actions' },
]

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const targetTitle = ref('')
const form = reactive({
  id: null,
  image: '',
  title: '',
  type: 1,
  resource_type: null,
  target_id: null,
  sort: 1,
  status: 1,
})

const rules = {
  image: [{ required: true, message: '请上传图片', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  resource_type: [
    {
      validator: (_rule, value, callback) => {
        // 仅资源类型需要强制选择 resource_type，其他类型直接放行
        if (Number(form.type) === 2 && !value) {
          callback(new Error('请选择资源类型'))
          return
        }
        callback()
      },
      trigger: 'change',
    },
  ],
  target_id: [{ required: true, message: '请选择跳转目标', trigger: 'change' }],
}

function handleSearchModelUpdate(value) {
  Object.assign(searchParams, value || {})
}

function resolveBannerImage(value) {
  return resolveMediaPreviewUrl(value)
}

function onTypeChange() {
  // 切换主类型后，旧的目标和资源子类型都可能不匹配，统一清空
  if (Number(form.type) !== 2) {
    form.resource_type = null
  }
  form.target_id = null
  targetTitle.value = ''
}

function onResourceTypeChange() {
  // 资源子类型变化后，目标列表范围变化，需清空已选目标
  form.target_id = null
  targetTitle.value = ''
}

function openDialog(row) {
  if (row?.id) {
    Object.assign(form, {
      id: row.id,
      image: row.image,
      title: row.title,
      type: row.type,
      resource_type: row.resource_type ?? null,
      target_id: row.target_id,
      sort: row.sort,
      status: row.status,
    })
    targetTitle.value = row.target_title || ''
  } else {
    Object.assign(form, {
      id: null,
      image: '',
      title: '',
      type: 1,
      resource_type: null,
      target_id: null,
      sort: 1,
      status: 1,
    })
    targetTitle.value = ''
  }
  visible.value = true
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  if (!form.target_id || Number(form.target_id) <= 0) {
    ElMessage.error('请先选择跳转目标')
    return
  }
  submitting.value = true
  try {
    const payload = { ...form }
    if (form.id) {
      await updateBanner(form.id, payload)
    } else {
      await createBanner(payload)
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
    await ElMessageBox.confirm('确认删除该轮播？', '提示', { type: 'warning' })
    await deleteBanner(row.id)
    ElMessage.success('已删除')
    tableRef.value?.refresh()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}
</script>
