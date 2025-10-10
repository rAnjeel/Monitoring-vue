import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getDevices({filter = {}} = {}) {
  try {
    console.log('[GetDevices] Début de la récupération des devices...', { filter })
    
    const params = {}
    if (filter && Object.keys(filter).length > 0) {
      params.filter = JSON.stringify(filter)
    }
    
    const response = await api.get('/devices/list', { params })
    console.log('[GetDevices] Succès:', {
      status: response.status,
      count: Array.isArray(response.data) ? response.data.length : (response.data && response.data.data ? response.data.data.length : undefined)
    })
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetDevices] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les devices: ${message}`)
  }
}

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

export async function getCachedDevices() {
  try {
    const response = await api.get('/devices/cache')
    const devices = Array.isArray(response.data?.devices) ? response.data.devices : []
    console.log('[GetCachedDevices] Fetched', devices.length, 'devices from cache')
    return devices
  } catch (error) {
    const msg = error?.response?.data?.message || error.message || 'Erreur inconnue'
    console.error('[GetCachedDevices] Erreur:', msg)
    throw new Error(`Impossible de charger les devices (cache): ${msg}`)
  }
}

