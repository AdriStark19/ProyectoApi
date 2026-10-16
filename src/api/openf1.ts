/**
 * Endpoints de OpenF1 usados por la app. Esta capa solo sabe "cómo pedir":
 * construye URLs, aplica la caché y adapta la forma de los datos.
 * No sabe nada del DOM ni de cómo se ordenan o pintan los datos.
 */

import { fetchJsonArray } from './http.ts';
import { withCache } from './cache.ts';
import type { Driver, Lap, Loaded, Meeting, Session, SessionResult } from '../types/openf1.ts';

const BASE_URL = 'https://api.openf1.org/v1';

const HOUR_MS = 60 * 60 * 1000;
// El calendario se actualiza a diario en OpenF1; los datos de sesiones pasadas no cambian
const CALENDAR_TTL_MS = 12 * HOUR_MS;
const SESSION_DATA_TTL_MS = 7 * 24 * HOUR_MS;

type QueryParams = Record<string, string | number>;

export function buildUrl(endpoint: string, params: QueryParams): string {
  const query = new URLSearchParams(Object.entries(params).map(([name, value]) => [name, String(value)]));
  return `${BASE_URL}/${endpoint}?${query.toString()}`;
}

/**
 * Una vuelta de OpenF1 trae ~15 campos (sectores, minisectores, velocidades...).
 * Nos quedamos con 4 para que la caché de una carrera ocupe decenas de KB y no MB.
 */
function toSlimLap(lap: Lap): Lap {
  return {
    driver_number: lap.driver_number,
    lap_number: lap.lap_number,
    lap_duration: lap.lap_duration ?? null,
    is_pit_out_lap: lap.is_pit_out_lap ?? null,
  };
}

export const getMeetings = (year: number): Promise<Loaded<Meeting[]>> =>
  withCache(`meetings:${year}`, CALENDAR_TTL_MS, () => fetchJsonArray<Meeting>(buildUrl('meetings', { year })));

export const getSessions = (meetingKey: number): Promise<Loaded<Session[]>> =>
  withCache(`sessions:${meetingKey}`, CALENDAR_TTL_MS, () =>
    fetchJsonArray<Session>(buildUrl('sessions', { meeting_key: meetingKey })),
  );

export const getDrivers = (sessionKey: number): Promise<Loaded<Driver[]>> =>
  withCache(`drivers:${sessionKey}`, SESSION_DATA_TTL_MS, () =>
    fetchJsonArray<Driver>(buildUrl('drivers', { session_key: sessionKey })),
  );

export const getLaps = (sessionKey: number): Promise<Loaded<Lap[]>> =>
  withCache(`laps:${sessionKey}`, SESSION_DATA_TTL_MS, async () => {
    const laps = await fetchJsonArray<Lap>(buildUrl('laps', { session_key: sessionKey }));
    return laps.map(toSlimLap);
  });

export const getSessionResults = (sessionKey: number): Promise<Loaded<SessionResult[]>> =>
  withCache(`results:${sessionKey}`, SESSION_DATA_TTL_MS, () =>
    fetchJsonArray<SessionResult>(buildUrl('session_result', { session_key: sessionKey })),
  );

export interface SessionBundle {
  drivers: Driver[];
  laps: Lap[];
  results: SessionResult[];
  /** true solo si las tres partes salieron de la caché. */
  fromCache: boolean;
}

/** Pide en paralelo todo lo que necesita la tabla de una sesión. */
export async function getSessionBundle(sessionKey: number): Promise<SessionBundle> {
  const [drivers, laps, results] = await Promise.all([
    getDrivers(sessionKey),
    getLaps(sessionKey),
    getSessionResults(sessionKey),
  ]);
  return {
    drivers: drivers.data,
    laps: laps.data,
    results: results.data,
    fromCache: [drivers, laps, results].every((part) => part.fromCache),
  };
}
