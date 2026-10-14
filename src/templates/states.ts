/**
 * Plantilla para el estado de carga (Spinner)
 */
export const LoadingTemplate = (): string => `
  <div class="state-container">
    <div class="spinner"></div>
    <p>Cargando datos de telemetría desde OpenF1...</p>
  </div>
`

/**
 * Plantilla para el estado de error
 */
export const ErrorTemplate = (message: string): string => `
  <div class="state-container error-box">
    <span class="error-icon">⚠️</span>
    <h3>Error en la consulta</h3>
    <p>${message}</p>
  </div>
`

/**
 * Plantilla para el estado sin resultados / vacío
 */
export const EmptyTemplate = (message: string = 'No hay datos disponibles.'): string => `
  <div class="state-container">
    <p>${message}</p>
  </div>
`