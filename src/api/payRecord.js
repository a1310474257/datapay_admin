import request from './request'
import { fromBackendPage, toBackendParams, withAliases } from './adapter'

// 支付流水：按后端 /api/admin/pay-records 分页接口直接查询。
export async function getPayRecordList(params = {}) {
  const [startDate, endDate] = Array.isArray(params.paid_at) ? params.paid_at : []
  const backendParams = toBackendParams(params, {
    keyword: params.order_no || params.transaction_id || params.keyword,
    startDate,
    endDate,
  })
  delete backendParams.order_no
  delete backendParams.transaction_id
  delete backendParams.paid_at
  const page = await request.get('/admin/pay-records', { params: backendParams })
  return fromBackendPage(page, (row) => {
    const aliased = withAliases(row)
    return {
      ...aliased,
      transaction_id: row.transactionId || row.wxTransactionId || aliased.transaction_id || '',
      order_no: row.orderNo || aliased.order_no || '',
      paid_at: row.paidAt || aliased.paid_at || '',
      channel: row.channel || '微信支付',
    }
  })
}
