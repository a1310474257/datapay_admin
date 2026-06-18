<template>
  <el-drawer :model-value="visible" title="用户详情" size="640px" @close="emit('update:visible', false)">
    <div class="dp-user-detail">
      <div class="avatar-wrap">
        <el-avatar :size="72" :src="detail?.avatar" />
      </div>
      <el-descriptions border :column="1">
        <el-descriptions-item label="昵称">{{ detail?.nickname || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detail?.phone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="OpenID">{{ detail?.openid || '—' }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ detail?.real_name || detail?.realName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="公司">{{ detail?.company || '—' }}</el-descriptions-item>
        <el-descriptions-item label="职务">{{ detail?.position || '—' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detail?.email || '—' }}</el-descriptions-item>
        <el-descriptions-item label="注册资料">{{ formatProfileCompleted(detail) }}</el-descriptions-item>
        <el-descriptions-item label="隐私协议">{{ formatPrivacyAgreed(detail) }}</el-descriptions-item>
        <el-descriptions-item label="同意时间">{{ detail?.privacy_agreed_at || detail?.privacyAgreedAt || '—' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ detail?.created_at || '—' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ detail?.last_login_at || '—' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="subTab" class="sub-tabs" @tab-change="onSubTab">
        <el-tab-pane label="已购课程" name="course">
          <el-table v-loading="loading.course" :data="courses" border size="small">
            <el-table-column prop="course_title" label="课程" min-width="160" />
            <el-table-column prop="created_at" label="购买时间" width="170" />
            <el-table-column prop="progress_pct" label="进度" width="90">
              <template #default="{ row }">{{ row.progress_pct }}%</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="已购资源" name="resource">
          <el-table v-loading="loading.resource" :data="resources" border size="small">
            <el-table-column prop="resource_title" label="资源" min-width="160" />
            <el-table-column prop="created_at" label="购买时间" width="170" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="收货地址" name="address">
          <el-table v-loading="loading.address" :data="addresses" border size="small">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column label="地区" min-width="200">
              <template #default="{ row }">{{ row.province }}{{ row.city }}{{ row.district }}</template>
            </el-table-column>
            <el-table-column prop="detail" label="详细地址" min-width="180" />
            <el-table-column prop="is_default" label="默认" width="72">
              <template #default="{ row }">{{ row.is_default ? '是' : '否' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="订单" name="order">
          <el-table v-loading="loading.order" :data="orders" border size="small">
            <el-table-column prop="order_no" label="订单号" min-width="170" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <StatusTag :dict="ORDER_STATUS" :value="row.status" />
              </template>
            </el-table-column>
            <el-table-column prop="actual_pay" label="实付(元)" width="100">
              <template #default="{ row }">{{ fen2yuan(row.actual_pay) }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="下单时间" width="170" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag/index.vue'
import { ORDER_STATUS } from '@/utils/enums'
import { fen2yuan } from '@/utils/price'
import {
  getUserPurchasedCourses,
  getUserPurchasedResources,
  getUserAddresses,
  getUserOrders,
} from '@/api/user'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  detail: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:visible'])

const subTab = ref('course')
const loading = reactive({
  course: false,
  resource: false,
  address: false,
  order: false,
})
const courses = ref([])
const resources = ref([])
const addresses = ref([])
const orders = ref([])

watch(
  () => props.visible,
  (v) => {
    if (v && props.detail?.id) {
      subTab.value = 'course'
      loadTab('course')
    }
  },
)

function onSubTab(name) {
  loadTab(name)
}

function formatProfileCompleted(detail) {
  const value = detail?.profile_completed ?? detail?.profileCompleted
  return Number(value || 0) === 1 ? '已完善' : '未完善'
}

function formatPrivacyAgreed(detail) {
  const value = detail?.privacy_agreed ?? detail?.privacyAgreed
  return Number(value || 0) === 1 ? '已同意' : '未同意'
}

async function loadTab(name) {
  const uid = props.detail?.id
  if (!uid) return
  try {
    if (name === 'course') {
      loading.course = true
      courses.value = await getUserPurchasedCourses(uid)
    } else if (name === 'resource') {
      loading.resource = true
      resources.value = await getUserPurchasedResources(uid)
    } else if (name === 'address') {
      loading.address = true
      addresses.value = await getUserAddresses(uid)
    } else if (name === 'order') {
      loading.order = true
      const res = await getUserOrders(uid, { page: 1, pageSize: 50 })
      orders.value = res.list || []
    }
  } catch (e) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading[name] = false
  }
}
</script>

<style scoped>
.avatar-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.sub-tabs {
  margin-top: 16px;
}
</style>
