import { API_URL } from './config';

const RUTAS_RESERVADAS = new Set(['coordinacion', 'coordinacion.html', 'caminantes', 'caminantes.html', 'servidores', 'servidores.html', 'mapa', 'mapa.html', 'admin', 'admin.html', 'index.html']);
const primerSegmento = window.location.pathname.split('/').filter(Boolean)[0]?.toLowerCase() || '';
export const PARROQUIA_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(primerSegmento) && !RUTAS_RESERVADAS.has(primerSegmento)
  ? primerSegmento
  : 'cristorey';

export function rutaParroquia(ruta = '') {
  return `/${PARROQUIA_SLUG}${ruta ? `/${ruta.replace(/^\/+/, '')}` : ''}`;
}

export const EDICION_SLUG = new URLSearchParams(window.location.search).get('edicion') || '';

const clavesIdempotencia = new Map();
const formatoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const nombreClaveIdempotencia = (tipo) => `bartimeo_idempotencia_${PARROQUIA_SLUG}_${EDICION_SLUG || 'vii'}_${tipo}`;

export function obtenerClaveIdempotencia(tipo) {
  if (clavesIdempotencia.has(tipo)) return clavesIdempotencia.get(tipo);
  const storageKey = nombreClaveIdempotencia(tipo);
  try {
    const guardada = sessionStorage.getItem(storageKey) || '';
    if (formatoUuid.test(guardada)) {
      clavesIdempotencia.set(tipo, guardada);
      return guardada;
    }
  } catch { /* Se mantiene la clave en memoria si el navegador bloquea sessionStorage. */ }
  const nueva = crypto.randomUUID();
  clavesIdempotencia.set(tipo, nueva);
  try { sessionStorage.setItem(storageKey, nueva); } catch { /* La clave en memoria permite reintentos en esta pestaña. */ }
  return nueva;
}

export function borrarClaveIdempotencia(tipo) {
  clavesIdempotencia.delete(tipo);
  try { sessionStorage.removeItem(nombreClaveIdempotencia(tipo)); } catch { /* No hay almacenamiento de sesión disponible. */ }
}

const CLAVE_ACCESO_COORDINACION = `bartimeo_coord_access_${PARROQUIA_SLUG}`;
const FORMATO_CLAVE_ACCESO = /^[a-f0-9]{64}$/;

export function getClaveAccesoCoordinacion() {
  const claveEnUrl = new URLSearchParams(window.location.hash.slice(1)).get('acceso');
  if (claveEnUrl && FORMATO_CLAVE_ACCESO.test(claveEnUrl)) return claveEnUrl;
  try {
    const claveGuardada = localStorage.getItem(CLAVE_ACCESO_COORDINACION) || '';
    return FORMATO_CLAVE_ACCESO.test(claveGuardada) ? claveGuardada : '';
  } catch {
    return '';
  }
}

export function recordarClaveAccesoCoordinacion(clave) {
  if (!FORMATO_CLAVE_ACCESO.test(clave || '')) return;
  try { localStorage.setItem(CLAVE_ACCESO_COORDINACION, clave); } catch { /* El enlace original sigue funcionando. */ }
}

export function borrarClaveAccesoCoordinacion() {
  try { localStorage.removeItem(CLAVE_ACCESO_COORDINACION); } catch { /* Sin almacenamiento persistente. */ }
}

export function conservarAccesoCoordinacion(href) {
  const clave = getClaveAccesoCoordinacion();
  if (!clave) return href;
  const url = new URL(href, window.location.origin);
  url.hash = `acceso=${clave}`;
  return `${url.pathname}${url.search}${url.hash}`;
}

function esVistaCoordinacion() {
  const pagina = window.location.pathname.split('/').filter(Boolean).at(-1);
  return ['coordinacion', 'coordinacion.html', 'admin', 'admin.html', 'mapa', 'mapa.html'].includes(pagina) ||
    /^#(?:coordinacion|admin)(?:\?|$)/i.test(window.location.hash);
}

export async function apiFetch(endpoint, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('X-Parroquia', PARROQUIA_SLUG);
  if (EDICION_SLUG && esVistaCoordinacion()) headers.set('X-Edicion', EDICION_SLUG);
  return fetch(`${API_URL}${endpoint}`, { ...options, headers });
}

