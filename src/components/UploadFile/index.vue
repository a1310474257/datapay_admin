<template>
  <div class="dp-upload-file">
    <el-upload
      :file-list="fileList"
      :auto-upload="false"
      :limit="1"
      :accept="accept"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :before-upload="beforeUpload"
    >
      <el-button type="primary" :loading="uploading">
        {{ syncing ? '云端同步中...' : uploading ? `上传中 ${uploadProgress}%` : '选择文件' }}
      </el-button>
    </el-upload>
    <el-progress
      v-if="uploading"
      :percentage="uploadProgress"
      :status="syncing ? 'striped' : undefined"
      :striped="syncing"
      :striped-flow="syncing"
      :duration="syncing ? 10 : 0"
      :stroke-width="6"
      style="margin-top: 8px; width: 320px"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUpload } from '@/hooks/useUpload'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'

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
  folder: {
    type: String,
    default: 'file',
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
  /**
   * 初始化时注入已知的原始文件名（如从数据库回显的 videoName）。
   * 用于解决 objectKey 模式下文件列表显示 BOS UUID 的问题。
   */
  initName: {
    type: String,
    default: '',
  },
})

/**
 * name-resolved：上传成功后 emit 原始文件名，
 * 父组件可将其持久化（如 les.video_name），以便下次回显时显示友好文件名而非 BOS UUID。
 * size-resolved：上传成功后 emit 格式化后的文件大小字符串（如 "1.2 MB"），
 * 父组件可将其持久化，用于列表展示。
 */
const emit = defineEmits(['update:modelValue', 'meta-extracted', 'name-resolved', 'size-resolved', 'uploaded'])

/** 将字节数格式化为人类可读的文件大小字符串 */
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
const { uploading, uploadProgress, syncing, upload } = useUpload()

// 记录用户选择文件时的原始文件名，避免上传后文件列表显示 BOS 生成的 UUID 名称。
// 组件卸载后会丢失，这是可接受的（从已有数据回显时降级为 URL 末段文件名）。
const displayName = ref('')

/**
 * 检测字符串去掉扩展名后是否为纯 UUID/十六进制，
 * 是则说明是 BOS 生成的无意义对象键，不适合直接展示给用户。
 */
function looksLikeUuid(str) {
  const base = str.replace(/\.[^.]+$/, '')
  return (
    /^[0-9a-f]{32}$/i.test(base) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(base)
  )
}

const fileList = computed(() => {
  if (!props.modelValue) return []
  // 取 URL / objectKey 路径最后一段作为最终降级名称
  const rawSegment = decodeURIComponent(props.modelValue.split('/').pop() || 'file')
  // useObjectKey 模式下最后一段往往是 BOS 生成的 UUID，不友好；替换为通用提示文案
  const fallbackName = (props.useObjectKey && looksLikeUuid(rawSegment)) ? '已上传文件' : rawSegment
  // 优先级：本次上传时记录的名称 > 父级注入的历史文件名 > 路径末段（降级）
  const name = displayName.value || props.initName || fallbackName
  // useObjectKey 模式下 modelValue 是 objectKey，需经 /api/file 代理转为可访问 URL，
  // 这样用户可以点击文件名进行预览/下载，同时 modelValue 仍保持 objectKey 不变。
  const url = props.useObjectKey ? resolveMediaPreviewUrl(props.modelValue) : props.modelValue
  return [{ name, url }]
})

function beforeUpload(file) {
  // 视频文件不限制大小（支持3G+大视频），其他文件按 maxSize 限制
  const isVideo = String(file?.type || '').startsWith('video/')
  if (!isVideo && props.maxSize > 0) {
    const isValidSize = file.size / 1024 / 1024 <= props.maxSize
    if (!isValidSize) {
      ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
      return false
    }
  }
  return true
}

function handleRemove() {
  displayName.value = ''
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
  // 上传前记录原始文件名，上传成功后可在文件列表中显示真实名称而非 BOS UUID
  displayName.value = file.raw.name || ''
  try {
    const value = await upload(file.raw, props.folder, {
      returnObjectKey: props.useObjectKey,
      onProgress: (pct) => { /* uploadProgress 已在 useUpload 内部更新 */ void pct },
    })
    emit('update:modelValue', value)
    // 上传成功后向外同步原始文件名，父组件可持久化以供下次回显
    if (displayName.value) emit('name-resolved', displayName.value)
    // 上传成功后向外同步格式化文件大小，父组件可持久化用于列表展示
    const sizeStr = formatFileSize(file.raw.size)
    if (sizeStr) emit('size-resolved', sizeStr)

    // 仅在开启配置且为视频文件时，向外抛出时长等元信息。
    if (props.autoExtractMeta && String(file.raw.type).startsWith('video/')) {
      const meta = await extractVideoMeta(file.raw)
      emit('meta-extracted', meta)
    }
    emit('uploaded', {
      value,
      name: displayName.value,
      size: sizeStr,
      raw: file.raw,
    })
  } catch (error) {
    displayName.value = ''
    ElMessage.error(error?.message || '上传失败')
  }
}

/**
 * 超出 limit=1 时直接用新文件覆盖，实现"替换"效果。
 * 与 UploadImage 组件的 handleExceed 逻辑保持一致。
 */
function handleExceed(files) {
  const latest = files?.[0]
  if (!latest) return
  handleChange({ raw: latest })
}
</script>
