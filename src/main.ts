/**
 * Punto de entrada: conecta los controles del index.html con la API,
 * la lógica y el render. Aquí vive el estado de la app.
 */

import './styles/main.css';
import type { Meeting, Session } from './types/openf1.ts';
import { getMeetings, getSessionBundle, getSessions } from './api/openf1.ts';
import { clearCache, countCacheEntries } from './api/cache.ts';
import { toUserMessage } from './api/http.ts';
import { filterMeetings, hasStarted, pickDefaultSession, prepareMeetings, prepareSessions, roundNumbers, summarizeSeason } from './logic/calendar.ts';
import { buildStandings } from './logic/standings.ts';
import { h, mount, requireElement } from './ui/dom.ts';
import { emptyView, errorView, loadingView } from './ui/states.ts';
import { calendarView } from './ui/calendarView.ts';
import { futureSessionView, meetingHeaderView, sessionTabsView, standingsView } from './ui/sessionView.ts';

const FIRST_SEASON = 2023; // OpenF1 tiene datos históricos desde 2023
const CURRENT_SEASON = new Date().getFullYear();

const elements = {
  yearSelect: requireElement<HTMLSelectElement>('#year-select'),
  search: requireElement<HTMLInputElement>('#meeting-search'),
  cacheButton: requireElement<HTMLButtonElement>('#cache-button'),
  calendar: requireElement<HTMLElement>('#calendar-panel'),
  detail: requireElement<HTMLElement>('#detail-panel'),
};

const state = {
  year: CURRENT_SEASON,
  meetings: [] as Meeting[],
  meetingsFromCache: false,
  selectedMeeting: null as Meeting | null,
  sessions: [] as Session[],
  selectedSession: null as Session | null,
};

/*
 * Si el usuario hace clic rápido en varios GP, las respuestas pueden llegar
 * desordenadas. Cada carga se apunta un número y, al volver, solo pinta si
 * sigue siendo la petición más reciente de su panel.
 */
const latestRequest = { calendar: 0, meeting: 0, session: 0 };

const standingsSlot = h('div', { className: 'results', attrs: { 'aria-live': 'polite' } });

function renderCalendar(): void {
  const visible = filterMeetings(state.meetings, elements.search.value);
  mount(elements.calendar, ...calendarView({
    year: state.year,
    meetings: visible,
    summary: summarizeSeason(state.meetings),
    rounds: roundNumbers(state.meetings),
    selectedKey: state.selectedMeeting?.meeting_key ?? null,
    fromCache: state.meetingsFromCache,
    onSelect: (meeting) => void selectMeeting(meeting),
  }));
}

function renderDetail(): void {
  if (!state.selectedMeeting) return;
  mount(
    elements.detail,
    meetingHeaderView(state.selectedMeeting),
    sessionTabsView(state.sessions, state.selectedSession?.session_key ?? null, (session) => void selectSession(session)),
    standingsSlot,
  );
}

async function loadSeason(year: number): Promise<void> {
  const requestId = ++latestRequest.calendar;
  Object.assign(state, { year, meetings: [], selectedMeeting: null, sessions: [], selectedSession: null });
  mount(elements.calendar, loadingView(`Cargando el calendario ${year}…`));
  mount(elements.detail, emptyView('Elige un Gran Premio', 'Verás sus sesiones, el podio y la tabla de tiempos.'));

  try {
    const { data, fromCache } = await getMeetings(year);
    if (requestId !== latestRequest.calendar) return;
    state.meetings = prepareMeetings(data);
    state.meetingsFromCache = fromCache;

    if (state.meetings.length === 0) {
      mount(elements.calendar, emptyView(`OpenF1 no tiene eventos para ${year}`, 'Prueba con otra temporada.'));
      return;
    }
    renderCalendar();
  } catch (error) {
    if (requestId !== latestRequest.calendar) return;
    console.error('[calendario]', error);
    mount(elements.calendar, errorView(toUserMessage(error), () => void loadSeason(year)));
  } finally {
    updateCacheButton();
  }
}

async function selectMeeting(meeting: Meeting): Promise<void> {
  const requestId = ++latestRequest.meeting;
  latestRequest.session++; // invalida cualquier tabla que estuviera cargando
  Object.assign(state, { selectedMeeting: meeting, sessions: [], selectedSession: null });
  renderCalendar();
  mount(elements.detail, meetingHeaderView(meeting), loadingView('Consultando las sesiones del fin de semana…'));

  try {
    const { data } = await getSessions(meeting.meeting_key);
    if (requestId !== latestRequest.meeting) return;
    state.sessions = prepareSessions(data);
    renderDetail();

    const defaultSession = pickDefaultSession(state.sessions);
    if (defaultSession) await selectSession(defaultSession);
  } catch (error) {
    if (requestId !== latestRequest.meeting) return;
    console.error('[sesiones]', error);
    mount(elements.detail, meetingHeaderView(meeting), errorView(toUserMessage(error), () => void selectMeeting(meeting)));
  } finally {
    updateCacheButton();
  }
}

async function selectSession(session: Session): Promise<void> {
  const requestId = ++latestRequest.session;
  state.selectedSession = session;
  renderDetail();

  // Sesión futura: no gastamos peticiones en algo que todavía no tiene datos
  if (!hasStarted(session)) {
    mount(standingsSlot, futureSessionView(session));
    return;
  }

  mount(standingsSlot, loadingView(`Descargando tiempos de ${session.session_name}…`));
  try {
    const bundle = await getSessionBundle(session.session_key);
    if (requestId !== latestRequest.session) return;
    const standings = buildStandings(bundle.results, bundle.drivers, bundle.laps);
    mount(standingsSlot, ...standingsView(session, standings, bundle.fromCache));
  } catch (error) {
    if (requestId !== latestRequest.session) return;
    console.error('[tiempos]', error);
    mount(standingsSlot, errorView(toUserMessage(error), () => void selectSession(session)));
  } finally {
    updateCacheButton();
  }
}

function updateCacheButton(): void {
  const entries = countCacheEntries();
  elements.cacheButton.textContent = entries > 0 ? `Vaciar caché (${entries})` : 'Caché vacía';
  elements.cacheButton.disabled = entries === 0;
}

function setupControls(): void {
  const seasons = Array.from({ length: CURRENT_SEASON - FIRST_SEASON + 1 }, (_, index) => CURRENT_SEASON - index);
  elements.yearSelect.replaceChildren(...seasons.map((year) => h('option', { text: String(year), attrs: { value: String(year) } })));
  elements.yearSelect.value = String(CURRENT_SEASON);

  elements.yearSelect.addEventListener('change', () => void loadSeason(Number(elements.yearSelect.value)));
  elements.search.addEventListener('input', () => {
    if (state.meetings.length > 0) renderCalendar();
  });
  elements.cacheButton.addEventListener('click', () => {
    clearCache();
    updateCacheButton();
  });
}

setupControls();
void loadSeason(CURRENT_SEASON);
