<template>
  <div class="dp-upload-image-list">
    <el-upload
      :show-file-list="false"
      :auto-upload="false"
      accept="image/jpeg,image/png,image/webp"
      :on-change="handleChange"
      :disabled="urls.length >= maxCount"
    >
      <el-button type="primary" :disabled="urls.length >= maxCount">上传图片</el-button>
    </el-upload>
    <p class="tip">最多 {{ maxCount }} 张，可拖拽排序；点击缩略图预览。</p>

    <draggable
      v-if="sortable"
      v-model="urls"
      class="thumb-list"
      :item-key="(u) => u"
      handle=".drag-handle"
      animation="200"
    >
      <template #item="{ element, index }">
        <div class="thumb-item">
          <span class="drag-handle" title="拖拽排序">⋮⋮</span>
          <el-image
            :src="resolveMediaPreviewUrl(element)"
            fit="cover"
            class="thumb"
            @click="openPreview(element)"
          />
          <el-button class="del" circle size="small" type="danger" @click="removeAt(index)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </template>
    </draggable>

    <div v-else class="thumb-list">
      <div v-for="(u, index) in urls" :key="`${u}-${index}`" class="thumb-item">
        <el-image :src="resolveMediaPreviewUrl(u)" fit="cover" class="thumb" @click="openPreview(u)" />
        <el-button class="del" circle size="small" type="danger" @click="removeAt(index)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <el-dialog v-model="previewVisible" title="预览" width="640px">
      <img :src="resolveMediaPreviewUrl(previewUrl)" alt="" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { useUpload } from '@/hooks/useUpload'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'

const urls = defineModel('urls', { type: Array, default: () => [] })

const props = defineProps({
  /** 是否启用拖拽排序 */
  sortable: { type: Boolean, default: true },
  /** 最大张数 */
  maxCount: { type: Number, default: 10 },
  /** 上传到 mock 的目录名 */
  folder: { type: String, default: 'product' },
  /** 上传后是否返回 objectKey（业务落库字段建议开启） */
  useObjectKey: { type: Boolean, default: false },
})

const { upload } = useUpload()
const previewVisible = ref(false)
const previewUrl = ref('')

function openPreview(url) {
  previewUrl.value = url
  previewVisible.value = true
}

function removeAt(index) {
  const next = [...urls.value]
  next.splice(index, 1)
  urls.value = next
}

async function handleChange(file) {
  if (!file?.raw) return
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.raw.type)
  if (!isImage) {
    ElMessage.error('仅支持 jpg/png/webp')
    return
  }
  if (urls.value.length >= props.maxCount) {
    ElMessage.warning(`最多上传 ${props.maxCount} 张`)
    return
  }
  try {
    const url = await upload(file.raw, props.folder, { returnObjectKey: props.useObjectKey })
    urls.value = [...urls.value, url]
  } catch (e) {
    ElMessage.error(e?.message || '上传失败')
  }
}
</script>

<style scoped>
.dp-upload-image-list {
  width: 100%;
}

.tip {
  margin: 8px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.thumb-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.thumb-item {
  position: relative;
  width: 120px;
  height: 80px;
}

.drag-handle {
  position: absolute;
  left: 4px;
  top: 4px;
  z-index: 2;
  cursor: grab;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 0 2px #000;
}

.thumb {
  width: 120px;
  height: 80px;
  border-radius: 6px;
  cursor: zoom-in;
}

.del {
  position: absolute;
  right: 4px;
  top: 4px;
  z-index: 2;
}
</style>
