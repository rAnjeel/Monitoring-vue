export function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(Boolean)
  console.log('[parseCSV] Lignes brutes :', rows)
  if (rows.length < 2) return []
  const headers = rows[0].split(',').map((h) => h.trim())
  console.log('[parseCSV] En-têtes détectés :', headers)
  const result = rows.slice(1).map((row) => {
    const values = row.split(',')
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
  console.log('[parseCSV] Résultat final du parsing :', result)
  return result
}