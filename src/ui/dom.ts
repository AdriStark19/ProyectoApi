/**
 * Mini-helper para crear elementos del DOM de forma declarativa.
 * Usa textContent en lugar de innerHTML: los textos que vienen de la API
 * nunca se interpretan como HTML (evita inyecciones XSS).
 */

type Child = Node | string | null | undefined | false;

type Listeners = { [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void };

interface ElementOptions {
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
  on?: Listeners;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;

  Object.entries(options.attrs ?? {}).forEach(([name, value]) => element.setAttribute(name, value));
  Object.entries(options.on ?? {}).forEach(([type, listener]) => element.addEventListener(type, listener as EventListener));

  children.filter((child): child is Node | string => Boolean(child)).forEach((child) => element.append(child));
  return element;
}

/** Sustituye todo el contenido de un contenedor. */
export function mount(container: HTMLElement, ...nodes: Node[]): void {
  container.replaceChildren(...nodes);
}

/** Imagen que desaparece si la URL de la API está rota, en vez de mostrar el icono roto. */
export function safeImage(src: string | null | undefined, alt: string, className: string): HTMLImageElement | null {
  if (!src) return null;
  const image = h('img', { className, attrs: { src, alt, loading: 'lazy', decoding: 'async' } });
  image.addEventListener('error', () => image.remove(), { once: true });
  return image;
}

/** Busca un elemento obligatorio del index.html y falla con un mensaje claro si no existe. */
export function requireElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Falta el elemento ${selector} en index.html`);
  return element;
}
