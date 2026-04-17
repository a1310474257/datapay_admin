<template>
  <div class="dp-rich-editor">
    <Toolbar
      class="toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      class="editor"
      :style="{ height: `${height}px` }"
      :default-config="editorConfig"
      :model-value="innerValue"
      mode="default"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  height: {
    type: Number,
    default: 400,
  },
  uploadImage: {
    type: Function,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
const editorRef = shallowRef()
const innerValue = shallowRef(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== innerValue.value) {
      innerValue.value = value
    }
  },
)

function handleCreated(editor) {
  editorRef.value = editor
}

function handleChange(editor) {
  const html = editor.getHtml()
  if (html !== innerValue.value) {
    innerValue.value = html
    emit('update:modelValue', html)
  }
}

const toolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    'bold',
    'italic',
    'underline',
    'bulletedList',
    'numberedList',
    'insertLink',
    'insertImage',
    'insertDivider',
    'codeBlock',
  ],
}

async function defaultUploadImage(file) {
  const seed = encodeURIComponent(`${file.name || 'editor-image'}-${Date.now()}`)
  return `https://picsum.photos/seed/${seed}/800/500`
}

const editorConfig = computed(() => ({
  MENU_CONF: {
    uploadImage: {
      // 统一由外部函数或 mock 返回 URL，再插入到编辑器内容中。
      async customUpload(file, insertFn) {
        const uploadAction = props.uploadImage || defaultUploadImage
        const imageUrl = await uploadAction(file)
        insertFn(imageUrl, '', imageUrl)
      },
    },
  },
}))

onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
    editorRef.value = null
  }
})
</script>

<style scoped>
.dp-rich-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  border-bottom: 1px solid var(--el-border-color);
}

.editor {
  overflow-y: hidden;
}
</style>
