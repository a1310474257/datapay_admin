<template>
  <div class="dp-spec-editor">
    <el-alert
      title="所有规格组合共享商品主表价格与库存，此处仅维护展示维度。"
      type="info"
      show-icon
      :closable="false"
      class="mb"
    />
    <el-button type="primary" size="small" @click="addGroup">新增规格组</el-button>

    <el-collapse v-model="openNames" class="groups">
      <el-collapse-item v-for="(g, gi) in model" :key="gi" :name="String(gi)">
        <template #title>
          <span class="group-title">规格组 {{ gi + 1 }}</span>
        </template>
        <div class="group-head">
          <el-input v-model="g.name" placeholder="规格名，如颜色" style="max-width: 220px" />
          <el-input-number v-model="g.sort" :min="1" :max="999" />
          <el-button type="danger" link @click="removeGroup(gi)">删除组</el-button>
        </div>
        <el-table :data="g.values" border size="small" class="val-table">
          <el-table-column label="规格值">
            <template #default="{ row }">
              <el-input v-model="row.value" placeholder="如 红色" />
            </template>
          </el-table-column>
          <el-table-column label="排序" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.sort" :min="1" :max="999" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ $index }">
              <el-button type="danger" link @click="removeValue(g, $index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button size="small" @click="addValue(g)">新增规格值</el-button>
        <div class="row-actions">
          <el-button v-if="gi > 0" link @click="moveGroup(gi, -1)">上移</el-button>
          <el-button v-if="gi < model.length - 1" link @click="moveGroup(gi, 1)">下移</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const model = defineModel({ type: Array, default: () => [] })

const openNames = ref([])

watch(
  () => model.value?.length,
  (len) => {
    openNames.value = Array.from({ length: len || 0 }, (_, i) => String(i))
  },
  { immediate: true },
)

function addGroup() {
  model.value = [
    ...(model.value || []),
    { id: undefined, name: '', sort: model.value.length + 1, values: [{ id: undefined, value: '', sort: 1 }] },
  ]
}

function removeGroup(index) {
  const next = [...model.value]
  next.splice(index, 1)
  model.value = next
}

function addValue(group) {
  if (!group.values) group.values = []
  group.values.push({ id: undefined, value: '', sort: group.values.length + 1 })
}

function removeValue(group, index) {
  group.values.splice(index, 1)
}

function moveGroup(index, delta) {
  const next = [...model.value]
  const t = next[index]
  next[index] = next[index + delta]
  next[index + delta] = t
  model.value = next
}
</script>

<style scoped>
.mb {
  margin-bottom: 12px;
}

.groups {
  margin-top: 12px;
}

.group-title {
  font-weight: 600;
}

.group-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.val-table {
  margin-bottom: 8px;
}

.row-actions {
  margin-top: 8px;
}
</style>
