import type { DriverStats } from '../types/f1'

const contentArea = document.getElementById('content-area') as HTMLElement | null

/**
 * Convierte un tiempo en segundos (ej. 90.584) al formato de telemetría F1 (ej. "1:30.584")
 */
function formatLapTime(seconds: number | null): string {
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
 * Crea el nodo DOM de una tarjeta de piloto sin usar innerHTML
 */
function createDriverCard(driver: DriverStats, isWinner: boolean = false): HTMLElement {
  const card = document.createElement('article')
  const normalizedTeam = driver.teamName.toLowerCase().replace(/\s+/g, '-')
  card.className = `driver-card team-${normalizedTeam}`

  // 1. Cabecera
  const cardHeader = document.createElement('div')
  cardHeader.className = 'card-header'

  const driverNum = document.createElement('span')
  driverNum.className = 'driver-number'
  driverNum.textContent = `#${driver.driverNumber}`

  const teamBadge = document.createElement('span')
  teamBadge.className = 'team-badge'
  teamBadge.textContent = isWinner ? '🏆 GANADOR' : driver.teamName

  cardHeader.append(driverNum, teamBadge)

  // 2. Cuerpo
  const cardBody = document.createElement('div')
  cardBody.className = 'card-body'

  if (driver.headshotUrl) {
    const img = document.createElement('img')
    img.src = driver.headshotUrl
    img.alt = driver.fullName
    img.className = 'driver-photo'
    cardBody.appendChild(img)
  } else {
    const placeholder = document.createElement('div')
    placeholder.className = 'driver-photo-placeholder'
    placeholder.textContent = driver.acronym
    cardBody.appendChild(placeholder)
  }

  const details = document.createElement('div')
  details.className = 'driver-details'

  const name = document.createElement('h3')
  name.textContent = driver.fullName

  const acronym = document.createElement('span')
  acronym.className = 'acronym'
  acronym.textContent = driver.acronym

  details.append(name, acronym)
  cardBody.appendChild(details)

  // 3. Estadísticas con tiempos formateados
  const cardStats = document.createElement('div')
  cardStats.className = 'card-stats grid-stats'

  // Mejor Vuelta
  const bestLapItem = document.createElement('div')
  bestLapItem.className = 'stat-item'

  const bestLabel = document.createElement('span')
  bestLabel.className = 'stat-label'
  bestLabel.textContent = 'Mejor Vuelta:'

  const bestVal = document.createElement('span')
  bestVal.className = 'stat-value highlight'
  bestVal.textContent = formatLapTime(driver.bestLapTime)

  bestLapItem.append(bestLabel, bestVal)

  // Ritmo Medio
  const avgLapItem = document.createElement('div')
  avgLapItem.className = 'stat-item'

  const avgLabel = document.createElement('span')
  avgLabel.className = 'stat-label'
  avgLabel.textContent = 'Ritmo Medio:'

  const avgVal = document.createElement('span')
  avgVal.className = 'stat-value'
  avgVal.textContent = formatLapTime(driver.averageLapTime)

  avgLapItem.append(avgLabel, avgVal)

  // Vueltas Completadas
  const lapsItem = document.createElement('div')
  lapsItem.className = 'stat-item'

  const lapsLabel = document.createElement('span')
  lapsLabel.className = 'stat-label'
  lapsLabel.textContent = 'Vueltas:'

  const lapsVal = document.createElement('span')
  lapsVal.className = 'stat-value'
  lapsVal.textContent = driver.totalLaps.toString()

  lapsItem.append(lapsLabel, lapsVal)

  cardStats.append(bestLapItem, avgLapItem, lapsItem)
  card.append(cardHeader, cardBody, cardStats)

  return card
}

/**
 * Renderiza el estado de carga
 */
export function renderLoading(): void {
  if (!contentArea) return

  const container = document.createElement('div')
  container.className = 'state-container'

  const spinner = document.createElement('div')
  spinner.className = 'spinner'

  const text = document.createElement('p')
  text.textContent = 'Cargando datos de OpenF1...'

  container.append(spinner, text)
  contentArea.replaceChildren(container)
}

/**
 * Renderiza un mensaje de error
 */
export function renderError(message: string): void {
  if (!contentArea) return

  const container = document.createElement('div')
  container.className = 'state-container error-state'

  const title = document.createElement('h3')
  title.textContent = 'Error al cargar telemetría'

  const text = document.createElement('p')
  text.textContent = message

  container.append(title, text)
  contentArea.replaceChildren(container)
}

/**
 * Renderiza un estado vacío
 */
function renderEmpty(message: string): void {
  if (!contentArea) return

  const container = document.createElement('div')
  container.className = 'state-container'

  const text = document.createElement('p')
  text.textContent = message

  container.appendChild(text)
  contentArea.replaceChildren(container)
}

/**
 * MODO GENERAL: Renderiza la parrilla completa con todos los participantes
 */
export function renderAllDrivers(stats: DriverStats[], winner: DriverStats | null): void {
  if (!contentArea) return

  if (stats.length === 0) {
    renderEmpty('No se encontraron participantes.')
    return
  }

  const grid = document.createElement('div')
  grid.className = 'drivers-grid'

  stats.forEach((driver) => {
    const isWinner = winner ? winner.driverNumber === driver.driverNumber : false
    const card = createDriverCard(driver, isWinner)
    grid.appendChild(card)
  })

  contentArea.replaceChildren(grid)
}

/**
 * MODO 1: Ficha individual de piloto
 */
export function renderSingleDriver(driver: DriverStats | null, position: number): void {
  if (!contentArea) return

  if (!driver) {
    renderEmpty('Selecciona un piloto del desplegable.')
    return
  }

  const card = createDriverCard(driver)
  card.classList.add('single-view')

  if (position > 0) {
    const posElem = document.createElement('div')
    posElem.className = 'driver-position'
    posElem.textContent = `Posición en sesión: #${position}`
    card.prepend(posElem)
  }

  contentArea.replaceChildren(card)
}

/**
 * MODO 2: Ganador de la carrera
 */
export function renderWinnerView(winner: DriverStats | null): void {
  if (!contentArea) return

  if (!winner) {
    renderEmpty('No se pudo determinar un ganador con el 100% de vueltas completadas.')
    return
  }

  const card = createDriverCard(winner, true)
  card.classList.add('winner-card')

  contentArea.replaceChildren(card)
}

/**
 * MODO 3: Mejor vuelta de la sesión
 */
export function renderFastestLapView(fastestDriver: DriverStats | null): void {
  if (!contentArea) return

  if (!fastestDriver) {
    renderEmpty('No hay registros de tiempo de vuelta válidos.')
    return
  }

  const card = createDriverCard(fastestDriver)
  card.classList.add('fastest-lap-card')

  const badge = card.querySelector('.team-badge')
  if (badge) {
    badge.textContent = '⚡ MEJOR VUELTA'
    badge.className = 'team-badge badge-fastest'
  }

  contentArea.replaceChildren(card)
}