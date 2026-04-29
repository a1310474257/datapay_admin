<template>
  <div class="dp-upload-image">
    <el-upload
      class="uploader"
      :file-list="fileList"
      :limit="1"
      list-type="picture-card"
      :auto-upload="false"
      :show-file-list="true"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-preview="handlePreview"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
      accept="image/jpeg,image/png,image/webp"
    >
      <el-icon v-if="!modelValue" class="uploader-icon"><Plus /></el-icon>
      <template v-else>
        <el-icon class="uploader-icon"><Refresh /></el-icon>
      </template>
    </el-upload>

    <div v-if="ratio" class="ratio-tip">建议比例：{{ ratio }}</div>

    <el-dialog v-model="previewVisible" title="图片预览" width="520px">
      <img class="preview-image" :src="previewUrl" alt="preview" />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUpload } from '@/hooks/useUpload'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  folder: {
    type: String,
    default: 'default',
  },
  maxSize: {
    type: Number,
    default: 2,
  },
  ratio: {
    type: String,
    default: '',
  },
  /**
   * 为 true 时上传后返回 objectKey，并通过 /api/file/{objectKey} 进行预览。
   * 适用于受保护文件访问场景（需登录/鉴权的中转下载）。
   */
  useObjectKey: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const { upload } = useUpload()

const previewVisible = ref(false)
const previewUrl = ref('')

function resolveImageUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  if (value.startsWith('image/')) return `/api/file/image?key=${value}`
  return `/api/file/${encodeURIComponent(value)}`
}

// 根据外部值回显文件列表，保持 Upload 组件与 v-model 同步。
const fileList = computed(() => {
  if (!props.modelValue) return []
  const name = decodeURIComponent(props.modelValue.split('/').pop() || 'image')
  return [{ name, url: resolveImageUrl(props.modelValue) }]
})

function beforeUpload(file) {
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (!isImage) {
    ElMessage.error('仅支持 jpg/png/webp 图片')
    return false
  }
  const isValidSize = file.size / 1024 / 1024 <= props.maxSize
  if (!isValidSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

async function handleChange(file) {
  if (!file?.raw) return
  if (!beforeUpload(file.raw)) return
  try {
    const value = await upload(file.raw, props.folder, { returnObjectKey: props.useObjectKey })
    emit('update:modelValue', value)
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}

function handleRemove() {
  emit('update:modelValue', '')
}

function handlePreview(file) {
  previewUrl.value = file.url || resolveImageUrl(props.modelValue)
  previewVisible.value = true
}

function handleExceed(files) {
  // 触发超限时直接使用最新文件覆盖，满足“替换图片”体验。
  const latest = files?.[0]
  if (!latest) return
  handleChange({ raw: latest })
}
</script>

<style scoped>
.dp-upload-image {
  width: 100%;
}

.uploader {
  width: 140px;
}

.uploader-icon {
  font-size: 22px;
}

.ratio-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.preview-image {
  width: 100%;
  display: block;
}

.dp-upload-image :deep(.el-upload-list__item-actions) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dp-upload-image :deep(.el-upload) {
  position: relative;
}
</style>
