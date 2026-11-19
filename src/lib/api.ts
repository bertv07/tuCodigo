import * as SecureStore from 'expo-secure-store';

/**
 * Cliente de la API.
 * - Los tokens se guardan SOLO en SecureStore (Keychain en iPhone, Keystore en Android), nunca en AsyncStorage.
 * - En producción solo se permite HTTPS.
 * - Si el token de acceso vence, se renueva una sola vez con el refresh token (rotativo).
 */
export const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
if (!__DEV__ && !BASE.startsWith('https://')) throw new Error('La API debe usar HTTPS en producción');

const K = { access: 'tc.access', refresh: 'tc.refresh' };
const opts: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type CampoInvalido = { campo: string; problema: string };
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public campos?: CampoInvalido[]) { super(message); }
}

export const tokens = {
  async save(access: string, refresh: string) {
    await SecureStore.setItemAsync(K.access, access, opts);
    await SecureStore.setItemAsync(K.refresh, refresh, opts);
  },
  access: () => SecureStore.getItemAsync(K.access, opts),
  refresh: () => SecureStore.getItemAsync(K.refresh, opts),
  async clear() { await SecureStore.deleteItemAsync(K.access, opts); await SecureStore.deleteItemAsync(K.refresh, opts); },
};

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  const r = await tokens.refresh();
  if (!r) return false;
  const res = await fetch(`${BASE}/v1/auth/refrescar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: r }) });
  if (!res.ok) { await tokens.clear(); return false; }
  const j = await res.json();
  await tokens.save(j.accessToken, j.refreshToken);
  return true;
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (init.auth) { const a = await tokens.access(); if (a) headers.Authorization = `Bearer ${a}`; }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method: init.method ?? 'GET', headers, body: init.body ? JSON.stringify(init.body) : undefined, signal: ctrl.signal });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No pudimos conectar. Revisa tu internet e intenta de nuevo.');
  } finally { clearTimeout(timer); }

  if (res.status === 401 && init.auth && retry) {
    refreshing ??= tryRefresh().finally(() => { refreshing = null; });
    if (await refreshing) return api<T>(path, init, false);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Ocurrió un error.', json?.error?.campos);
  return json as T;
}
