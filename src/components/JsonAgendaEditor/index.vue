<template>
  <div class="dp-json-agenda">
    <el-button type="primary" size="small" @click="addRow">新增议程</el-button>
    <draggable v-model="list" :item-key="(row, index) => row._k ?? index" handle=".agenda-drag" animation="200" class="rows">
      <template #item="{ element: row, index }">
        <div class="row">
          <span class="agenda-drag drag-hint">⋮⋮</span>
          <el-time-picker
            v-model="row._start"
            placeholder="开始"
            value-format="HH:mm"
            format="HH:mm"
            @change="() => syncRange(row)"
          />
          <el-time-picker
            v-model="row._end"
            placeholder="结束"
            value-format="HH:mm"
            format="HH:mm"
            @change="() => syncRange(row)"
          />
          <el-input v-model="row.content" placeholder="议程内容" class="grow" />
          <el-button type="danger" link @click="removeRow(index)">删除</el-button>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import draggable from 'vuedraggable'

const list = defineModel({ type: Array, default: () => [] })

let kid = 0

function parseRange(timeStr) {
  const t = String(timeStr || '')
  const parts = t.split(/[–-]/) // hyphen or en-dash
  if (parts.length >= 2) {
    return [parts[0].trim(), parts[1].trim()]
  }
  return ['', '']
}

function hydrate(row) {
  if (row._k == null) {
    kid += 1
    row._k = `k-${kid}`
  }
  const [a, b] = parseRange(row.time)
  row._start = a || null
  row._end = b || null
}

watch(
  () => list.value,
  (val) => {
    ;(val || []).forEach(hydrate)
  },
  { immediate: true, deep: true },
)

function syncRange(row) {
  if (row._start && row._end) {
    row.time = `${row._start}-${row._end}`
  }
}

function addRow() {
  kid += 1
  list.value = [...(list.value || []), { time: '14:00-15:00', content: '', _k: `k-${kid}`, _start: '14:00', _end: '15:00' }]
}

function removeRow(index) {
  const next = [...list.value]
  next.splice(index, 1)
  list.value = next
}
</script>

<style scoped>
.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.grow {
  flex: 1;
  min-width: 200px;
}

.drag-hint {
  cursor: grab;
  color: var(--el-text-color-secondary);
}
</style>
