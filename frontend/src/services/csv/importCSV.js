import axios from 'axios'

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

export function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(Boolean)
  console.log('[parseCSV] Lignes brutes :', rows)
  if (rows.length < 2) return []
  const stripQuotes = (value) => {
    if (value === undefined || value === null) return ''
    let v = String(value).trim()
    const startsWithDouble = v.startsWith('"') && v.endsWith('"')
    const startsWithSingle = v.startsWith("'") && v.endsWith("'")
    if ((startsWithDouble || startsWithSingle) && v.length >= 2) {
      v = v.slice(1, -1)
    }
    // Unescape common CSV quote escapes
    v = v.replace(/""/g, '"').replace(/''/g, "'")
    return v.trim()
  }

  const headers = rows[0].split(',').map((h) => stripQuotes(h))
  console.log('[parseCSV] En-têtes détectés :', headers)
  const result = rows.slice(1).map((row) => {
    const values = row.split(',').map((v) => stripQuotes(v))
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
  console.log('[parseCSV] Résultat final du parsing :', result)
  return result
}

export async function importDevices(data) {
  try {
    console.log("[ImportDevices] Début de l'import des devices...")
    const response = await api.post('/devices/import', data)
    console.log('[ImportDevices] Succès:', {
      status: response.status,
      count: Array.isArray(response.data) ? response.data.length : undefined
    })
    return response.data
  } catch (error) {
    const jsonErrorMessage = error && error.response && error.response.data
      ? (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data))
      : null
    const message = jsonErrorMessage || error.message || 'Erreur inconnue'
    console.error("[ImportDevices] Erreur lors de l'import:", message)
    throw new Error(`Impossible d'importer les devices: ${message}`)
  }
}