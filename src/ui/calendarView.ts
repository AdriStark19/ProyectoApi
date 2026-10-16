/**
 * Render del calendario de la temporada (columna izquierda).
 */

import type { Meeting } from '../types/openf1.ts';
import type { SeasonSummary } from '../logic/calendar.ts';
import { hasFinished, hasStarted, isTesting } from '../logic/calendar.ts';
import { formatDateRange } from '../logic/format.ts';
import { h, safeImage } from './dom.ts';
import { emptyView, sourceBadge } from './states.ts';

export interface CalendarProps {
  year: number;
  meetings: Meeting[];
  summary: SeasonSummary;
  rounds: Map<number, number>;
  selectedKey: number | null;
  fromCache: boolean;
  onSelect: (meeting: Meeting) => void;
}

function summaryView({ year, summary, fromCache }: CalendarProps): HTMLElement {
  const stat = (value: number, label: string) =>
    h('div', { className: 'stat' }, [h('span', { className: 'stat__value', text: String(value) }), h('span', { className: 'stat__label', text: label })]);

  return h('div', { className: 'season' }, [
    h('div', { className: 'season__head' }, [h('h2', { className: 'season__title', text: `Temporada ${year}` }), sourceBadge(fromCache)]),
    h('div', { className: 'season__stats' }, [
      stat(summary.grandsPrix, 'Grandes Premios'),
      stat(summary.completed, 'Disputados'),
      stat(summary.upcoming, 'Por disputar'),
    ]),
  ]);
}

function statusTag(meeting: Meeting, now: number): HTMLElement | null {
  if (isTesting(meeting)) return h('span', { className: 'tag tag--test', text: 'Test' });
  if (hasFinished(meeting, now)) return null;
  if (hasStarted(meeting, now)) return h('span', { className: 'tag tag--live', text: 'En curso' });
  return h('span', { className: 'tag tag--next', text: 'Próximo' });
}

function meetingItem(meeting: Meeting, props: CalendarProps, now: number): HTMLElement {
  const round = props.rounds.get(meeting.meeting_key);
  const isSelected = meeting.meeting_key === props.selectedKey;

  const button = h('button', {
    className: `meeting${isSelected ? ' meeting--selected' : ''}${hasFinished(meeting, now) ? '' : ' meeting--future'}`,
    attrs: { type: 'button', 'aria-pressed': String(isSelected) },
    on: { click: () => props.onSelect(meeting) },
  }, [
    h('span', { className: 'meeting__round', text: round ? `R${String(round).padStart(2, '0')}` : '—' }),
    safeImage(meeting.country_flag, '', 'meeting__flag'),
    h('span', { className: 'meeting__body' }, [
      h('span', { className: 'meeting__name', text: meeting.meeting_name }),
      h('span', { className: 'meeting__meta', text: `${meeting.circuit_short_name ?? meeting.location ?? ''} · ${formatDateRange(meeting.date_start, meeting.date_end)}` }),
    ]),
    statusTag(meeting, now),
  ]);
  return h('li', {}, [button]);
}

export function calendarView(props: CalendarProps, now = Date.now()): HTMLElement[] {
  const list = props.meetings.length > 0
    ? h('ul', { className: 'meeting-list' }, props.meetings.map((meeting) => meetingItem(meeting, props, now)))
    : emptyView('Ningún Gran Premio coincide con la búsqueda', 'Prueba con el país, la ciudad o el nombre del circuito.');
  return [summaryView(props), list];
}
