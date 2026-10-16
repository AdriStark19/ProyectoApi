/**
 * Tipos de las respuestas de OpenF1 que usa la app.
 * Solo se declaran los campos que necesitamos. Casi todo se marca como
 * opcional o nullable porque la API devuelve huecos con frecuencia
 * (pilotos sin color de equipo, vueltas sin tiempo, sesiones sin resultado...).
 * Documentación: https://openf1.org/docs
 */

export interface Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name?: string | null;
  country_name?: string | null;
  country_flag?: string | null;
  circuit_short_name?: string | null;
  circuit_image?: string | null;
  circuit_type?: string | null;
  location?: string | null;
  date_start: string;
  date_end?: string | null;
  year: number;
  is_cancelled?: boolean | null;
}

export interface Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  /** "Practice", "Qualifying" o "Race" (las sprints también son "Race"). */
  session_type: string;
  date_start: string;
  date_end?: string | null;
  is_cancelled?: boolean | null;
}

export interface Driver {
  driver_number: number;
  full_name?: string | null;
  name_acronym?: string | null;
  broadcast_name?: string | null;
  team_name?: string | null;
  /** Hexadecimal sin "#", p. ej. "3671C6". Puede faltar. */
  team_colour?: string | null;
  headshot_url?: string | null;
}

/** Versión reducida de una vuelta: es lo único que guardamos en caché. */
export interface Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean | null;
}

/** Un gap puede ser segundos, un texto tipo "+1 LAP" o null para el líder. */
export type GapValue = number | string | null;

export interface SessionResult {
  driver_number: number;
  position: number | null;
  /**
   * Carrera: tiempo total. Libres: mejor vuelta.
   * Clasificación: array [Q1, Q2, Q3].
   */
  duration: number | Array<number | null> | null;
  gap_to_leader: GapValue | GapValue[];
  number_of_laps: number | null;
  dnf?: boolean | null;
  dns?: boolean | null;
  dsq?: boolean | null;
}

/** Resultado de una petición junto a si vino de localStorage o de la red. */
export interface Loaded<T> {
  data: T;
  fromCache: boolean;
}
