/**
 * Render del detalle de un Gran Premio (columna derecha):
 * cabecera del circuito, pestañas de sesiones, podio y tabla de tiempos.
 */

import type { Meeting, Session } from '../types/openf1.ts';
import type { StandingRow, Standings } from '../logic/standings.ts';
import { hasFinished } from '../logic/calendar.ts';
import { formatDateRange, formatSessionTime } from '../logic/format.ts';
import { h, safeImage } from './dom.ts';
import { emptyView, sourceBadge } from './states.ts';

export function meetingHeaderView(meeting: Meeting): HTMLElement {
  return h('header', { className: 'gp' }, [
    h('div', { className: 'gp__text' }, [
      h('p', { className: 'gp__eyebrow', text: `${meeting.country_name ?? ''} · ${meeting.location ?? ''}` }),
      h('h2', { className: 'gp__title', text: meeting.meeting_name }),
      h('p', { className: 'gp__meta', text: `${meeting.circuit_short_name ?? ''} · ${meeting.circuit_type ?? 'Circuito'} · ${formatDateRange(meeting.date_start, meeting.date_end)}` }),
    ]),
    safeImage(meeting.circuit_image, `Trazado de ${meeting.circuit_short_name ?? 'circuito'}`, 'gp__circuit'),
  ]);
}

export function sessionTabsView(sessions: Session[], selectedKey: number | null, onSelect: (session: Session) => void, now = Date.now()): HTMLElement {
  if (sessions.length === 0) return emptyView('Este Gran Premio todavía no tiene sesiones publicadas');

  const tabs = sessions.map((session) => {
    const isSelected = session.session_key === selectedKey;
    return h('button', {
      className: `tab${isSelected ? ' tab--selected' : ''}${hasFinished(session, now) ? '' : ' tab--future'}`,
      attrs: { type: 'button', role: 'tab', 'aria-selected': String(isSelected) },
      on: { click: () => onSelect(session) },
    }, [
      h('span', { className: 'tab__name', text: session.session_name }),
      h('span', { className: 'tab__time', text: formatSessionTime(session.date_start) }),
    ]);
  });
  return h('nav', { className: 'tabs', attrs: { role: 'tablist', 'aria-label': 'Sesiones del fin de semana' } }, tabs);
}

function podiumView(rows: StandingRow[]): HTMLElement | null {
  const podium = rows.filter((row) => row.position !== null && row.position <= 3 && row.status === 'FIN');
  if (podium.length < 3) return null;

  return h('div', { className: 'podium' }, podium.map((row) =>
    h('article', { className: `podium__step podium__step--p${row.position}`, attrs: { style: `--team: ${row.teamColour}` } }, [
      safeImage(row.headshotUrl, row.fullName, 'podium__photo'),
      h('span', { className: 'podium__pos', text: `P${row.position}` }),
      h('span', { className: 'podium__name', text: row.fullName }),
      h('span', { className: 'podium__team', text: row.team }),
    ]),
  ));
}

const HEADERS = ['Pos', 'Piloto', 'Tiempo', 'Gap', 'Vueltas', 'Mejor vuelta', 'Ritmo medio'];

function standingRowView(row: StandingRow): HTMLElement {
  const cell = (text: string, className = '') => h('td', { className, text });
  return h('tr', { className: `row row--${row.status.toLowerCase()}`, attrs: { style: `--team: ${row.teamColour}` } }, [
    cell(row.positionLabel, 'row__pos'),
    h('td', { className: 'row__driver' }, [
      h('span', { className: 'row__acronym', text: row.acronym }),
      h('span', { className: 'row__fullname', text: `${row.fullName} · ${row.team}` }),
    ]),
    cell(row.time, 'num'),
    cell(row.gap, 'num'),
    cell(row.laps, 'num'),
    h('td', { className: `num${row.hasFastestLap ? ' num--fastest' : ''}`, text: row.bestLap, attrs: row.hasFastestLap ? { title: 'Vuelta rápida de la sesión' } : {} }),
    cell(row.averagePace, 'num num--muted'),
  ]);
}

export function standingsView(session: Session, standings: Standings, fromCache: boolean): HTMLElement[] {
  if (standings.rows.length === 0) {
    return [emptyView('OpenF1 aún no tiene tiempos para esta sesión', 'Suele publicarlos pocos minutos después de que termine.')];
  }

  const note = standings.isProvisional
    ? h('p', { className: 'note', text: 'Sin resultado oficial todavía: clasificación provisional ordenada por mejor vuelta.' })
    : null;

  const table = h('table', { className: 'timing' }, [
    h('thead', {}, [h('tr', {}, HEADERS.map((title) => h('th', { text: title, attrs: { scope: 'col' } })))]),
    h('tbody', {}, standings.rows.map(standingRowView)),
  ]);

  return [
    h('div', { className: 'results-head' }, [h('h3', { className: 'results-head__title', text: session.session_name }), sourceBadge(fromCache)]),
    note,
    podiumView(standings.rows),
    h('div', { className: 'timing-wrap' }, [table]),
    h('p', { className: 'legend', text: 'Morado = vuelta rápida de la sesión. El ritmo medio excluye vueltas por encima del 107 % de la mejor de cada piloto.' }),
  ].filter((node): node is HTMLElement => node !== null);
}

export function futureSessionView(session: Session): HTMLElement {
  return emptyView(`${session.session_name} aún no se ha disputado`, `Empieza el ${formatSessionTime(session.date_start)} (hora local).`);
}
