export function exportJsonToCsv(data, filename = 'export.csv') {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[exportJsonToCsv] No data to export')
    return
  }

  // Collecter tous les en-têtes (union des clés)
  const headersSet = new Set()
  data.forEach(row => Object.keys(row || {}).forEach(k => headersSet.add(k)))
  const headers = Array.from(headersSet)

  // Echappement CSV basique: entourer de quotes et échapper les quotes internes
  const escapeCsv = (value) => {
    if (value == null) return ''
    const str = String(value)
    if (/[",\n;]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const lines = []
  lines.push(headers.map(h => escapeCsv(h)).join(','))
  for (const row of data) {
    const line = headers.map(h => escapeCsv(row?.[h]))
    lines.push(line.join(','))
  }

  const csvContent = lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}