/**
 * Estados visibles para el usuario: cargando, error y vacío.
 * La carga imita el semáforo de salida de F1: cinco luces que se encienden en orden.
 */

import { h } from './dom.ts';

export function loadingView(message: string): HTMLElement {
  const lights = Array.from({ length: 5 }, (_, index) =>
    h('span', { className: 'start-lights__light', attrs: { style: `--light-index: ${index}` } }),
  );
  return h('div', { className: 'state state--loading', attrs: { role: 'status' } }, [
    h('div', { className: 'start-lights', attrs: { 'aria-hidden': 'true' } }, lights),
    h('p', { className: 'state__text', text: message }),
  ]);
}

export function errorView(message: string, onRetry?: () => void): HTMLElement {
  const retryButton = onRetry
    ? h('button', { className: 'button', text: 'Reintentar', attrs: { type: 'button' }, on: { click: onRetry } })
    : null;

  return h('div', { className: 'state state--error', attrs: { role: 'alert' } }, [
    h('span', { className: 'state__flag', attrs: { 'aria-hidden': 'true' } }),
    h('p', { className: 'state__title', text: 'Bandera roja' }),
    h('p', { className: 'state__text', text: message }),
    retryButton,
  ]);
}

export function emptyView(title: string, hint?: string): HTMLElement {
  return h('div', { className: 'state state--empty' }, [
    h('p', { className: 'state__title', text: title }),
    hint ? h('p', { className: 'state__text', text: hint }) : null,
  ]);
}

/** Etiqueta pequeña que indica si los datos vienen de la caché local. */
export function sourceBadge(fromCache: boolean): HTMLElement {
  return h('span', {
    className: `badge ${fromCache ? 'badge--cache' : 'badge--live'}`,
    text: fromCache ? 'Desde caché' : 'Recién descargado',
    attrs: { title: fromCache ? 'Datos guardados en localStorage: no se ha repetido la petición' : 'Datos pedidos ahora a OpenF1' },
  });
}
