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
})

const emit = defineEmits(['update:modelValue', 'meta-extracted'])
const { uploading, upload } = useUpload()

const fileList = computed(() => {
  if (!props.modelValue) return []
  const name = decodeURIComponent(props.modelValue.split('/').pop() || 'file')
  return [{ name, url: props.modelValue }]
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
    const url = await upload(file.raw, 'file')
    emit('update:modelValue', url)

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
