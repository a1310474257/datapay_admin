import { reactive, ref } from 'vue'

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value ?? {}))
}

export function useTable({ loadApi, defaultParams = {} }) {
  const tableRef = ref(null)
  const initialParams = cloneValue(defaultParams)
  const searchParams = reactive(cloneValue(defaultParams))

  // 提供给 ProTable 的 loadData，自动合并检索参数和分页排序参数。
  const loadData = (params) => loadApi({ ...searchParams, ...params })

  function onSearch() {
    tableRef.value?.setParams(searchParams)
    tableRef.value?.refresh()
  }

  function onReset() {
    Object.keys(searchParams).forEach((key) => delete searchParams[key])
    Object.assign(searchParams, cloneValue(initialParams))
    tableRef.value?.setParams(searchParams)
    tableRef.value?.refresh()
  }

  return { tableRef, searchParams, loadData, onSearch, onReset }
}
