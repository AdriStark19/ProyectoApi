/**
 * Cliente HTTP genérico: fetch + async/await con timeout, reintento ante
 * rate limit y traducción de errores a mensajes que entiende el usuario.
 */

const TIMEOUT_MS = 12_000;
const RATE_LIMIT_RETRY_MS = 1_200;
const MAX_ATTEMPTS = 2;

/** Error con un mensaje listo para mostrarse en pantalla. */
export class ApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function describeStatus(status: number): string {
  if (status === 429) return 'OpenF1 está limitando las peticiones. Espera unos segundos y reintenta.';
  // La versión gratuita no da acceso a sesiones que se están disputando en directo
  if (status === 401 || status === 403) return 'Estos datos solo están disponibles en directo con suscripción. Prueba con una sesión ya terminada.';
  if (status >= 500) return `La API de OpenF1 tiene problemas ahora mismo (error ${status}).`;
  return `La API respondió con un error inesperado (${status}).`;
}

/** Lanza la petición cortándola si supera TIMEOUT_MS. */
async function requestWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('OpenF1 está tardando demasiado en responder. Reintenta en un momento.');
    }
    throw new ApiError('No se pudo conectar con OpenF1. Comprueba tu conexión a internet.');
  } finally {
    clearTimeout(timer);
  }
}

/** Convierte el cuerpo en array. Cualquier otra forma ("{detail: ...}") se trata como vacío. */
async function parseArrayBody<T>(response: Response): Promise<T[]> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('La respuesta de OpenF1 no es un JSON válido.', response.status);
  }
  return Array.isArray(body) ? (body as T[]) : [];
}

/**
 * Pide un endpoint de OpenF1 y devuelve siempre un array.
 * - 404 significa "sin resultados" para ese filtro: devolvemos [] en vez de fallar.
 * - 429 (rate limit) se reintenta una vez tras una pequeña espera.
 */
export async function fetchJsonArray<T>(url: string): Promise<T[]> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await requestWithTimeout(url);

    if (response.status === 404) return [];
    if (response.status === 429 && attempt < MAX_ATTEMPTS) {
      await wait(RATE_LIMIT_RETRY_MS * attempt);
      continue;
    }
    if (!response.ok) throw new ApiError(describeStatus(response.status), response.status);

    return parseArrayBody<T>(response);
  }
  // Solo se llega aquí si todos los intentos acabaron en 429
  throw new ApiError(describeStatus(429), 429);
}

/** Mensaje seguro para cualquier error capturado en la UI. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Algo ha fallado al procesar los datos. Reintenta o elige otra sesión.';
}
