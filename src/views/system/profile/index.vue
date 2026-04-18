<template>
  <div class="dp-system-profile">
    <el-row :gutter="12">
      <el-col :md="12" :xs="24">
        <el-card header="基本信息">
          <el-form ref="profileRef" :model="profileForm" :rules="profileRules" label-width="96px">
            <el-form-item label="头像" prop="avatar">
              <UploadImage v-model="profileForm.avatar" folder="admin" ratio="1:1" />
            </el-form-item>
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" maxlength="30" show-word-limit />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input :model-value="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="角色">
              <el-input :model-value="profileForm.role" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileSubmitting" @click="handleSaveProfile">保存信息</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :md="12" :xs="24">
        <el-card header="修改密码">
          <el-form ref="passwordRef" :model="passwordForm" :rules="passwordRules" label-width="110px">
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordSubmitting" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import UploadImage from '@/components/UploadImage/index.vue'
import { changePassword, updateProfile } from '@/api/profile'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const profileRef = ref(null)
const passwordRef = ref(null)
const profileSubmitting = ref(false)
const passwordSubmitting = ref(false)

const profileForm = reactive({
  avatar: '',
  nickname: '',
  username: '',
  role: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_, value, callback) => {
        if (value !== passwordForm.newPassword) callback(new Error('两次密码输入不一致'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

function fillProfile() {
  const profile = userStore.profile || {}
  profileForm.avatar = profile.avatar || ''
  profileForm.nickname = profile.nickname || ''
  profileForm.username = profile.username || ''
  profileForm.role = profile.role || '超级管理员'
}

async function handleSaveProfile() {
  const valid = await profileRef.value?.validate().catch(() => false)
  if (!valid) return
  profileSubmitting.value = true
  try {
    const updated = await updateProfile({
      avatar: profileForm.avatar,
      nickname: profileForm.nickname,
    })
    userStore.profile = { ...(userStore.profile || {}), ...updated }
    ElMessage.success('基本信息保存成功')
  } catch (error) {
    ElMessage.error(error?.message || '保存失败')
  } finally {
    profileSubmitting.value = false
  }
}

async function handleChangePassword() {
  const valid = await passwordRef.value?.validate().catch(() => false)
  if (!valid) return
  passwordSubmitting.value = true
  try {
    await changePassword(passwordForm)
    ElMessage.success('密码修改成功（Mock）')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    ElMessage.error(error?.message || '密码修改失败')
  } finally {
    passwordSubmitting.value = false
  }
}

onMounted(async () => {
  if (!userStore.profile) {
    await userStore.fetchProfile()
  }
  fillProfile()
})
</script>
