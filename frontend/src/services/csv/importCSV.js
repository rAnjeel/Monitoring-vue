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