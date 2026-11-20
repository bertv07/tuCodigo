import * as SecureStore from 'expo-secure-store';

/**
 * Cliente de la API.
 * - Los tokens se guardan SOLO en SecureStore (Keychain en iPhone, Keystore en Android), nunca en AsyncStorage.
 * - En producción solo se permite HTTPS.
 * - Si el token de acceso vence, se renueva una sola vez con el refresh token (rotativo).
 * - Hay dos sesiones independientes: la del suscriptor y la del promotor de taquilla.
 * - Registro asistido: mientras el promotor registra a un cliente, las llamadas de registro usan un token
 *   temporal del cliente que vive solo en memoria (no se guarda en el teléfono del promotor).
 */
export const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
if (!__DEV__ && !BASE.startsWith('https://')) throw new Error('La API debe usar HTTPS en producción');

const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type CampoInvalido = { campo: string; problema: string };
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public campos?: CampoInvalido[]) { super(message); }
}

function almacen(prefijo: string) {
  const K = { access: `${prefijo}.access`, refresh: `${prefijo}.refresh` };
  return {
    async save(access: string, refresh: string) {
      await SecureStore.setItemAsync(K.access, access, opts);
      await SecureStore.setItemAsync(K.refresh, refresh, opts);
    },
    access: () => SecureStore.getItemAsync(K.access, opts),
    refresh: () => SecureStore.getItemAsync(K.refresh, opts),
    async clear() { await SecureStore.deleteItemAsync(K.access, opts); await SecureStore.deleteItemAsync(K.refresh, opts); },
  };
}
/** Sesión del suscriptor */
export const tokens = almacen('tc');
/** Sesión del promotor / supervisor (app de taquilla) */
export const tokensStaff = almacen('tc.staff');

/** Token temporal del cliente durante un registro asistido (solo en memoria). */
export const asistido: { token: string | null; nombre?: string } = { token: null };

const refrescando: Record<string, Promise<boolean> | null> = {};
async function tryRefresh(cual: 'suscriptor' | 'staff'): Promise<boolean> {
  const t = cual === 'staff' ? tokensStaff : tokens;
  const r = await t.refresh();
  if (!r) return false;
  const res = await fetch(`${BASE}${cual === 'staff' ? '/v1/staff/auth/app/refrescar' : '/v1/auth/refrescar'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: r }) }).catch(() => null);
  if (!res) return false;
  if (!res.ok) { await t.clear(); return false; }
  const j = await res.json();
  await t.save(j.accessToken, j.refreshToken);
  return true;
}

type Init = { method?: string; body?: unknown; auth?: boolean; staff?: boolean };

export async function api<T>(path: string, init: Init = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const usaAsistido = init.auth && !init.staff && !!asistido.token && path.startsWith('/v1/registro');
  if (init.staff) { const a = await tokensStaff.access(); if (a) headers.Authorization = `Bearer ${a}`; }
  else if (usaAsistido) headers.Authorization = `Bearer ${asistido.token}`;
  else if (init.auth) { const a = await tokens.access(); if (a) headers.Authorization = `Bearer ${a}`; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: init.method ?? 'GET', headers, body: init.body !== undefined ? JSON.stringify(init.body) : undefined, signal: ctrl.signal });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No pudimos conectar. Revisa tu internet e intenta de nuevo.');
  } finally { clearTimeout(timer); }

  if (res.status === 401 && (init.auth || init.staff) && !usaAsistido && retry) {
    const cual = init.staff ? 'staff' : 'suscriptor';
    refrescando[cual] ??= tryRefresh(cual).finally(() => { refrescando[cual] = null; });
    if (await refrescando[cual]) return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Ocurrió un error.', json?.error?.campos);
  return json as T;
}

/** Token vigente para subir fotos o descargar archivos (renueva antes si hace falta). */
export async function tokenVigente(path: string): Promise<string | null> {
  if (asistido.token && path.startsWith('/v1/registro')) return asistido.token;
  await api('/v1/auth/yo', { auth: true }).catch(() => {});
  return tokens.access();
}

export const mensajeDe = (e: unknown) => (e instanceof ApiError ? e.message : 'Ocurrió un error.');
