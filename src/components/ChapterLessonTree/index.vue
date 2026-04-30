<template>
  <div class="dp-chapter-lesson-tree">
    <el-space class="toolbar">
      <el-button type="primary" @click="addChapter">新增章节</el-button>
      <el-button type="success" :loading="loading" @click="handleSave">批量保存</el-button>
    </el-space>

    <draggable
      v-model="tree"
      :item-key="(ch) => ch.id ?? ch._tempId"
      handle=".ch-drag"
      animation="200"
      @end="syncChapterSort"
    >
      <template #item="{ element: ch, index: ci }">
        <el-card class="chapter-card" shadow="never">
          <div class="chapter-head">
            <span class="ch-drag drag-hint" title="拖拽排序">⋮⋮</span>
            <el-input v-model="ch.title" placeholder="章节标题" class="ch-title" />
            <el-input-number v-model="ch.sort" :min="1" :max="9999" />
            <el-button type="primary" link @click="addLesson(ch)">新增课时</el-button>
            <el-button type="danger" link @click="removeChapter(ci)">删除章节</el-button>
          </div>

          <draggable
            v-model="ch.lessons"
            :item-key="(les) => les.id ?? les._tempId"
            handle=".ls-drag"
            animation="200"
            class="lesson-wrap"
            @end="() => syncLessonSort(ch)"
          >
            <template #item="{ element: les, index: li }">
              <div class="lesson-row">
                <span class="ls-drag drag-hint" title="拖拽">⋮</span>
                <el-input v-model="les.title" placeholder="课时标题" class="grow" />
                <!-- 时长输入 + 旁边格式化显示（秒 → 分:秒） -->
                <div class="duration-wrap">
                  <el-input-number v-model="les.duration_sec" :min="0" placeholder="时长(秒)" />
                  <span v-if="les.duration_sec > 0" class="duration-fmt">{{ formatSec(les.duration_sec) }}</span>
                </div>
                <el-switch v-model="les.is_free" :active-value="1" :inactive-value="0" active-text="试看" />
                <!-- use-object-key：视频落库 objectKey；管理员通过 /api/file 直通 BOS 预览 -->
                <UploadFile
                  v-model="les.video_url"
                  :init-name="les.video_name"
                  accept=".mp4,.mov"
                  :use-object-key="true"
                  :auto-extract-meta="true"
                  @meta-extracted="(m) => onVideoMeta(les, m)"
                  @name-resolved="(name) => { les.video_name = name }"
                />
                <!-- 视频预览：携带 JWT 通过 fetch 拉取 blob，在弹窗内播放 -->
                <el-button
                  v-if="les.video_url"
                  link
                  type="primary"
                  :loading="previewingId === getUid(les)"
                  @click="openVideoPreview(les)"
                >预览</el-button>
                <el-button type="danger" link @click="removeLesson(ch, li)">删除</el-button>
              </div>
            </template>
          </draggable>
        </el-card>
      </template>
    </draggable>

    <!-- 视频预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="720px"
      destroy-on-close
      @closed="onPreviewClosed"
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>视频加载中，请稍候…</span>
      </div>
      <video
        v-else-if="previewBlobUrl"
        :src="previewBlobUrl"
        controls
        class="preview-video"
      />
      <el-empty v-else description="视频加载失败" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import UploadFile from '@/components/UploadFile/index.vue'
import { resolveMediaPreviewUrl } from '@/utils/mediaUrl'
import { fetchBlobUrl } from '@/utils/download'

const tree = defineModel('tree', { type: Array, default: () => [] })

defineProps({
  courseId: {
    type: [Number, String],
    default: '',
  },
  /** 保存按钮 loading */
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save'])

// ─── 视频预览弹窗状态 ────────────────────────────────────────────────────────
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewBlobUrl = ref('')
const previewTitle = ref('视频预览')
/** 当前正在加载预览的课时唯一标识（用于按钮 loading）*/
const previewingId = ref(null)
/** 当前 blob URL 的清理函数，弹窗关闭后释放内存 */
let _revokePreview = null

/**
 * 取课时的唯一标识：已保存的用 id，新建未保存的用内存引用。
 * 用于匹配"预览"按钮的 loading 状态。
 */
function getUid(les) {
  return les.id ?? les
}

async function openVideoPreview(les) {
  const uid = getUid(les)
  previewingId.value = uid
  previewLoading.value = true
  previewVisible.value = true
  previewTitle.value = les.title || '视频预览'
  previewBlobUrl.value = ''

  try {
    const { blobUrl, revoke } = await fetchBlobUrl(resolveMediaPreviewUrl(les.video_url))
    previewBlobUrl.value = blobUrl
    _revokePreview = revoke
  } catch {
    // fetchBlobUrl 内部已弹 ElMessage，此处关闭弹窗即可
    previewVisible.value = false
  } finally {
    previewLoading.value = false
    previewingId.value = null
  }
}

function onPreviewClosed() {
  // 释放 blob URL，防止内存泄漏
  if (_revokePreview) {
    _revokePreview()
    _revokePreview = null
  }
  previewBlobUrl.value = ''
}

// ─── 生成临时唯一 ID（用于新建但尚未保存的章节/课时的 item-key）─────────────
// vuedraggable 的 item-key 函数只接收 element 一个参数，无法用数组 index 兜底，
// 因此对所有新建项手动分配 _tempId，避免多个新项 key 相同导致 diff 失效。
let _tempIdSeq = 0
function nextTempId() {
  return `_tmp_${Date.now()}_${++_tempIdSeq}`
}

// ─── 章节 CRUD ───────────────────────────────────────────────────────────────
function addChapter() {
  // 直接 push 到响应式数组，触发 vuedraggable 的追踪依赖刷新
  tree.value.push({
    _tempId: nextTempId(),
    title: `新章节 ${tree.value.length + 1}`,
    sort: tree.value.length + 1,
    lessons: [],
  })
}

async function removeChapter(index) {
  try {
    await ElMessageBox.confirm(
      '确认删除该章节及其所有课时？删除后需点击"批量保存"才会生效。',
      '删除章节',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    // 直接对响应式数组原地 splice，避免替换数组引用时 vuedraggable 响应不及时的问题
    tree.value.splice(index, 1)
  } catch {
    // 用户取消，不做任何操作
  }
}

// ─── 课时 CRUD ───────────────────────────────────────────────────────────────
function addLesson(ch) {
  if (!ch.lessons) ch.lessons = []
  ch.lessons.push({
    _tempId: nextTempId(),
    title: `课时 ${ch.lessons.length + 1}`,
    duration_sec: 0,
    video_url: '',
    video_name: '',
    is_free: 0,
    sort: ch.lessons.length + 1,
  })
}

async function removeLesson(ch, index) {
  try {
    await ElMessageBox.confirm(
      '确认删除该课时？删除后需点击"批量保存"才会生效。',
      '删除课时',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
    ch.lessons.splice(index, 1)
  } catch {
    // 用户取消，不做任何操作
  }
}

function onVideoMeta(les, meta) {
  if (meta?.duration != null) {
    les.duration_sec = meta.duration
  }
}

// ─── 拖拽后自动同步 sort 字段 ──────────────────────────────────────────────
/**
 * 章节拖拽结束后，按当前显示顺序重新写入 sort，
 * 保证"批量保存"提交的 sort 与拖拽后顺序一致。
 */
function syncChapterSort() {
  tree.value.forEach((ch, i) => { ch.sort = i + 1 })
}

/**
 * 课时拖拽结束后，按当前显示顺序重新写入 sort。
 */
function syncLessonSort(ch) {
  if (Array.isArray(ch.lessons)) {
    ch.lessons.forEach((les, i) => { les.sort = i + 1 })
  }
}

// ─── 批量保存（加确认提示） ──────────────────────────────────────────────────
async function handleSave() {
  try {
    await ElMessageBox.confirm(
      '保存将先删除所有旧章节和课时，再按当前内容重新创建，确认继续？',
      '确认保存',
      { type: 'warning', confirmButtonText: '确认保存', cancelButtonText: '取消' },
    )
    emit('save')
  } catch {
    // 取消，不做任何操作
  }
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────
/**
 * 将秒数格式化为 m:ss 可读字符串，方便编辑者直观确认时长。
 * 例如 125 → "2:05"，0 → 不显示（由 v-if 控制）
 */
function formatSec(sec) {
  const s = Math.round(Number(sec) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}

.chapter-card {
  margin-bottom: 12px;
}

.chapter-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.ch-title {
  flex: 1;
  min-width: 200px;
}

.drag-hint {
  cursor: grab;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.lesson-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* 时长输入区：数字框 + 格式化文字并排 */
.duration-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.duration-fmt {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.grow {
  flex: 1;
  min-width: 160px;
}

/* 视频预览弹窗内容区 */
.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.preview-loading .is-loading {
  font-size: 32px;
  animation: rotating 1.5s linear infinite;
}

.preview-video {
  width: 100%;
  max-height: 420px;
  display: block;
  background: #000;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
