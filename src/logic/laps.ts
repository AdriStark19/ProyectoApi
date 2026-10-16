/**
 * Estadísticas de vueltas por piloto: mejor vuelta y ritmo medio.
 */

import type { Lap } from '../types/openf1.ts';

/**
 * Para el ritmo medio ignoramos vueltas más lentas que el 107 % de la mejor
 * del piloto (la misma regla que la FIA usa en clasificación). Así no cuentan
 * las vueltas tras Safety Car, de entrada a boxes o con tráfico extremo,
 * que distorsionarían la media.
 */
export const PACE_THRESHOLD = 1.07;

type TimedLap = Lap & { lap_duration: number };

export interface DriverLapStats {
  driverNumber: number;
  totalLaps: number;
  timedLaps: number;
  bestLap: number | null;
  bestLapNumber: number | null;
  averagePace: number | null;
}

/** Vuelta con tiempo válido que no es salida de boxes. */
export const isTimedLap = (lap: Lap): lap is TimedLap =>
  typeof lap.lap_duration === 'number' && Number.isFinite(lap.lap_duration) && lap.lap_duration > 0 && !lap.is_pit_out_lap;

function summarizeDriverLaps(driverNumber: number, laps: Lap[]): DriverLapStats {
  const timed = laps.filter(isTimedLap);
  const best = timed.reduce<TimedLap | null>((fastest, lap) => (!fastest || lap.lap_duration < fastest.lap_duration ? lap : fastest), null);

  const paceLaps = best ? timed.filter((lap) => lap.lap_duration <= best.lap_duration * PACE_THRESHOLD) : [];
  const paceTotal = paceLaps.reduce((sum, lap) => sum + lap.lap_duration, 0);

  return {
    driverNumber,
    totalLaps: laps.length,
    timedLaps: timed.length,
    bestLap: best?.lap_duration ?? null,
    bestLapNumber: best?.lap_number ?? null,
    averagePace: paceLaps.length > 0 ? paceTotal / paceLaps.length : null,
  };
}

/** Agrupa las vueltas por dorsal (reduce) y calcula las estadísticas de cada piloto (map). */
export function buildLapStats(laps: Lap[]): Map<number, DriverLapStats> {
  const lapsByDriver = laps
    .filter((lap) => Number.isFinite(lap?.driver_number))
    .reduce((groups, lap) => {
      const driverLaps = groups.get(lap.driver_number) ?? [];
      driverLaps.push(lap);
      return groups.set(lap.driver_number, driverLaps);
    }, new Map<number, Lap[]>());

  return new Map([...lapsByDriver].map(([driverNumber, driverLaps]) => [driverNumber, summarizeDriverLaps(driverNumber, driverLaps)]));
}

/** Dorsal del piloto con la vuelta rápida de la sesión, o null si nadie marcó tiempo. */
export function findFastestDriver(stats: Map<number, DriverLapStats>): number | null {
  const fastest = [...stats.values()]
    .filter((driver) => driver.bestLap !== null)
    .reduce<DriverLapStats | null>((best, driver) => (!best || (driver.bestLap ?? Infinity) < (best.bestLap ?? Infinity) ? driver : best), null);
  return fastest?.driverNumber ?? null;
}
