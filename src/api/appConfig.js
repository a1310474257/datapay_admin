import request from './request'

export async function getPrivacyAgreement() {
  return request.get('/admin/app-config/privacy-agreement')
}

export async function updatePrivacyAgreement(data = {}) {
  return request.put('/admin/app-config/privacy-agreement', {
    title: data.title || '',
    content: data.content || '',
  })
}
