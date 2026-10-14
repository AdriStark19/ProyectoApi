import type { OpenF1Driver, OpenF1Lap, DriverStats, SessionInfo} from '../types/f1'

const BASE_URL = 'https://api.openf1.org/v1'
const CACHE_TTL_MS = 1000 * 60 * 30

interface CacheEnvelope<T> {
  timestamp: number
  data: T
}

function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const parsed: CacheEnvelope<T> = JSON.parse(raw)
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS

    if (isExpired) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch (err) {
    console.warn(`[Cache] Error al leer la clave "${key}":`, err)
    return null
  }
}

function saveToCache<T>(key: string, data: T): void {
  try {
    const envelope: CacheEnvelope<T> = {
      timestamp: Date.now(),
      data,
    }
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch (err) {
    console.warn(`[Cache] Error al guardar la clave "${key}":`, err)
  }
}

export async function fetchWithCache<T>(endpoint: string): Promise<T> {
  const cacheKey = `f1_cache_${endpoint}`
  const cachedData = getFromCache<T>(cacheKey)

  if (cachedData) {
    return cachedData
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`)

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }

    const data: T = await response.json()
    saveToCache(cacheKey, data)
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Fallo en OpenF1: ${error.message}`)
    }
    throw new Error('Error desconocido al consultar la API.')
  }
}

/**
 * Obtiene todas las sesiones de un año para poblar el desplegable
 */
export async function fetchSessionsByYear(year: number): Promise<SessionInfo[]> {
  const sessions = await fetchWithCache<any[]>(`/sessions?year=${year}`)
  if (!sessions || sessions.length === 0) return []

  return sessions.map((s) => ({
    sessionKey: s.session_key,
    sessionName: `${s.location || s.country_name || 'GP'} - ${s.session_name || 'Sesión'}`,
    sessionType: s.session_type || 'Unknown',
    dateStart: s.date_start || '',
    year
  }))
}

/**
 * Obtiene datos de la sesión seleccionada (o la última si no se pasa sessionKey)
 */
export async function fetchDriverStats(year: number, sessionKey?: number): Promise<FetchResult> {
  let currentSession: SessionInfo | null = null

  if (sessionKey) {
    const sessions = await fetchWithCache<any[]>(`/sessions?session_key=${sessionKey}`)
    if (sessions && sessions.length > 0) {
      const s = sessions[0]
      currentSession = {
        sessionKey: s.session_key,
        sessionName: `${s.location || s.country_name || 'GP'} - ${s.session_name || 'Sesión'}`,
        sessionType: s.session_type || 'Unknown',
        dateStart: s.date_start || '',
        year
      }
    }
  } else {
    const sessions = await fetchWithCache<any[]>(`/sessions?session_key=latest&year=${year}`)
    if (sessions && sessions.length > 0) {
      const s = sessions[0]
      currentSession = {
        sessionKey: s.session_key,
        sessionName: `${s.location || s.country_name || 'GP'} - ${s.session_name || 'Sesión'}`,
        sessionType: s.session_type || 'Unknown',
        dateStart: s.date_start || '',
        year
      }
    }
  }

  if (!currentSession) {
    return { session: null, stats: [] }
  }

  const [driversData, lapsData] = await Promise.all([
    fetchWithCache<any[]>(`/drivers?session_key=${currentSession.sessionKey}`),
    fetchWithCache<any[]>(`/laps?session_key=${currentSession.sessionKey}`)
  ])

  const statsMap = new Map<number, DriverStats>()

  driversData.forEach((driver: any) => {
    if (!driver.driver_number) return

    statsMap.set(driver.driver_number, {
      driverNumber: driver.driver_number,
      fullName: driver.full_name || 'Piloto Desconocido',
      acronym: driver.name_acronym || 'DRV',
      teamName: driver.team_name || 'Escudería N/A',
      teamColor: driver.team_color ? `#${driver.team_color}` : '#9a9ea7',
      headshotUrl: driver.headshot_url || null,
      totalLaps: 0,
      bestLapTime: null,
      averageLapTime: null
    })
  })

  const lapTimesMap = new Map<number, number[]>()

  lapsData.forEach((lap: any) => {
    const driverNum = lap.driver_number
    const duration = lap.lap_duration

    if (!driverNum || !duration || duration <= 0) return

    if (!lapTimesMap.has(driverNum)) {
      lapTimesMap.set(driverNum, [])
    }
    lapTimesMap.get(driverNum)?.push(duration)
  })

  statsMap.forEach((stats, driverNumber) => {
    const times = lapTimesMap.get(driverNumber) || []
    
    if (times.length > 0) {
      stats.totalLaps = times.length
      stats.bestLapTime = Math.min(...times)
      
      const sumTimes = times.reduce((acc, curr) => acc + curr, 0)
      stats.averageLapTime = sumTimes / times.length
    }
  })

  return {
    session: currentSession,
    stats: Array.from(statsMap.values())
  }
}