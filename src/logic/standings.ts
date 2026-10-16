/**
 * Une resultados, pilotos y vueltas en filas listas para pintar.
 * El render no tiene que saber nada de la forma de la API.
 */

import type { Driver, GapValue, Lap, SessionResult } from '../types/openf1.ts';
import { buildLapStats, findFastestDriver, type DriverLapStats } from './laps.ts';
import { formatDuration, formatGap, formatLapTime, toTeamColour, PLACEHOLDER } from './format.ts';

export type FinishStatus = 'FIN' | 'DNF' | 'DNS' | 'DSQ';

export interface StandingRow {
  position: number | null;
  positionLabel: string;
  driverNumber: number;
  acronym: string;
  fullName: string;
  team: string;
  teamColour: string;
  headshotUrl: string | null;
  status: FinishStatus;
  time: string;
  gap: string;
  laps: string;
  bestLap: string;
  averagePace: string;
  hasFastestLap: boolean;
}

/** En clasificación duration/gap son arrays [Q1, Q2, Q3]: nos quedamos con la última fase disputada. */
export function lastDefined<T>(value: T | Array<T | null> | null | undefined): T | null {
  if (!Array.isArray(value)) return value ?? null;
  return value.filter((item): item is T => item !== null && item !== undefined).at(-1) ?? null;
}

const statusOf = (result: SessionResult): FinishStatus =>
  result.dsq ? 'DSQ' : result.dns ? 'DNS' : result.dnf ? 'DNF' : 'FIN';

/** Ordena por posición; los que no tienen posición (DNS, DSQ…) van al final. */
function byPosition(a: SessionResult, b: SessionResult): number {
  const posA = a.position ?? Number.MAX_SAFE_INTEGER;
  const posB = b.position ?? Number.MAX_SAFE_INTEGER;
  return posA - posB;
}

/**
 * Si la sesión aún no tiene resultado oficial, construimos una clasificación
 * provisional ordenando a los pilotos por su mejor vuelta.
 */
function resultsFromLaps(stats: Map<number, DriverLapStats>): SessionResult[] {
  const ranked = [...stats.values()]
    .filter((driver) => driver.bestLap !== null)
    .sort((a, b) => (a.bestLap ?? 0) - (b.bestLap ?? 0));
  const leaderTime = ranked[0]?.bestLap ?? 0;

  return ranked.map((driver, index) => ({
    driver_number: driver.driverNumber,
    position: index + 1,
    duration: driver.bestLap,
    gap_to_leader: (driver.bestLap ?? leaderTime) - leaderTime,
    number_of_laps: driver.totalLaps,
  }));
}

function toRow(result: SessionResult, driver: Driver | undefined, stats: DriverLapStats | undefined, fastestDriver: number | null): StandingRow {
  const status = statusOf(result);
  const position = typeof result.position === 'number' ? result.position : null;
  const laps = result.number_of_laps ?? stats?.totalLaps ?? null;

  return {
    position,
    positionLabel: position !== null && status !== 'DSQ' ? String(position) : status,
    driverNumber: result.driver_number,
    acronym: driver?.name_acronym ?? `#${result.driver_number}`,
    fullName: driver?.full_name ?? driver?.broadcast_name ?? `Piloto ${result.driver_number}`,
    team: driver?.team_name ?? 'Equipo desconocido',
    teamColour: toTeamColour(driver?.team_colour),
    headshotUrl: driver?.headshot_url ?? null,
    status,
    time: status === 'FIN' ? formatDuration(lastDefined<number>(result.duration)) : status,
    gap: status === 'FIN' ? formatGap(lastDefined<GapValue>(result.gap_to_leader), position) : PLACEHOLDER,
    laps: laps !== null ? String(laps) : PLACEHOLDER,
    bestLap: formatLapTime(stats?.bestLap),
    averagePace: formatLapTime(stats?.averagePace),
    hasFastestLap: fastestDriver !== null && fastestDriver === result.driver_number,
  };
}

export interface Standings {
  rows: StandingRow[];
  /** true si no había resultado oficial y la tabla se ha calculado a partir de las vueltas. */
  isProvisional: boolean;
}

export function buildStandings(results: SessionResult[], drivers: Driver[], laps: Lap[]): Standings {
  const driversByNumber = new Map(drivers.filter((driver) => Number.isFinite(driver?.driver_number)).map((driver) => [driver.driver_number, driver]));
  const lapStats = buildLapStats(laps);
  const fastestDriver = findFastestDriver(lapStats);

  const officialResults = results.filter((result) => Number.isFinite(result?.driver_number));
  const isProvisional = officialResults.length === 0;
  const source = isProvisional ? resultsFromLaps(lapStats) : officialResults;

  const rows = [...source]
    .sort(byPosition)
    .map((result) => toRow(result, driversByNumber.get(result.driver_number), lapStats.get(result.driver_number), fastestDriver));

  return { rows, isProvisional };
}
