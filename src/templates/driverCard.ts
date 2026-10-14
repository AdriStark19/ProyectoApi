import type { DriverStats } from '../types/f1'

/**
 * Formatea segundos a formato de tiempo F1 (ej. 84.321 -> 1:24.321)
 */
export function formatTime(seconds: number | null): string {
  if (seconds === null) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`
}

/**
 * Plantilla de Foto/Avatar del piloto
 */
export const AvatarTemplate = (photoUrl: string | null, fullName: string, acronym: string): string => {
  if (photoUrl) {
    return `<img src="${photoUrl}" alt="${fullName}" class="driver-photo" loading="lazy" />`
  }
  return `<div class="driver-photo-placeholder">${acronym}</div>`
}

/**
 * MODO GENERAL: Tarjeta de la parrilla de todos los participantes
 */
export const DriverCardTemplate = (driver: DriverStats, isWinner: boolean): string => `
  <article class="driver-card ${isWinner ? 'is-winner' : ''}" style="border-top: 4px solid ${driver.teamColor}">
    <div class="card-header">
      <span class="driver-number">#${driver.driverNumber}</span>
      <span class="team-badge" style="background-color: ${driver.teamColor}">${driver.teamName}</span>
    </div>

    <div class="card-body">
      ${AvatarTemplate(driver.headshotUrl, driver.fullName, driver.acronym)}
      <div class="driver-details">
        <h4>${driver.fullName}</h4>
        <p class="acronym">${driver.acronym}</p>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <span class="stat-label">Vueltas</span>
        <span class="stat-value">${driver.totalLaps}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Mejor Vuelta</span>
        <span class="stat-value highlight">${formatTime(driver.bestLapTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Promedio</span>
        <span class="stat-value">${formatTime(driver.averageLapTime)}</span>
      </div>
    </div>
  </article>
`

/**
 * MODO 1: Tarjeta de Análisis de Piloto Individual
 */
export const SingleDriverTemplate = (driver: DriverStats, position: number): string => `
  <article class="driver-card single-view" style="border-top: 4px solid ${driver.teamColor}">
    <div class="card-header">
      <span class="driver-position">P${position}</span>
      <span class="team-badge" style="background-color: ${driver.teamColor}">${driver.teamName}</span>
    </div>

    <div class="card-body">
      ${AvatarTemplate(driver.headshotUrl, driver.fullName, driver.acronym)}
      <div class="driver-details">
        <h3>${driver.fullName}</h3>
        <p class="acronym">#${driver.driverNumber} · ${driver.acronym}</p>
      </div>
    </div>

    <div class="card-stats grid-stats">
      <div class="stat-item">
        <span class="stat-label">Posición Estimada</span>
        <span class="stat-value">P${position}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Mejor Vuelta</span>
        <span class="stat-value highlight">${formatTime(driver.bestLapTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Ritmo Medio de Carrera</span>
        <span class="stat-value">${formatTime(driver.averageLapTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Vueltas Totales</span>
        <span class="stat-value">${driver.totalLaps}</span>
      </div>
    </div>
  </article>
`

/**
 * MODO 2: Tarjeta del Ganador de la Carrera
 */
export const WinnerTemplate = (winner: DriverStats): string => `
  <article class="driver-card winner-card" style="border-top: 4px solid ${winner.teamColor}">
    <div class="card-header">
      <span class="badge-trophy">🏆 GANADOR DE LA CARRERA</span>
      <span class="team-badge" style="background-color: ${winner.teamColor}">${winner.teamName}</span>
    </div>

    <div class="card-body">
      ${AvatarTemplate(winner.headshotUrl, winner.fullName, winner.acronym)}
      <div class="driver-details">
        <h3>${winner.fullName}</h3>
        <p class="acronym">#${winner.driverNumber} · ${winner.acronym}</p>
      </div>
    </div>

    <div class="card-stats grid-stats">
      <div class="stat-item">
        <span class="stat-label">Vueltas Completadas</span>
        <span class="stat-value">${winner.totalLaps} (100%)</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Ritmo Promedio Total</span>
        <span class="stat-value highlight">${formatTime(winner.averageLapTime)}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Mejor Vuelta</span>
        <span class="stat-value">${formatTime(winner.bestLapTime)}</span>
      </div>
    </div>
  </article>
`

/**
 * MODO 3: Tarjeta de la Mejor Vuelta de la Sesión
 */
export const FastestLapTemplate = (fastestDriver: DriverStats): string => `
  <article class="driver-card fastest-lap-card" style="border-top: 4px solid ${fastestDriver.teamColor}">
    <div class="card-header">
      <span class="badge-fastest">⚡ MEJOR VUELTA DE LA SESIÓN</span>
      <span class="team-badge" style="background-color: ${fastestDriver.teamColor}">${fastestDriver.teamName}</span>
    </div>

    <div class="card-body">
      ${AvatarTemplate(fastestDriver.headshotUrl, fastestDriver.fullName, fastestDriver.acronym)}
      <div class="driver-details">
        <h3>${fastestDriver.fullName}</h3>
        <p class="acronym">#${fastestDriver.driverNumber} · ${fastestDriver.acronym}</p>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item highlight-box">
        <span class="stat-label">Tiempo Record</span>
        <span class="stat-value mega-time">${formatTime(fastestDriver.bestLapTime)}</span>
      </div>
    </div>
  </article>
`