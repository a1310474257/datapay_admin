import { ref } from 'vue'
import request from '@/api/request'

const BOS_DIRECT_UPLOAD_ENABLED = import.meta.env.VITE_BOS_DIRECT_UPLOAD === 'true'

/**
 * 文件上传 Hook：对接后端 /api/admin/upload/{image,video,file}
 *
 * 文件优先走「预签名直传」路径：
 *   1. 调 /api/admin/upload/presign 拿到 BOS 预签名 PUT URL + objectKey
 *   2. 用 XMLHttpRequest 直接 PUT 到 BOS（进度条反映真实 BOS 上传进度）
 *   3. 上传完毕后返回 objectKey
 *
 * 若 BOS 未启用（fallback=true）或直传失败，仍走原有 multipart 路径。
 */
export function useUpload() {
  const uploading = ref(false)
  const uploadProgress = ref(0)
  /** 100% 后 BOS 仍在处理时显示"同步中" */
  const syncing = ref(false)

  function pickEndpoint(file) {
    const type = String(file?.type || '')
    if (type.startsWith('image/')) return '/admin/upload/image'
    if (type.startsWith('video/')) return '/admin/upload/video'
    return '/admin/upload/file'
  }

  /**
   * 获取 BOS 预签名 PUT URL。
   * 返回 { objectKey, uploadUrl, contentType, fallback }
   */
  async function fetchPresign(file, folder) {
    const type = String(file?.type || '').startsWith('video/') ? 'video'
      : String(file?.type || '').startsWith('image/') ? 'image'
      : 'file'
    const params = new URLSearchParams({ type, filename: file.name || '' })
    if (folder) params.set('dir', folder)
    const data = await request.get(`/admin/upload/presign?${params}`)
    return data
  }

  /**
   * XMLHttpRequest 直传 BOS（支持上传进度回调）。
   * Content-Type 必须与生成预签名 URL 时的请求头一致。
   */
  function putToBos(uploadUrl, file, contentType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl, true)
      xhr.setRequestHeader('Content-Type', contentType || file.type || 'application/octet-stream')
      if (xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            uploadProgress.value = pct
            onProgress?.(pct)
          }
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`BOS 上传失败 (HTTP ${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('BOS 网络错误'))
      xhr.ontimeout = () => reject(new Error('BOS 上传超时'))
      xhr.timeout = 60 * 60 * 1000 // 1 小时
      xhr.send(file)
    })
  }

  /**
   * @param {File} file - 待上传文件
   * @param {string} [folder='default'] - 业务目录前缀（仅 multipart 路径使用）
   * @param {{ returnObjectKey?: boolean, onProgress?: (pct: number) => void }} [options={}]
   */
  async function upload(file, folder = 'default', { returnObjectKey = false, onProgress } = {}) {
    uploading.value = true
    syncing.value = false
    uploadProgress.value = 0
    try {
      // 开启后优先预签名直传 BOS；失败时自动降级到后端 multipart 上传。
      if (BOS_DIRECT_UPLOAD_ENABLED) {
        let presign
        try {
          presign = await fetchPresign(file, folder)
        } catch (_) {
          presign = null
        }

        if (presign && !presign.fallback && presign.uploadUrl) {
          try {
            // ── 直传路径 ──────────────────────────────────────────
            await putToBos(presign.uploadUrl, file, presign.contentType, onProgress)
            uploadProgress.value = 100
            return returnObjectKey ? (presign.objectKey || '') : (presign.url || presign.objectKey || '')
          } catch (error) {
            // BOS Bucket CORS 或临时网络异常时，自动降级到后端 multipart 上传。
            console.warn('[Upload] BOS direct upload failed, fallback to multipart:', error)
            uploadProgress.value = 0
            syncing.value = false
          }
        }
      }

      // ── multipart 路径（图片/文件，或视频 BOS 未启用时的降级）──
      const formData = new FormData()
      formData.append('file', file)
      if (folder) formData.append('dir', folder)
      const endpoint = pickEndpoint(file)
      const isVideoFallback = String(file?.type || '').startsWith('video/')
      const timeout = isVideoFallback ? 60 * 60 * 1000 : 10 * 60 * 1000

      const data = await request.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout,
        onUploadProgress(event) {
          if (event.total && event.total > 0) {
            const pct = Math.round((event.loaded * 100) / event.total)
            // 到 99% 前正常显示；到 100% 时切换为"同步中"状态（服务器还在上传至 BOS）
            if (pct >= 100) {
              uploadProgress.value = 99
              syncing.value = true
            } else {
              uploadProgress.value = pct
            }
            onProgress?.(pct)
          }
        },
      })
      uploadProgress.value = 100
      syncing.value = false
      return returnObjectKey ? (data?.objectKey || '') : (data?.url || '')
    } finally {
      uploading.value = false
      syncing.value = false
    }
  }

  return { uploading, uploadProgress, syncing, upload }
}
