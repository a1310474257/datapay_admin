<template>
  <div class="chapter-tree">
    <!-- 工具栏 -->
    <div class="chapter-tree__toolbar">
      <el-button type="primary" @click="addChapter">
        <el-icon><Plus /></el-icon> 添加章节
      </el-button>
      <el-button type="success" :loading="loading" @click="handleSave">
        <el-icon><Check /></el-icon> 保存章节&课时
      </el-button>
    </div>

    <el-empty v-if="!localTree.length" description="暂无章节，点击「添加章节」开始编辑" />

    <!-- 章节列表 -->
    <div
      v-for="(chapter, ci) in localTree"
      :key="chapter._key"
      class="chapter-block"
    >
      <!-- 章节头 -->
      <div class="chapter-block__header">
        <span class="chapter-block__index">第 {{ ci + 1 }} 章</span>
        <el-input
          v-model="chapter.title"
          placeholder="章节标题（必填）"
          class="chapter-block__title"
          size="default"
        />
        <el-tooltip content="上移">
          <el-button :disabled="ci === 0" link @click="moveChapter(ci, -1)">↑</el-button>
        </el-tooltip>
        <el-tooltip content="下移">
          <el-button :disabled="ci === localTree.length - 1" link @click="moveChapter(ci, 1)">↓</el-button>
        </el-tooltip>
        <el-button type="primary" link size="small" @click="addLesson(chapter)">
          <el-icon><Plus /></el-icon> 添加课时
        </el-button>
        <el-button type="danger" link size="small" @click="removeChapter(ci)">
          <el-icon><Delete /></el-icon> 删除章节
        </el-button>
      </div>

      <!-- 课时列表 -->
      <div class="lesson-list">
        <el-empty v-if="!chapter.lessons.length" :image-size="40" description="暂无课时" />

        <div
          v-for="(lesson, li) in chapter.lessons"
          :key="lesson._key"
          class="lesson-row"
        >
          <span class="lesson-row__index">课时 {{ li + 1 }}</span>

          <el-input
            v-model="lesson.title"
            placeholder="课时标题"
            class="lesson-row__title"
            size="small"
          />

          <div class="lesson-row__meta">
            <el-tooltip content="时长（秒），上传视频后自动填充，也可手动填写">
              <el-input-number
                v-model="lesson.duration_sec"
                :min="0"
                :step="1"
                size="small"
                style="width: 110px"
                placeholder="时长(秒)"
              />
            </el-tooltip>

            <el-switch
              v-model="lesson.is_free"
              :active-value="1"
              :inactive-value="0"
              active-text="免费试看"
              inactive-text="付费"
              size="small"
              style="flex-shrink:0"
            />
          </div>

          <!-- 视频上传（上传后自动提取时长） -->
          <div class="lesson-row__video">
            <UploadFile
              v-model="lesson.video_url"
              folder="video"
              accept=".mp4,.mov,.avi,.mkv"
              :use-object-key="true"
              :max-size="0"
              :auto-extract-meta="true"
              :init-name="lesson.video_name"
              @name-resolved="(n) => (lesson.video_name = n)"
              @size-resolved="(s) => (lesson.video_size = s)"
              @meta-extracted="(m) => { if (m.duration) lesson.duration_sec = m.duration }"
            />
          </div>

          <div class="lesson-row__actions">
            <el-button :disabled="li === 0" link @click="moveLesson(chapter, li, -1)">↑</el-button>
            <el-button :disabled="li === chapter.lessons.length - 1" link @click="moveLesson(chapter, li, 1)">↓</el-button>
            <el-button type="danger" link size="small" @click="removeLesson(chapter, li)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Plus, Delete, Check } from '@element-plus/icons-vue'
import UploadFile from '@/components/UploadFile/index.vue'

const props = defineProps({
  tree: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:tree', 'save'])

let _keyCounter = 1
const newKey = () => `_k${_keyCounter++}`

function hydrate(chapters) {
  return (chapters || []).map((ch) => ({
    ...ch,
    _key: ch._key || newKey(),
    lessons: (ch.lessons || []).map((les) => ({
      ...les,
      _key: les._key || newKey(),
    })),
  }))
}

const localTree = ref(hydrate(props.tree))

watch(
  () => props.tree,
  (val) => {
    localTree.value = hydrate(val)
  },
  { deep: false },
)

function addChapter() {
  localTree.value.push({
    _key: newKey(),
    id: null,
    title: '',
    sort: localTree.value.length + 1,
    lessons: [],
  })
}

function removeChapter(ci) {
  localTree.value.splice(ci, 1)
}

function moveChapter(ci, dir) {
  const arr = localTree.value
  const to = ci + dir
  if (to < 0 || to >= arr.length) return
  ;[arr[ci], arr[to]] = [arr[to], arr[ci]]
}

function addLesson(chapter) {
  chapter.lessons.push({
    _key: newKey(),
    id: null,
    title: '',
    duration_sec: 0,
    video_url: '',
    video_name: '',
    is_free: 0,
    sort: chapter.lessons.length + 1,
  })
}

function removeLesson(chapter, li) {
  chapter.lessons.splice(li, 1)
}

function moveLesson(chapter, li, dir) {
  const arr = chapter.lessons
  const to = li + dir
  if (to < 0 || to >= arr.length) return
  ;[arr[li], arr[to]] = [arr[to], arr[li]]
}

function handleSave() {
  // 补齐 sort 字段
  const tree = localTree.value.map((ch, ci) => ({
    ...ch,
    sort: ci + 1,
    lessons: (ch.lessons || []).map((les, li) => ({ ...les, sort: li + 1 })),
  }))
  emit('update:tree', tree)
  emit('save', tree)
}
</script>

<style lang="scss" scoped>
.chapter-tree {
  padding: 4px 0;

  &__toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
  }
}

.chapter-block {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-wrap: wrap;
  }

  &__index {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-primary);
    white-space: nowrap;
    min-width: 48px;
  }

  &__title {
    flex: 1;
    min-width: 160px;
  }
}

.lesson-list {
  padding: 8px 16px 16px;
}

.lesson-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  flex-wrap: wrap;

  &:last-child {
    border-bottom: none;
  }

  &__index {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    min-width: 42px;
  }

  &__title {
    flex: 1;
    min-width: 140px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  &__video {
    flex: 1;
    min-width: 200px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
}
</style>
