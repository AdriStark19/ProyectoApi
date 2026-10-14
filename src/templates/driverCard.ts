import type { DriverStats } from '../types/f1'

/**
 * Formatea segundos al formato estándar de telemetría F1 (M:SS.mmm)
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return 'N/A'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = (seconds % 60).toFixed(3)

  if (hrs === 0) {
    const paddedSecs = (seconds % 60) < 10 ? `0${secs}` : secs
    return `${mins}:${paddedSecs}`
  }

  const paddedMins = mins < 10 ? `0${mins}` : mins
  const paddedSecs = (seconds % 60) < 10 ? `0${secs}` : secs
  return `${hrs}:${paddedMins}:${paddedSecs}`
}

/**
 * Crea el componente de Foto/Avatar del piloto
 */
export function AvatarElement(photoUrl: string | null, fullName: string, acronym: string): HTMLElement {
  if (photoUrl) {
    const img = document.createElement('img')
    img.src = photoUrl
    img.alt = fullName
    img.className = 'driver-photo'
    img.loading = 'lazy'
    return img
  }

  const placeholder = document.createElement('div')
  placeholder.className = 'driver-photo-placeholder'
  placeholder.textContent = acronym
  return placeholder
}

/**
 * MODO GENERAL: Tarjeta base para la parrilla
 */
export function DriverCardTemplate(driver: DriverStats, isWinner: boolean = false): HTMLElement {
  const card = document.createElement('article')
  const normalizedTeam = driver.teamName.toLowerCase().replace(/\s+/g, '-')
  card.className = `driver-card team-${normalizedTeam} ${isWinner ? 'is-winner' : ''}`

  // Cabecera con Chapa de Dorsal estilo F1
  const cardHeader = document.createElement('div')
  cardHeader.className = 'card-header'

  const driverNum = document.createElement('span')
  driverNum.className = 'driver-number-badge'
  driverNum.textContent = `Nº ${driver.driverNumber}`

  const teamBadge = document.createElement('span')
  teamBadge.className = 'team-badge'
  teamBadge.textContent = isWinner ? '🏆 GANADOR' : driver.teamName

  cardHeader.append(driverNum, teamBadge)

  // Cuerpo
  const cardBody = document.createElement('div')
  cardBody.className = 'card-body'

  const avatar = AvatarElement(driver.headshotUrl, driver.fullName, driver.acronym)

  const details = document.createElement('div')
  details.className = 'driver-details'

  const name = document.createElement('h3')
  name.textContent = driver.fullName

  const acronym = document.createElement('span')
  acronym.className = 'acronym'
  acronym.textContent = driver.acronym

  details.append(name, acronym)
  cardBody.append(avatar, details)

  // Estadísticas
  const cardStats = document.createElement('div')
  cardStats.className = 'card-stats'

  // Vueltas
  const lapsItem = document.createElement('div')
  lapsItem.className = 'stat-item'
  lapsItem.innerHTML = '' // Asegurar nodo limpio
  const lapsLabel = document.createElement('span')
  lapsLabel.className = 'stat-label'
  lapsLabel.textContent = 'Vueltas'
  const lapsVal = document.createElement('span')
  lapsVal.className = 'stat-value'
  lapsVal.textContent = driver.totalLaps.toString()
  lapsItem.append(lapsLabel, lapsVal)

  // Mejor Vuelta
  const bestItem = document.createElement('div')
  bestItem.className = 'stat-item'
  const bestLabel = document.createElement('span')
  bestLabel.className = 'stat-label'
  bestLabel.textContent = 'Mejor Vuelta'
  const bestVal = document.createElement('span')
  bestVal.className = 'stat-value highlight'
  bestVal.textContent = formatTime(driver.bestLapTime)
  bestItem.append(bestLabel, bestVal)

  // Promedio
  const avgItem = document.createElement('div')
  avgItem.className = 'stat-item'
  const avgLabel = document.createElement('span')
  avgLabel.className = 'stat-label'
  avgLabel.textContent = 'Promedio'
  const avgVal = document.createElement('span')
  avgVal.className = 'stat-value'
  avgVal.textContent = formatTime(driver.averageLapTime)
  avgItem.append(avgLabel, avgVal)

  cardStats.append(lapsItem, bestItem, avgItem)
  card.append(cardHeader, cardBody, cardStats)

  return card
}

/**
 * MODO 1: Tarjeta para Ficha de Piloto Individual
 */
export function SingleDriverTemplate(driver: DriverStats, position: number): HTMLElement {
  const card = DriverCardTemplate(driver)
  card.classList.add('single-view')

  if (position > 0) {
    const posElem = document.createElement('div')
    posElem.className = 'driver-position-badge'
    posElem.textContent = `Población Estimada: P${position}`
    card.prepend(posElem)
  }

  return card
}

/**
 * MODO 2: Tarjeta del Ganador de la Carrera
 */
export function WinnerTemplate(winner: DriverStats): HTMLElement {
  const card = DriverCardTemplate(winner, true)
  card.classList.add('winner-card')
  return card
}

/**
 * MODO 3: Tarjeta de la Mejor Vuelta de la Sesión
 */
export function FastestLapTemplate(fastestDriver: DriverStats): HTMLElement {
  const card = DriverCardTemplate(fastestDriver)
  card.classList.add('winner-card')

  const badge = card.querySelector('.team-badge')
  if (badge) {
    badge.textContent = '⚡ MEJOR VUELTA'
  }

  return card
}