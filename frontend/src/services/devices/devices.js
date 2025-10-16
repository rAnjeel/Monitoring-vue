import axios from 'axios'
import { exportJsonToCsv } from '../csv/exportCSV'
const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getLimitedDevices({ page = 1, pageSize = 20, filter = {} } = {}) {
  try {
    console.log("page = ",page, "pageSize = ",pageSize, "filter = ", filter);
    const params = { page, pageSize };
    if (filter && Object.keys(filter).length > 0) {
      params.filter = JSON.stringify(filter);
    }
    const response = await api.get('/devices/limit', { params });
    // Comptage
    const rowsCount = Array.isArray(response.data.rows) ? response.data.rows.length : 0;
    const totalCount =
      response.data.totalCount ??
      response.data.totalCountRes?.[0]?.count ??
      response.data.totalCountRes?.count ??
      0;

    console.log('[GetDevices] Succès:', {
      status: response.status,
      rowsCount,
      totalCount
    });

    return {
      rows: response.data.rows || [],
      totalCount
    };
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetDevices] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les devices: ${message}`)
  }
}

export async function getDevice(id) {
  return api.get(`/devices/${id}`)
}

export function createDevice(device) {
  return api.post('/devices', device)
}

export async function getPortsDevice(id) {
  try {
    if (id == null) throw new Error('id is required')
    const response = await api.get(`/devices/${id}/ports`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[getPortsDevice] Erreur:', message)
    throw new Error(`Impossible de charger les ports du device ${id}: ${message}`)
  }
}


async function getDeviceReporting(deviceId, { start_date, end_date, pageSize = 10000 }) {
  try {
    if (!deviceId) throw new Error('deviceId is required')
    if (!start_date || !end_date) throw new Error('start_date and end_date are required')
    const params = { start_date, end_date, page: 1, pageSize }
    const response = await api.get(`/device-events/device/${deviceId}`, { params })
    const payload = response.data
    if (payload && Array.isArray(payload.rows)) return payload.rows
    if (Array.isArray(payload)) return payload
    return []
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[getDeviceReporting] Erreur:', message)
    throw new Error(`Impossible de charger le reporting du device ${deviceId}: ${message}`)
  }
}

export async function exportDeviceReportingCsv(deviceId, { start_date, end_date, filename = 'device-report.csv' }) {
  const rows = await getDeviceReporting(deviceId, { start_date, end_date })
  exportJsonToCsv(rows, filename)
}

