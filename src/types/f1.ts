export interface OpenF1Driver {
  driver_number: number
  full_name: string
  name_acronym: string
  team_name: string
  team_color: string
  headshot_url: string | null
}

export interface OpenF1Lap {
  driver_number: number
  lap_duration: number | null
  lap_number: number
}

export interface SessionInfo {
  sessionKey: number
  sessionName: string // ej. "Race", "Qualifying", "Practice 1"
  sessionType: string // ej. "Race", "Qualifying", "Practice"
  dateStart: string
  year: number
}

export interface DriverStats {
  driverNumber: number
  fullName: string
  acronym: string
  teamName: string
  teamColor: string
  headshotUrl: string | null
  totalLaps: number
  bestLapTime: number | null
  averageLapTime: number | null
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  data: DriverStats[];
}