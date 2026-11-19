import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokens } from './api';

export type Suscriptor = { id: string; codigo: string | null; estado: 'REGISTRO_INCOMPLETO' | 'EN_REVISION' | 'CORRECCION' | 'VERIFICADO' | 'RECHAZADO' | 'BLOQUEADO'; telefono?: string };
type Ctx = {
  cargando: boolean; suscriptor: Suscriptor | null;
  entrar: (r: { accessToken: string; refreshToken: string; suscriptor: Suscriptor }) => Promise<void>;
  salir: () => Promise<void>; recargar: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>(null as never);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [suscriptor, setSuscriptor] = useState<Suscriptor | null>(null);

  const recargar = useCallback(async () => {
    try { setSuscriptor(await api<Suscriptor>('/v1/auth/yo', { auth: true })); }
    catch { setSuscriptor(null); }
  }, []);

  useEffect(() => { (async () => { if (await tokens.access()) await recargar(); setCargando(false); })(); }, [recargar]);

  const entrar: Ctx['entrar'] = async (r) => { await tokens.save(r.accessToken, r.refreshToken); setSuscriptor(r.suscriptor); };
  const salir = async () => {
    try { await api('/v1/auth/salir', { method: 'POST', auth: true }); } catch { /* sin conexión: igual se borran los tokens */ }
    await tokens.clear(); setSuscriptor(null);
  };
  return <AuthCtx.Provider value={{ cargando, suscriptor, entrar, salir, recargar }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
