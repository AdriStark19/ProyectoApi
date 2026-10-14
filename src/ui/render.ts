import type { DriverStats } from '../types/f1'
import { 
  DriverCardTemplate, 
  SingleDriverTemplate, 
  WinnerTemplate, 
  FastestLapTemplate 
} from '../templates/driverCard'
import { LoadingTemplate, ErrorTemplate, EmptyTemplate } from '../templates/states'

const contentArea = document.getElementById('content-area') as HTMLElement | null

export function renderLoading(): void {
  if (contentArea) {
    contentArea.replaceChildren(LoadingTemplate())
  }
}

export function renderError(message: string): void {
  if (contentArea) {
    contentArea.replaceChildren(ErrorTemplate(message))
  }
}

export function renderAllDrivers(stats: DriverStats[], winner: DriverStats | null): void {
  if (!contentArea) return

  if (stats.length === 0) {
    contentArea.replaceChildren(EmptyTemplate('No se encontraron participantes.'))
    return
  }

  const grid = document.createElement('div')
  grid.className = 'drivers-grid'

  stats.forEach((driver) => {
    const isWinner = winner ? winner.driverNumber === driver.driverNumber : false
    const cardNode = DriverCardTemplate(driver, isWinner)
    grid.appendChild(cardNode)
  })

  contentArea.replaceChildren(grid)
}

export function renderSingleDriver(driver: DriverStats | null, position: number): void {
  if (!contentArea) return

  if (!driver) {
    contentArea.replaceChildren(EmptyTemplate('Selecciona un piloto del desplegable.'))
    return
  }

  contentArea.replaceChildren(SingleDriverTemplate(driver, position))
}

export function renderWinnerView(winner: DriverStats | null): void {
  if (!contentArea) return

  if (!winner) {
    contentArea.replaceChildren(EmptyTemplate('No se pudo determinar un ganador con el 100% de vueltas completadas.'))
    return
  }

  contentArea.replaceChildren(WinnerTemplate(winner))
}

export function renderFastestLapView(fastestDriver: DriverStats | null): void {
  if (!contentArea) return

  if (!fastestDriver) {
    contentArea.replaceChildren(EmptyTemplate('No hay registros de tiempo de vuelta válidos.'))
    return
  }

  contentArea.replaceChildren(FastestLapTemplate(fastestDriver))
}