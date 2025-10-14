import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export async function getPortEventsByPortId(portId, { page = 1, pageSize = 20, status, start_date, end_date } = {}) {
  try {
    const params = { page, pageSize }
    if (status) params.status = status
    if (start_date) params.start_date = start_date
    if (end_date) params.end_date = end_date

    const response = await api.get(`/port-events/${portId}`, { params })
    const rows = Array.isArray(response.data.rows) ? response.data.rows : []
    return { rows, page, pageSize, hasNextPage: response.data.hasNextPage }
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de charger les événements du port: ${message}`)
  }
}

export async function deletePortEvent(id) {
  try {
    const response = await api.delete(`/port-events/${id}`)
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    throw new Error(`Impossible de supprimer l'événement: ${message}`)
  }
}