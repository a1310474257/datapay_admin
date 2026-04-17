import { ref } from 'vue'

// 模拟上传延时，便于观察 loading 交互。
const MOCK_DELAY = 300

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 生成稳定的 mock 图片地址，避免依赖 blob URL（刷新后会失效）。
function buildMockUrl(file, folder = 'default') {
  const seed = encodeURIComponent(`${folder}-${file.name || 'file'}-${Date.now()}`)
  return `https://picsum.photos/seed/${seed}/600/400`
}

export function useUpload() {
  const uploading = ref(false)

  async function upload(file, folder = 'default') {
    uploading.value = true
    try {
      // 当前项目采用 Mock 模式，统一返回可持久预览的 picsum 地址。
      // 后续接入真实接口时，可在这里替换为 request/formData 上传逻辑。
      await wait(MOCK_DELAY)
      return buildMockUrl(file, folder)
    } finally {
      uploading.value = false
    }
  }

  return { uploading, upload }
}
