<template>
  <div class="dp-system-privacy">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>隐私协议</span>
          <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="协议标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="协议内容" prop="content">
          <RichEditor v-model="form.content" :height="520" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import RichEditor from '@/components/RichEditor/index.vue'
import { getPrivacyAgreement, updatePrivacyAgreement } from '@/api/appConfig'

const formRef = ref(null)
const submitting = ref(false)
const form = reactive({
  title: '',
  content: '',
})

const rules = {
  title: [{ required: true, message: '请输入协议标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入协议内容', trigger: 'change' }],
}

async function loadData() {
  const data = await getPrivacyAgreement()
  form.title = data?.title || '隐私协议'
  form.content = data?.content || ''
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  try {
    await updatePrivacyAgreement({ ...form })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.dp-system-privacy {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
