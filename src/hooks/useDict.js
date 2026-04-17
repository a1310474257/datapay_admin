import { computed, onMounted } from 'vue'
import { useDictStore } from '@/stores/dict'

const keyFieldMap = {
  category: 'category',
  teacher: 'teacher',
  express: 'expressCompany',
}

const keyLoaderMap = {
  category: 'loadCategory',
  teacher: 'loadTeacher',
  express: 'loadExpress',
}

export function useDict(key) {
  const store = useDictStore()
  const fieldName = keyFieldMap[key]
  const loaderName = keyLoaderMap[key]

  const options = computed(() => store[fieldName] || [])

  onMounted(() => {
    store[loaderName]?.()
  })

  return { options }
}
