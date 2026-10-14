import { fetchDriverStats, fetchSessionsByYear, fetchDriversByYear, } from './api/f1Api'
import { getWinner, getFastestLapDriver } from './utils/dataTransformers'
import { 
  renderAllDrivers, 
  renderSingleDriver, 
  renderWinnerView, 
  renderFastestLapView, 
  renderLoading, 
  renderError 
} from './ui/render'
import type { DriverStats, SessionInfo } from './types/f1'

// Estado global
let availableSessions: SessionInfo[] = []
let currentSession: SessionInfo | null = null
let currentStats: DriverStats[] = []
let currentWinner: DriverStats | null = null
let currentFastest: DriverStats | null = null
let currentView: 'grid' | 'single' | 'winner' | 'fastest' = 'grid'

// Referencias DOM
const yearSelect = document.getElementById('year-select') as HTMLSelectElement | null
const sessionSelect = document.getElementById('session-select') as HTMLSelectElement | null
const driverSelectContainer = document.getElementById('driver-select-container')
const driverSelect = document.getElementById('driver-select') as HTMLSelectElement | null
const searchContainer = document.getElementById('search-container')
const searchInput = document.getElementById('search-input') as HTMLInputElement | null
const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')

function setupYearSelector(): void {
  if (!yearSelect) return

  const startYear = 2023
  const currentYear = new Date().getFullYear()

  const options: HTMLOptionElement[] = []

  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement('option')
    option.value = year.toString()
    option.textContent = year.toString()
    options.push(option)
  }

  yearSelect.replaceChildren(...options)
  yearSelect.value = '2023' // Año por defecto estable
}

function populateSessionDropdown(sessions: SessionInfo[]): void {
  if (!sessionSelect) return

  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = '-- Selecciona una sesión --'

  const options = sessions.map((s) => {
    const option = document.createElement('option')
    option.value = s.sessionKey.toString()
    option.textContent = `${s.sessionName} (${s.sessionType})`
    return option
  })

  sessionSelect.replaceChildren(defaultOption, ...options)
  sessionSelect.value = ''
}
function populateDriverDropdown(stats: DriverStats[]): void {
  if (!driverSelect) return

  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = '-- Selecciona un piloto --'

  const sortedStats = [...stats].sort((a, b) => a.driverNumber - b.driverNumber)

  const options = sortedStats.map((driver) => {
    const option = document.createElement('option')
    option.value = driver.driverNumber.toString()
    option.textContent = `Nº ${driver.driverNumber} - ${driver.fullName} (${driver.acronym})`
    return option
  })

  driverSelect.replaceChildren(defaultOption, ...options)
}

function updateView(): void {
  if (currentView === 'grid') {
    if (searchContainer) searchContainer.classList.remove('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.add('hidden')

    const query = searchInput?.value.toLowerCase().trim() || ''
    const filtered = currentStats.filter((driver) => 
      driver.fullName.toLowerCase().includes(query) ||
      driver.teamName.toLowerCase().includes(query) ||
      driver.acronym.toLowerCase().includes(query)
    )

    renderAllDrivers(filtered, currentWinner)
  } else if (currentView === 'single') {
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.remove('hidden')

    if (driverSelect && !driverSelect.value && currentStats.length > 0) {
      const sortedStats = [...currentStats].sort((a, b) => a.driverNumber - b.driverNumber)
      driverSelect.value = sortedStats[0].driverNumber.toString()
    }

    const selectedDriverNumber = Number(driverSelect?.value)
    const selectedDriver = currentStats.find((d) => d.driverNumber === selectedDriverNumber) || null

    const position = selectedDriver ? currentStats.indexOf(selectedDriver) + 1 : 0
    renderSingleDriver(selectedDriver, position)
  } else if (currentView === 'winner') {
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.add('hidden')

    renderWinnerView(currentWinner)
  } else if (currentView === 'fastest') {
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.add('hidden')

    renderFastestLapView(currentFastest)
  }
}

async function loadDataForYear(
  year: number,
  sessionKey?: number
): Promise<void> {
  renderLoading()

  try {
    availableSessions = await fetchSessionsByYear(year)
    populateSessionDropdown(availableSessions)

    currentSession = null
    currentStats = []
    currentWinner = null
    currentFastest = null

    if (!sessionKey) {
      // Estado inicial: parrilla del año sin estadísticas de sesión.
      currentStats = await fetchDriversByYear(year)

      populateDriverDropdown(currentStats)
      updateView()
      return
    }

    if (sessionSelect) {
      sessionSelect.value = sessionKey.toString()
    }

    const result = await fetchDriverStats(year, sessionKey)

    currentSession = result.session
    currentStats = result.stats

    currentWinner = getWinner(
      currentStats,
      currentSession?.sessionType
    )

    currentFastest = getFastestLapDriver(currentStats)

    populateDriverDropdown(currentStats)
    updateView()
  } catch (error) {
    const errorMsg = error instanceof Error
      ? error.message
      : 'Error al cargar telemetría.'

    renderError(errorMsg)
  }
}

function initEvents(): void {
  // Cambio de año -> Recarga sesiones
  yearSelect?.addEventListener('change', (e) => {
    const selectedYear = Number((e.target as HTMLSelectElement).value)
    loadDataForYear(selectedYear)
  })

  // Cambio de sesión -> Carga la sesión seleccionada del desplegable
 sessionSelect?.addEventListener('change', (e) => {
  const selectedYear = Number(yearSelect?.value || 2023)
  const value = (e.target as HTMLSelectElement).value

  loadDataForYear(
    selectedYear,
    value ? Number(value) : undefined
  )
})

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      navButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')

      currentView = (btn.dataset.view as typeof currentView) || 'grid'
      updateView()
    })
  })

  searchInput?.addEventListener('input', () => {
    if (currentView === 'grid') updateView()
  })

  driverSelect?.addEventListener('change', () => {
    if (currentView === 'single') updateView()
  })
}

function init(): void {
  setupYearSelector()
  initEvents()

  const initialYear = Number(yearSelect?.value || 2023)
  loadDataForYear(initialYear)
}

init()