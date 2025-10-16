import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getPorts() {
  try {
    console.log('[GetPorts] Début de la récupération des ports...')
    const response = await api.get('/ports/list')
    console.log('[GetPorts] Succès:', {
      status: response.status,
      count: Array.isArray(response.data) ? response.data.length : (response.data && response.data.data ? response.data.data.length : undefined)
    })
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[GetPorts] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les ports: ${message}`)
  }
}

export async function getLimitedPorts({ page = 1, pageSize = 20, filter = {} } = {}) {
  try {
    console.log("page = ", page, "pageSize = ", pageSize, "filter = ", filter);
    const params = { page, pageSize };
    if (filter && Object.keys(filter).length > 0) {
      params.filter = JSON.stringify(filter);
    }
    const response = await api.get('/ports/limit', { params });

    // Comptage
    const rowsCount = Array.isArray(response.data.rows) ? response.data.rows.length : 0;
    // Assure un cast numérique fiable
    const rawTotal = response.data && (response.data.totalCount ?? response.data.totalCountRes?.[0]?.count ?? response.data.totalCountRes?.count);
    console.log('rawTotal:', rawTotal);
    const totalCount = Number(rawTotal ?? 0);

    console.log('[GetPorts] Succès:', {
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
    console.error('[GetPorts] Erreur lors de la récupération:', message)
    throw new Error(`Impossible de charger les ports: ${message}`)
  }
}


export async function getPort(id) {
  return api.get(`/ports/${id}`)
}

export function createPort(port) {
  return api.post('/ports', port)
}

export async function switchPortMonitored(portId, isMonitored) {
  try {
    if (portId == null) throw new Error('portId is required')
    const payload = { isMonitored: !!isMonitored }
    const response = await api.put(`/ports/${portId}/switch-monitored`, payload)
    return response?.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error('[switchPortMonitored] Erreur:', message)
    throw new Error(`Impossible de mettre à jour le port ${portId}: ${message}`)
  }
}

