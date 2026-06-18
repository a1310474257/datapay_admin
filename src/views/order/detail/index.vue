<template>
  <div class="dp-order-detail">
    <el-page-header content="订单详情" @back="goBack" />

    <el-card class="block-card" header="基本信息">
      <el-timeline>
        <el-timeline-item :timestamp="order.created_at || '—'">下单</el-timeline-item>
        <el-timeline-item :timestamp="order.pay_time || '—'">付款</el-timeline-item>
        <el-timeline-item :timestamp="order.ship_time || '—'">发货</el-timeline-item>
        <el-timeline-item :timestamp="order.finish_time || '—'">完成</el-timeline-item>
      </el-timeline>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.order_no || '—' }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <StatusTag :dict="ORDER_TYPE" :value="order.order_type" />
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <StatusTag :dict="ORDER_STATUS" :value="order.status" />
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ order.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="block-card" header="用户信息">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="昵称">{{ order.user?.nickname || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ order.user?.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ order.user?.openid || '—' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card v-if="Number(order.order_type) === 5" class="block-card" header="收货地址快照">
      <AddressSnapView :snap="order.address_snap || {}" />
    </el-card>

    <el-card class="block-card" header="商品明细">
      <el-table :data="order.items || []" border>
        <el-table-column label="图片" width="90">
          <template #default="{ row }">
            <el-image :src="row.cover" style="width: 50px; height: 50px; border-radius: 6px" />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="名称" min-width="180" />
        <el-table-column prop="spec" label="规格" min-width="120" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="单价" width="110">
          <template #default="{ row }">¥ {{ fen2yuan(row.price) }}</template>
        </el-table-column>
        <el-table-column label="小计" width="110">
          <template #default="{ row }">¥ {{ fen2yuan(Number(row.price || 0) * Number(row.quantity || 0)) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card class="block-card" header="金额明细">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="商品金额">¥ {{ fen2yuan(order.goods_total) }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">¥ {{ fen2yuan(order.discount) }}</el-descriptions-item>
        <el-descriptions-item label="运费">¥ {{ fen2yuan(order.freight) }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">¥ {{ fen2yuan(payableAmount) }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥ {{ fen2yuan(order.actual_pay) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="block-card" header="支付流水">
      <el-table :data="order.payRecords || []" border>
        <el-table-column prop="wx_transaction_id" label="流水号" min-width="210" />
        <el-table-column label="支付渠道" min-width="120">
          <template #default>微信支付</template>
        </el-table-column>
        <el-table-column label="金额" min-width="100">
          <template #default="{ row }">¥ {{ fen2yuan(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">{{ Number(row.status) === 1 ? '已支付' : '已退款' }}</template>
        </el-table-column>
        <el-table-column prop="paid_at" label="支付时间" min-width="170" />
      </el-table>
    </el-card>

    <el-card class="block-card" header="物流信息">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="快递公司">{{ order.express_company || '—' }}</el-descriptions-item>
        <el-descriptions-item label="快递单号">{{ order.express_no || '—' }}</el-descriptions-item>
        <el-descriptions-item label="物流节点">P0 阶段暂不提供</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="block-card" header="操作区">
      <el-space wrap>
        <el-button v-if="Number(order.status) === 0" type="danger" @click="handleCancel">取消订单</el-button>
        <el-button
          v-if="Number(order.status) === 1 && Number(order.order_type) === 5"
          v-permission="'order:ship'"
          type="primary"
          @click="openShip(false)"
        >
          发货
        </el-button>
        <el-button
          v-if="Number(order.status) === 2 && Number(order.order_type) === 5"
          v-permission="'order:ship'"
          @click="openShip(true)"
        >
          修改运单
        </el-button>
        <el-button
          v-if="Number(order.status) === 2"
          v-permission="'order:complete'"
          type="success"
          @click="handleComplete"
        >
          完成订单
        </el-button>
        <el-button v-if="Number(order.status) === 4" type="danger" @click="goRefund">查看退款</el-button>
        <el-button v-if="[0, 1, 2, 3].includes(Number(order.status))" type="warning" @click="handleRemark">
          更新备注
        </el-button>
      </el-space>
    </el-card>

    <ShipOrderDialog
      v-model:visible="shipVisible"
      :order-id="order.id"
      :initial-express-name="order.express_company"
      :initial-express-no="order.express_no"
      :edit-mode="shipEdit"
      @success="loadDetail"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AddressSnapView from '@/components/AddressSnapView/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { ORDER_STATUS, ORDER_TYPE } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import { cancelOrder, completeOrder, getOrderDetail, updateOrderRemark } from '@/api/order'
import ShipOrderDialog from '@/views/order/components/ShipOrderDialog.vue'

const route = useRoute()
const router = useRouter()
const shipVisible = ref(false)
const shipEdit = ref(false)
const order = reactive({
  user: {},
  items: [],
  payRecords: [],
})

const payableAmount = computed(() => Number(order.goods_total || 0) + Number(order.freight || 0) - Number(order.discount || 0))

async function loadDetail() {
  try {
    const data = await getOrderDetail(route.params.id)
    Object.assign(order, data)
  } catch (error) {
    ElMessage.error(error?.message || '订单详情加载失败')
    goBack()
  }
}

async function handleCancel() {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      inputValidator: (val) => Boolean(String(val || '').trim()),
      inputErrorMessage: '取消原因不能为空',
    })
    await cancelOrder(order.id, value)
    ElMessage.success('订单已取消')
    loadDetail()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '取消失败')
    }
  }
}

async function handleRemark() {
  try {
    const { value } = await ElMessageBox.prompt('请输入备注内容', '订单备注', {
      inputValue: order.remark || '',
    })
    await updateOrderRemark(order.id, value)
    ElMessage.success('备注更新成功')
    loadDetail()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '备注失败')
    }
  }
}

async function handleComplete() {
  try {
    await ElMessageBox.confirm(`确认将订单 ${order.order_no} 标记为已完成吗？`, '完成订单', {
      type: 'warning',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
    })
    await completeOrder(order.id)
    ElMessage.success('订单已完成')
    loadDetail()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error?.message || '完成订单失败')
    }
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/order/list')
  }
}

function openShip(edit) {
  shipEdit.value = Boolean(edit)
  shipVisible.value = true
}

function goRefund() {
  router.push({ path: '/order/refund', query: { order_id: order.id } })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.dp-order-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-card {
  margin-top: 0;
}
</style>
