/**
 * Formateo de tiempos, gaps y fechas al estilo de las pantallas de timing de F1.
 * Todas las funciones aceptan valores "raros" (null, NaN, negativos) y
 * devuelven un guion en lugar de lanzar o pintar "NaN".
 */

import type { GapValue } from '../types/openf1.ts';

export const PLACEHOLDER = '—';

const isValidSeconds = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

/** 91.743 → "1:31.743" */
export function formatLapTime(seconds: number | null | undefined): string {
  if (!isValidSeconds(seconds)) return PLACEHOLDER;
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds % 60).toFixed(3).padStart(6, '0');
  return minutes > 0 ? `${minutes}:${rest}` : rest;
}

/** 5565.123 → "1:32:45.123". Para tiempos menores de una hora usa formato de vuelta. */
export function formatDuration(seconds: number | null | undefined): string {
  if (!isValidSeconds(seconds)) return PLACEHOLDER;
  if (seconds < 3600) return formatLapTime(seconds);
  const hours = Math.floor(seconds / 3600);
  return `${hours}:${formatLapTime(seconds - hours * 3600).padStart(9, '0')}`;
}

/** 1.2 → "+1.200"; "+1 LAP" se deja tal cual; el líder muestra "Líder". */
export function formatGap(gap: GapValue, position: number | null): string {
  if (position === 1) return 'Líder';
  if (typeof gap === 'string' && gap.trim() !== '') return gap;
  if (typeof gap === 'number' && Number.isFinite(gap)) return gap === 0 ? 'Líder' : `+${gap.toFixed(3)}`;
  return PLACEHOLDER;
}

const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });
const dateTimeFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const toDate = (iso: string | null | undefined): Date | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** "2026-10-09" + "2026-10-11" → "9 oct – 11 oct" */
export function formatDateRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
  const start = toDate(startIso);
  const end = toDate(endIso);
  if (!start) return PLACEHOLDER;
  if (!end || start.toDateString() === end.toDateString()) return dayFormatter.format(start);
  return `${dayFormatter.format(start)} – ${dayFormatter.format(end)}`;
}

/** Fecha y hora en la zona horaria del usuario: "sáb, 11 oct, 14:00" */
export function formatSessionTime(iso: string | null | undefined): string {
  const date = toDate(iso);
  return date ? dateTimeFormatter.format(date) : PLACEHOLDER;
}

/** Normaliza un color de equipo de la API ("3671C6") a CSS ("#3671C6"). */
export function toTeamColour(raw: string | null | undefined, fallback = '#6b6b78'): string {
  const hex = (raw ?? '').replace('#', '').trim();
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex}` : fallback;
}
