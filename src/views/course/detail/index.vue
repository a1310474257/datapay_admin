<template>
  <div class="dp-course-detail">
    <el-card>
      <template #header>
        <div class="header-wrap">
          <span>{{ isCreateMode ? '新建课程' : `课程详情 #${route.params.id}` }}</span>
          <el-space>
            <el-button @click="goBack">返回列表</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
          </el-space>
        </div>
      </template>

      <el-tabs v-model="activeTab">
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
              <UploadImage v-model="formModel.cover" folder="course" ratio="16:9" />
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
        <el-tab-pane label="章节课时" name="chapter">
          <el-empty description="P1 阶段支持" />
        </el-tab-pane>
        <el-tab-pane label="配套资料" name="material">
          <el-empty description="P1 阶段支持" />
        </el-tab-pane>
        <el-tab-pane label="其他配置" name="other">
          <el-empty description="P1 阶段支持" />
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
import { createCourse, findCourseById, updateCourse } from '@/api/course'
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
  router.push('/course/list')
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
