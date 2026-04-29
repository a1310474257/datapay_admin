import { ref } from 'vue'
import request from '@/api/request'

/**
 * 文件上传 Hook：对接后端 /api/admin/upload/{image,video,file}
 * - 根据 file 的 MIME 自动路由到 image / video / file 端点
 * - 默认返回完整公开 URL（适用于封面图、预览图等）
 * - 传入 { returnObjectKey: true } 时返回 BOS objectKey（适用于需走代理下载的受保护文件）
 * - 后端默认走百度云 BOS，开发环境未配置时会降级为 mock 模式（仍返回可用字段）
 */
export function useUpload() {
  const uploading = ref(false)

  function pickEndpoint(file) {
    const type = String(file?.type || '')
    if (type.startsWith('image/')) return '/admin/upload/image'
    if (type.startsWith('video/')) return '/admin/upload/video'
    return '/admin/upload/file'
  }

  /**
   * @param {File} file - 待上传文件
   * @param {string} [folder='default'] - 业务目录前缀
   * @param {{ returnObjectKey?: boolean }} [options={}]
   *   returnObjectKey=true 时返回 objectKey（如 "file/2024/01/01/abc.pdf"），
   *   否则返回完整公开 URL（默认行为，向后兼容）
   */
  async function upload(file, folder = 'default', { returnObjectKey = false } = {}) {
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (folder) formData.append('folder', folder)
      const endpoint = pickEndpoint(file)
      const data = await request.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
      return returnObjectKey ? (data?.objectKey || '') : (data?.url || '')
    } finally {
      uploading.value = false
    }
  }

  return { uploading, upload }
}
