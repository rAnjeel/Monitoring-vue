import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function listSettings() {
  const res = await api.get('/monitoring-settings')
  return Array.isArray(res.data) ? res.data : []
}

export async function getSettingByKey(keyName) {
  const res = await api.get(`/monitoring-settings/key/${encodeURIComponent(keyName)}`)
  return res.data
}

export async function updateSetting(id, payload) {
  const res = await api.put(`/monitoring-settings/${id}`, payload)
  return res.data
}

export async function createSetting(payload) {
  const res = await api.post('/monitoring-settings', payload)
  return res.data
}
