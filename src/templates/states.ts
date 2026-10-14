export function LoadingTemplate(): HTMLElement {
  const container = document.createElement('div')
  container.className = 'state-container'

  const spinner = document.createElement('div')
  spinner.className = 'spinner'

  const text = document.createElement('p')
  text.textContent = 'Cargando datos de telemetría desde OpenF1...'

  container.append(spinner, text)
  return container
}

export function ErrorTemplate(message: string): HTMLElement {
  const container = document.createElement('div')
  container.className = 'state-container'

  const title = document.createElement('h3')
  title.textContent = 'Error en la consulta'

  const text = document.createElement('p')
  text.textContent = message

  container.append(title, text)
  return container
}

export function EmptyTemplate(message: string = 'No hay datos disponibles.'): HTMLElement {
  const container = document.createElement('div')
  container.className = 'state-container'

  const text = document.createElement('p')
  text.textContent = message

  container.appendChild(text)
  return container
}