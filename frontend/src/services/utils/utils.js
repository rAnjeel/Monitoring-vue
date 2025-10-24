import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import { enUS } from 'date-fns/locale/en-US'

// Formats par pays
const countryFormats = {
  FR: {
    locale: fr,
    pattern: 'dd/MM/yyyy HH:mm:ss'
  },
  US: {
    locale: enUS,
    pattern: 'MM/dd/yyyy h:mm:ss a'
  },
  TS: {
    locale: enUS,
    pattern: 'timestamp'
  },
  HMS: {
    locale: enUS,
    pattern: 'H:mm:ss'
  },
  DATE_ONLY: {
    locale: enUS,
    pattern: 'yyyy-MM-dd'
  },
}

// Fonction principale
export function formatDate(date, country = 'FR', customPattern) {
  const config = countryFormats[country] || countryFormats.FR
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return ''

  // Si format timestamp demandé → renvoie un nombre
  if (config.pattern === 'timestamp' || customPattern === 'timestamp') {
    return dateObj.getTime()
  }

  return format(dateObj, customPattern || config.pattern, {
    locale: config.locale
  })
}

// Fonctions dédiées
export function formatDateFR(date, pattern) {
  return formatDate(date, 'FR', pattern)
}

export function formatDateUS(date, pattern) {
  return formatDate(date, 'US', pattern)
}

export function formatDateTimestamp(date) {
  return formatDate(date, 'TS')
}

export function formatDateMinuteSecond(date) {
  return formatDate(date, 'HMS')
}

// Nouveau : format YYYY-MM-DD
export function formatDateOnly(date) {
  return formatDate(date, 'DATE_ONLY')
}

// Conversion d’état en texte
export function stringifyStatusValue(value) {
  if (value == 1) return 'UP'
  if (value == 0) return 'DOWN'
  return ''
}

// Valeurs superposées
export function superposeValue(valueOnside, valueBeside) {
  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.justifyContent = 'center'
  container.style.lineHeight = '1.2'

  const line1 = document.createElement('div')
  line1.style.fontWeight = '600'
  line1.style.color = '#2c3e50'
  line1.textContent = valueOnside || valueBeside || ''
  container.appendChild(line1)

  if (valueOnside && valueBeside && valueOnside !== valueBeside) {
    const line2 = document.createElement('div')
    line2.style.fontSize = '12px'
    line2.style.color = '#7f8c8d'
    line2.textContent = valueBeside
    container.appendChild(line2)
  }

  return container
}

// Badge coloré
export function badgeContainer(value) {
  const container = document.createElement('span')
  container.style.padding = '2px 8px'
  container.style.borderRadius = '12px'
  container.style.fontSize = '12px'
  container.style.fontWeight = '600'
  container.style.textTransform = 'uppercase'

  switch (value) {
    case 'RESOLVED':
      container.style.backgroundColor = '#ffe9d5'
      container.style.color = '#e67e22'
      break
    case 'OPEN':
      container.style.backgroundColor = '#e8f4ff'
      container.style.color = '#3498db'
      break
    case 'ASSIGNED':
      container.style.backgroundColor = '#eef2ff'
      container.style.color = '#6366f1'
      break
    case 'UP':
      container.style.backgroundColor = '#e3fcec'
      container.style.color = '#27ae60'
      break
    case 'Unstable':
      container.style.backgroundColor = '#ffe9d5'
      container.style.color = '#c0392b'
      break
    case 'Stable':
      container.style.backgroundColor = '#e3fcec'
      container.style.color = '#27ae60'
      break
    case 'To monitor':
      container.style.backgroundColor = '#e8f4ff'
      container.style.color = '#1074e7'
      break
    case 'DOWN':
      container.style.backgroundColor = '#fdecea'
      container.style.color = '#e74c3c'
      break
    default:
      container.style.backgroundColor = '#ecf0f1'
      container.style.color = '#7f8c8d'
  }

  container.textContent = value
  return container
}
