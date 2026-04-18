<template>
  <el-card class="dp-echart-card" shadow="never">
    <template #header>
      <span>{{ title }}</span>
    </template>
    <div ref="hostRef" class="chart-host" :style="{ height: `${height}px` }" />
  </el-card>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  option: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  height: {
    type: Number,
    default: 320,
  },
  title: {
    type: String,
    default: '图表',
  },
})

const hostRef = ref(null)
let chart
let ro

onMounted(() => {
  if (!hostRef.value) return
  chart = echarts.init(hostRef.value)
  chart.setOption(props.option || {})
  ro = new ResizeObserver(() => {
    chart?.resize()
  })
  ro.observe(hostRef.value)
})

watch(
  () => props.option,
  (opt) => {
    if (!chart) return
    chart.setOption(opt || {}, true)
  },
  { deep: true },
)

watch(
  () => props.loading,
  (v) => {
    if (!chart) return
    if (v) chart.showLoading()
    else chart.hideLoading()
  },
)

onBeforeUnmount(() => {
  ro?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.chart-host {
  width: 100%;
}
</style>
