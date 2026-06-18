<template>
  <div class="dp-product-detail">
    <el-card class="page-header" shadow="never">
      <div class="header-wrap">
        <div class="title-wrap">
          <div class="header-title">{{ isCreate ? '新建商品' : `商品详情 #${route.params.id}` }}</div>
          <div class="header-subtitle">商品基础信息、轮播图与规格统一维护</div>
        </div>
        <el-space>
          <el-button @click="goBack">返回列表</el-button>
          <el-button v-if="activeTab === 'base'" type="primary" :loading="submitting" @click="saveBase">
            保存商品
          </el-button>
          <el-button v-if="activeTab === 'images' && !isCreate" type="primary" :loading="imgSaving" @click="saveImg">
            保存轮播图
          </el-button>
          <el-button v-if="activeTab === 'spec' && !isCreate" type="primary" :loading="specSaving" @click="saveSpec">
            保存规格
          </el-button>
        </el-space>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="base">
          <el-alert
            class="mb"
            title="所有规格组合共享主表价格与库存。"
            type="info"
            show-icon
            :closable="false"
          />
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="分类" prop="category_id">
              <DictSelect v-model="form.category_id" dict-key="category" />
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" maxlength="120" />
            </el-form-item>
            <el-form-item label="封面" prop="cover">
              <UploadImage v-model="form.cover" folder="product" ratio="1:1" use-object-key />
            </el-form-item>
            <el-form-item label="卖点" prop="brief">
              <el-input v-model="form.brief" type="textarea" :rows="2" maxlength="200" show-word-limit />
            </el-form-item>
            <el-form-item label="详情" prop="description">
              <RichEditor v-model="form.description" :height="320" />
            </el-form-item>
            <el-form-item label="售价" prop="price">
              <PriceInput v-model="form.price" />
            </el-form-item>
            <el-form-item label="库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :max="999999" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="轮播图" name="images" :disabled="isCreate">
          <UploadImageList v-model:urls="images" sortable :max-count="10" folder="product" use-object-key />
        </el-tab-pane>
        <el-tab-pane label="规格" name="spec" :disabled="isCreate">
          <SpecEditor v-model="specs" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DictSelect from '@/components/DictSelect/index.vue'
import UploadImage from '@/components/UploadImage/index.vue'
import RichEditor from '@/components/RichEditor/index.vue'
import PriceInput from '@/components/PriceInput/index.vue'
import UploadImageList from '@/components/UploadImageList/index.vue'
import SpecEditor from '@/components/SpecEditor/index.vue'
import { createProduct, findProductById, saveImages, saveSpecs, updateProduct } from '@/api/product'
import { useDictStore } from '@/stores/dict'

const route = useRoute()
const router = useRouter()
const dictStore = useDictStore()
const isCreate = computed(() => route.params.id === 'new')

const activeTab = ref('base')
const formRef = ref(null)
const submitting = ref(false)
const imgSaving = ref(false)
const specSaving = ref(false)

const form = reactive({
  category_id: undefined,
  title: '',
  cover: '',
  brief: '',
  description: '',
  price: 0,
  stock: 0,
  status: 1,
})

const rules = {
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面', trigger: 'change' }],
  description: [{ required: true, message: '请输入详情', trigger: 'change' }],
}

const images = ref([])
const specs = ref([])

async function load() {
  if (isCreate.value) return
  try {
    const data = await findProductById(route.params.id)
    Object.assign(form, {
      category_id: data.category_id,
      title: data.title,
      cover: data.cover,
      brief: data.brief || '',
      description: data.description,
      price: data.price,
      stock: data.stock,
      status: data.status,
    })
    images.value = data.images?.length ? [...data.images] : []
    specs.value = data.specs?.length ? JSON.parse(JSON.stringify(data.specs)) : []
  } catch (e) {
    ElMessage.error(e?.message || '加载失败')
    goBack()
  }
}

async function saveBase() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    if (isCreate.value) {
      const row = await createProduct({
        ...form,
        images: images.value,
        specs: specs.value,
      })
      ElMessage.success('创建成功')
      router.replace(`/product/detail/${row.id}`)
      return
    }
    await updateProduct(route.params.id, { ...form })
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function saveImg() {
  imgSaving.value = true
  try {
    await saveImages(route.params.id, images.value)
    ElMessage.success('轮播已保存')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    imgSaving.value = false
  }
}

async function saveSpec() {
  specSaving.value = true
  try {
    await saveSpecs(route.params.id, specs.value)
    ElMessage.success('规格已保存')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    specSaving.value = false
  }
}

function goBack() {
  router.replace({
    path: '/product/list',
    query: { t: String(Date.now()) },
  })
}

onMounted(async () => {
  await dictStore.loadCategory()
  load()
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

.mb {
  margin-bottom: 12px;
}
</style>
