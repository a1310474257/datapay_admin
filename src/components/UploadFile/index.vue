<template>
  <div class="dp-upload-file">
    <el-upload
      :file-list="fileList"
      :auto-upload="false"
      :limit="1"
      :accept="accept"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :before-upload="beforeUpload"
    >
      <el-button type="primary" :loading="uploading">选择文件</el-button>
    </el-upload>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useUpload } from '@/hooks/useUpload'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  accept: {
    type: String,
    default: '.pdf,.doc,.docx,.zip,.mp4',
  },
  maxSize: {
    type: Number,
    default: 50,
  },
  autoExtractMeta: {
    type: Boolean,
    default: false,
  },
  /**
   * 为 true 时上传成功后向父组件 emit objectKey（BOS 对象路径，不含 host），
   * 用于受保护文件（资源正文等）——后端通过 /api/file/{objectKey} 代理下载。
   * 为 false（默认）时 emit 完整公开 URL，适用于封面图、预览文件等公开资源。
   */
  useObjectKey: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'meta-extracted'])
const { uploading, upload } = useUpload()

const fileList = computed(() => {
  if (!props.modelValue) return []
  const name = decodeURIComponent(props.modelValue.split('/').pop() || 'file')
  // useObjectKey 模式下 modelValue 是 objectKey，不是可访问的 URL，
  // 不传 url 字段以避免 Element Plus 渲染无效的预览链接。
  const url = props.useObjectKey ? undefined : props.modelValue
  return [{ name, url }]
})

function beforeUpload(file) {
  const isValidSize = file.size / 1024 / 1024 <= props.maxSize
  if (!isValidSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

function handleRemove() {
  emit('update:modelValue', '')
}

function extractVideoMeta(rawFile) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(rawFile)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve({ duration: Math.round(video.duration || 0) })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('视频元数据提取失败'))
    }
    video.src = url
  })
}

async function handleChange(file) {
  if (!file?.raw) return
  if (!beforeUpload(file.raw)) return
  try {
    const value = await upload(file.raw, 'file', { returnObjectKey: props.useObjectKey })
    emit('update:modelValue', value)

    // 仅在开启配置且为视频文件时，向外抛出时长等元信息。
    if (props.autoExtractMeta && String(file.raw.type).startsWith('video/')) {
      const meta = await extractVideoMeta(file.raw)
      emit('meta-extracted', meta)
    }
  } catch (error) {
    ElMessage.error(error?.message || '上传失败')
  }
}
</script>
