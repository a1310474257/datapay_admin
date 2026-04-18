<template>
  <div class="dp-chapter-lesson-tree">
    <el-space class="toolbar">
      <el-button type="primary" @click="addChapter">新增章节</el-button>
      <el-button type="success" :loading="loading" @click="emit('save')">批量保存</el-button>
    </el-space>

    <draggable v-model="tree" :item-key="(ch, index) => ch.id ?? `ch-${index}`" handle=".ch-drag" animation="200">
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
            :item-key="(les, index) => les.id ?? `ls-${index}`"
            handle=".ls-drag"
            animation="200"
            class="lesson-wrap"
          >
            <template #item="{ element: les, index: li }">
              <div class="lesson-row">
                <span class="ls-drag drag-hint" title="拖拽">⋮</span>
                <el-input v-model="les.title" placeholder="课时标题" class="grow" />
                <el-input-number v-model="les.duration_sec" :min="0" placeholder="时长(秒)" />
                <el-switch v-model="les.is_free" :active-value="1" :inactive-value="0" active-text="试看" />
                <UploadFile
                  v-model="les.video_url"
                  accept=".mp4"
                  :auto-extract-meta="true"
                  @meta-extracted="(m) => onVideoMeta(les, m)"
                />
                <el-button type="danger" link @click="removeLesson(ch, li)">删除</el-button>
              </div>
            </template>
          </draggable>
        </el-card>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import UploadFile from '@/components/UploadFile/index.vue'

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

function addChapter() {
  tree.value = [
    ...tree.value,
    {
      title: `新章节 ${tree.value.length + 1}`,
      sort: tree.value.length + 1,
      lessons: [],
    },
  ]
}

function removeChapter(index) {
  const next = [...tree.value]
  next.splice(index, 1)
  tree.value = next
}

function addLesson(ch) {
  if (!ch.lessons) ch.lessons = []
  ch.lessons.push({
    title: `课时 ${ch.lessons.length + 1}`,
    duration_sec: 0,
    video_url: '',
    is_free: 0,
    sort: ch.lessons.length + 1,
  })
}

function removeLesson(ch, index) {
  ch.lessons.splice(index, 1)
}

function onVideoMeta(les, meta) {
  if (meta?.duration != null) {
    les.duration_sec = meta.duration
  }
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

.grow {
  flex: 1;
  min-width: 160px;
}

.video {
  min-width: 200px;
  flex: 1;
}
</style>
