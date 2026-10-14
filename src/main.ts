import { fetchDriverStats } from './api/f1Api'
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
let currentSession: SessionInfo | null = null
let currentStats: DriverStats[] = []
let currentWinner: DriverStats | null = null
let currentFastest: DriverStats | null = null
let currentView: 'grid' | 'single' | 'winner' | 'fastest' = 'grid'

// Referencias al DOM
const yearSelect = document.getElementById('year-select') as HTMLSelectElement | null
const sessionTitleEl = document.getElementById('session-title') as HTMLElement | null
const driverSelectContainer = document.getElementById('driver-select-container')
const driverSelect = document.getElementById('driver-select') as HTMLSelectElement | null
const searchContainer = document.getElementById('search-container')
const searchInput = document.getElementById('search-input') as HTMLInputElement | null
const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-btn')

/**
 * Actualiza la insignia de información de la sesión en el DOM
 */
function updateSessionBadge(): void {
  if (!sessionTitleEl || !currentSession) return
  
  sessionTitleEl.textContent = `${currentSession.year} · ${currentSession.sessionName} (${currentSession.sessionType})`
}

/**
 * Genera dinámicamente las opciones del selector de año (desde 2023 hasta el actual)
 */
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
}

/**
 * Popula el desplegable del selector de piloto para el Modo 1 (Ficha Piloto) sin innerHTML
 */
function populateDriverDropdown(stats: DriverStats[]): void {
  if (!driverSelect) return

  // Opción por defecto
  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = '-- Selecciona un piloto --'

  // Ordenamos los pilotos por dorsal
  const sortedStats = [...stats].sort((a, b) => a.driverNumber - b.driverNumber)

  // Creamos el array de nodos de opciones
  const options = sortedStats.map((driver) => {
    const option = document.createElement('option')
    option.value = driver.driverNumber.toString()
    option.textContent = `#${driver.driverNumber} - ${driver.fullName} (${driver.acronym})`
    return option
  })

  // Limpiamos el select y agregamos las nuevas opciones de forma limpia
  driverSelect.replaceChildren(defaultOption, ...options)
}

/**
 * Renderiza la pantalla y gestiona la visibilidad de los controles según la vista activa
 */
function updateView(): void {
  if (currentView === 'grid') {
    // Modo 0: Parrilla General -> Mostrar buscador, ocultar selector de piloto
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
    // Modo 1: Ficha Piloto -> Ocultar buscador, mostrar selector de piloto
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.remove('hidden')

    const selectedDriverNumber = Number(driverSelect?.value)
    const selectedDriver = currentStats.find((d) => d.driverNumber === selectedDriverNumber) || null

    // Posición estimada en base a su ritmo en la lista general
    const position = selectedDriver ? currentStats.indexOf(selectedDriver) + 1 : 0
    renderSingleDriver(selectedDriver, position)
  } else if (currentView === 'winner') {
    // Modo 2: Ganador -> Ocultar ambos controles
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.add('hidden')

    renderWinnerView(currentWinner)
  } else if (currentView === 'fastest') {
    // Modo 3: Mejor Vuelta -> Ocultar ambos controles
    if (searchContainer) searchContainer.classList.add('hidden')
    if (driverSelectContainer) driverSelectContainer.classList.add('hidden')

    renderFastestLapView(currentFastest)
  }
}

/**
 * Carga los datos desde la API de OpenF1 para el año seleccionado (>= 2023)
 */
async function loadData(year: number): Promise<void> {
  if (year < 2023) {
    renderError('OpenF1 solo dispone de datos desde la temporada 2023 en adelante.')
    return
  }

  renderLoading()

  try {
    const result = await fetchDriverStats(year)
    currentSession = result.session
    currentStats = result.stats

    // El ganador solo es válido si la sesión es de tipo "Race"
    currentWinner = getWinner(currentStats, currentSession?.sessionType)
    currentFastest = getFastestLapDriver(currentStats)

    updateSessionBadge()
    populateDriverDropdown(currentStats)
    updateView()
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error al cargar telemetría.'
    renderError(errorMsg)
  }
}

/**
 * Registra los manejadores de eventos para controles e interactividad
 */
function initEvents(): void {
  // Evento al cambiar de año en el selector
  yearSelect?.addEventListener('change', (e) => {
    const selectedYear = Number((e.target as HTMLSelectElement).value)
    loadData(selectedYear)
  })

  // Eventos para cambiar de vista desde la botonera superior
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      navButtons.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')

      currentView = (btn.dataset.view as typeof currentView) || 'grid'
      updateView()
    })
  })

  // Evento de búsqueda en tiempo real (Parrilla General)
  searchInput?.addEventListener('input', () => {
    if (currentView === 'grid') updateView()
  })

  // Evento de selección de piloto en el dropdown (Ficha Piloto)
  driverSelect?.addEventListener('change', () => {
    if (currentView === 'single') updateView()
  })
}

/**
 * Punto de entrada y arranque de la aplicación
 */
function init(): void {
  setupYearSelector()
  initEvents()

  const initialYear = yearSelect ? Number(yearSelect.value) : 2023
  loadData(initialYear)
}

// Arrancar la app
init()