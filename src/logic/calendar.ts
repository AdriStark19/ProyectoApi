/**
 * Transformaciones del calendario: limpiar, ordenar, buscar y resumir
 * Grandes Premios y sesiones. Funciones puras, fáciles de testear.
 */

import type { Meeting, Session } from '../types/openf1.ts';

const byStartDate = <T extends { date_start: string }>(a: T, b: T): number =>
  Date.parse(a.date_start) - Date.parse(b.date_start);

/** Un registro es usable si tiene identificador, nombre y una fecha parseable. */
const isUsableMeeting = (meeting: Meeting): boolean =>
  Number.isFinite(meeting?.meeting_key) &&
  typeof meeting.meeting_name === 'string' &&
  !Number.isNaN(Date.parse(meeting.date_start));

export const isTesting = (meeting: Meeting): boolean => /test/i.test(meeting.meeting_name);

/** Quita registros incompletos y cancelados, y ordena por fecha. */
export function prepareMeetings(meetings: Meeting[]): Meeting[] {
  return meetings.filter(isUsableMeeting).filter((meeting) => !meeting.is_cancelled).sort(byStartDate);
}

/** Fecha de fin fiable: si falta date_end usamos el inicio + 3 días (un fin de semana). */
const endTime = (item: { date_start: string; date_end?: string | null }): number => {
  const end = Date.parse(item.date_end ?? '');
  return Number.isNaN(end) ? Date.parse(item.date_start) + 3 * 24 * 3600 * 1000 : end;
};

export const hasFinished = (item: { date_start: string; date_end?: string | null }, now = Date.now()): boolean =>
  endTime(item) < now;

export const hasStarted = (item: { date_start: string }, now = Date.now()): boolean =>
  Date.parse(item.date_start) <= now;

/** Minúsculas y sin tildes, para que "mexico" encuentre "México". */
const normalize = (text: string | null | undefined): string =>
  (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function filterMeetings(meetings: Meeting[], query: string): Meeting[] {
  const needle = normalize(query);
  if (needle === '') return meetings;
  return meetings.filter((meeting) =>
    [meeting.meeting_name, meeting.country_name, meeting.circuit_short_name, meeting.location]
      .map(normalize)
      .some((field) => field.includes(needle)),
  );
}

export interface SeasonSummary {
  grandsPrix: number;
  completed: number;
  upcoming: number;
  nextMeeting: Meeting | null;
}

/** Resume la temporada en una sola pasada con reduce (los tests no cuentan como GP). */
export function summarizeSeason(meetings: Meeting[], now = Date.now()): SeasonSummary {
  return meetings
    .filter((meeting) => !isTesting(meeting))
    .reduce<SeasonSummary>(
      (summary, meeting) => {
        const finished = hasFinished(meeting, now);
        return {
          grandsPrix: summary.grandsPrix + 1,
          completed: summary.completed + (finished ? 1 : 0),
          upcoming: summary.upcoming + (finished ? 0 : 1),
          nextMeeting: summary.nextMeeting ?? (finished ? null : meeting),
        };
      },
      { grandsPrix: 0, completed: 0, upcoming: 0, nextMeeting: null },
    );
}

/** Número de ronda de cada GP (los tests de pretemporada no consumen ronda). */
export function roundNumbers(meetings: Meeting[]): Map<number, number> {
  return meetings
    .filter((meeting) => !isTesting(meeting))
    .reduce((rounds, meeting, index) => rounds.set(meeting.meeting_key, index + 1), new Map<number, number>());
}

export function prepareSessions(sessions: Session[]): Session[] {
  return sessions
    .filter((session) => Number.isFinite(session?.session_key) && !Number.isNaN(Date.parse(session.date_start)))
    .filter((session) => !session.is_cancelled)
    .sort(byStartDate);
}

/**
 * Sesión que abrimos por defecto: la última ya terminada (normalmente la carrera).
 * Si ninguna ha terminado aún, la primera del fin de semana.
 */
export function pickDefaultSession(sessions: Session[], now = Date.now()): Session | null {
  const finished = sessions.filter((session) => hasFinished(session, now));
  return finished.at(-1) ?? sessions[0] ?? null;
}
