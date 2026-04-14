<template>
  <div class="login-wrap">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle c1"></div>
      <div class="circle c2"></div>
      <div class="circle c3"></div>
      <div class="circle c4"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 左侧品牌区 -->
      <div class="card-left">
        <div class="brand-icon">
          <el-icon size="48" color="#fff"><DataBoard /></el-icon>
        </div>
        <h1 class="brand-name">DataPay</h1>
        <p class="brand-desc">数据支付管理平台</p>
        <div class="feature-list">
          <div class="feature-item">
            <el-icon><CircleCheck /></el-icon>
            <span>实时交易监控</span>
          </div>
          <div class="feature-item">
            <el-icon><CircleCheck /></el-icon>
            <span>多维度数据分析</span>
          </div>
          <div class="feature-item">
            <el-icon><CircleCheck /></el-icon>
            <span>安全风控管理</span>
          </div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="card-right">
        <div class="form-header">
          <h2>欢迎回来</h2>
          <p>请输入您的账号和密码登录系统</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <label class="form-label">账号</label>
            <el-input
              v-model="form.username"
              placeholder="请输入账号"
              size="large"
              :prefix-icon="User"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <label class="form-label">密码</label>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="javascript:;" class="forgot-link">忘记密码？</a>
          </div>

          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form>

        <div class="login-tip">
          <el-icon><InfoFilled /></el-icon>
          默认账号：<b>admin</b> &nbsp; 密码：<b>admin</b>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="copyright">© 2026 DataPay · 数据支付管理平台</div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const rememberMe = ref(true)

const form = reactive({
  username: 'admin',
  password: 'admin'
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码不少于4位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(form.username, form.password)
      ElMessage.success('登录成功，欢迎回来！')
      router.push('/')
    } catch (e) {
      ElMessage.error(e.message || '登录失败')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.08;
    background: radial-gradient(circle, #6366f1, transparent);
  }

  .c1 { width: 600px; height: 600px; top: -200px; right: -150px; }
  .c2 { width: 400px; height: 400px; bottom: -150px; left: -100px; }
  .c3 { width: 200px; height: 200px; top: 40%; left: 30%; background: radial-gradient(circle, #a855f7, transparent); }
  .c4 { width: 300px; height: 300px; bottom: 10%; right: 20%; opacity: 0.05; }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 860px;
  min-height: 520px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4);
}

.card-left {
  width: 300px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%);
  padding: 52px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .brand-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    backdrop-filter: blur(10px);
  }

  .brand-name {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: 3px;
    margin-bottom: 8px;
  }

  .brand-desc {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin-bottom: 48px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;

    .el-icon {
      color: #a5f3a5;
      font-size: 16px;
    }
  }
}

.card-right {
  flex: 1;
  background: #fff;
  padding: 52px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .form-header {
    margin-bottom: 36px;

    h2 {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    p {
      color: #9ca3af;
      font-size: 14px;
    }
  }
}

.login-form {
  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    box-shadow: 0 0 0 1px #e5e7eb;
    padding: 2px 12px;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 0 0 1px #6366f1;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
    }
  }

  :deep(.el-input__inner) {
    height: 42px;
    font-size: 14px;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;

  .forgot-link {
    font-size: 13px;
    color: #6366f1;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: #4f46e5;
      text-decoration: underline;
    }
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
}

.login-tip {
  margin-top: 24px;
  padding: 12px 16px;
  background: #f9f9ff;
  border-radius: 10px;
  font-size: 13px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px dashed #d1d5db;

  b {
    color: #6366f1;
  }

  .el-icon {
    color: #a5b4fc;
    font-size: 15px;
  }
}

.copyright {
  position: absolute;
  bottom: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}
</style>
