// Archivo: src/utils/dataTransformers.ts
import type { DriverStats } from '../types/f1'

/**
 * MODO GANADOR: Calcula el ganador de la carrera según la regla del 100% 
 * de vueltas completadas y el menor tiempo medio/promedio acumulado.
 */
export function getWinner(stats: DriverStats[], sessionType?: string): DriverStats | null {
  // 1. Si no hay datos o la sesión no es de tipo carrera ("Race"), no hay ganador
  if (stats.length === 0) return null
  if (sessionType && sessionType.toLowerCase() !== 'race') return null

  // 2. Encontrar el número máximo de vueltas completadas en la sesión
  const maxLaps = Math.max(...stats.map((d) => d.totalLaps))
  if (maxLaps === 0) return null

  // 3. Filtrar únicamente a los pilotos que completaron el 100% de esas vueltas
  const finishers = stats.filter((d) => d.totalLaps === maxLaps)
  if (finishers.length === 0) return null

  // 4. Obtener el piloto con el menor promedio de tiempo por vuelta
  return finishers.reduce((winner, driver) => {
    if (driver.averageLapTime === null) return winner
    if (winner.averageLapTime === null) return driver

    return driver.averageLapTime < winner.averageLapTime ? driver : winner
  })
}
/**
 * MODO MEJOR VUELTA: Obtiene el piloto que registró la mejor vuelta 
 * absoluta (menor tiempo en segundos) de toda la sesión.
 */
export function getFastestLapDriver(stats: DriverStats[]): DriverStats | null {
  if (stats.length === 0) return null

  return stats.reduce<DriverStats | null>((fastest, driver) => {
    if (driver.bestLapTime === null) return fastest
    if (!fastest || fastest.bestLapTime === null) return driver

    return driver.bestLapTime < fastest.bestLapTime ? driver : fastest
  }, null)
}