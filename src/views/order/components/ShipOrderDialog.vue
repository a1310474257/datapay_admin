<template>
  <el-dialog v-model="innerVisible" :title="titleText" width="480px" destroy-on-close @open="onOpen">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="快递公司" prop="express_id">
        <DictSelect v-model="form.express_id" dict-key="express" placeholder="请选择快递公司" />
      </el-form-item>
      <el-form-item label="快递单号" prop="express_no">
        <el-input v-model="form.express_no" placeholder="请输入物流单号" maxlength="64" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="innerVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import DictSelect from '@/components/DictSelect/index.vue'
import { useDictStore } from '@/stores/dict'
import { shipOrder, updateOrderExpress } from '@/api/order'

const props = defineProps({
  visible: { type: Boolean, default: false },
  orderId: { type: [Number, String], default: null },
  /** 编辑模式：预填已有物流 */
  initialExpressName: { type: String, default: '' },
  initialExpressNo: { type: String, default: '' },
  /** 是否为修改运单（已发货） */
  editMode: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'success'])

const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const titleText = computed(() => (props.editMode ? '修改运单' : '订单发货'))

const dictStore = useDictStore()
const formRef = ref(null)
const submitting = ref(false)
const form = reactive({
  express_id: null,
  express_no: '',
})

const rules = {
  express_id: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  express_no: [{ required: true, message: '请输入快递单号', trigger: 'blur' }],
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await dictStore.loadExpress()
    }
  },
)

function onOpen() {
  form.express_no = props.initialExpressNo || ''
  const list = dictStore.expressCompany || []
  const found = list.find((item) => item.name === props.initialExpressName)
  form.express_id = found?.id ?? null
}

async function submit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  const list = dictStore.expressCompany || []
  const company = list.find((item) => Number(item.id) === Number(form.express_id))
  submitting.value = true
  try {
    const payload = {
      express_company: company?.name || '',
      express_no: form.express_no,
    }
    if (props.editMode) {
      await updateOrderExpress(props.orderId, payload)
    } else {
      await shipOrder(props.orderId, payload)
    }
    ElMessage.success(props.editMode ? '运单已更新' : '发货成功')
    emit('success')
    innerVisible.value = false
  } catch (e) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
</script>
