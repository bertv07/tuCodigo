import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { api, tokens } from './api';
import { biometria } from './biometria';
import { registrarPush, quitarPush } from './push';

export type Estado = 'REGISTRO_INCOMPLETO' | 'EN_REVISION' | 'CORRECCION' | 'VERIFICADO' | 'RECHAZADO' | 'BLOQUEADO';
export type Suscriptor = { id: string; codigo: string | null; estado: Estado; telefono?: string; nombres?: string | null; apellidos?: string | null; tarjetaSerial?: string | null; revisadoEn?: string | null };
type Ctx = {
  cargando: boolean; suscriptor: Suscriptor | null; bloqueado: boolean;
  entrar: (r: { accessToken: string; refreshToken: string; suscriptor: Suscriptor }) => Promise<void>;
  salir: () => Promise<void>; recargar: () => Promise<void>; desbloquear: () => Promise<boolean>;
};
const AuthCtx = createContext<Ctx>(null as never);

/**
 * Sesión del suscriptor. Si activó «Entrar con huella o Face ID», la app se bloquea al abrirse
 * y al volver de segundo plano, hasta que el sistema confirme su identidad.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [suscriptor, setSuscriptor] = useState<Suscriptor | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  const recargar = useCallback(async () => {
    try { setSuscriptor(await api<Suscriptor>('/v1/auth/yo', { auth: true })); }
    catch { setSuscriptor(null); }
  }, []);

  useEffect(() => {
    (async () => {
      if (await tokens.access()) {
        if (await biometria.activa()) setBloqueado(true);
        await recargar();
      }
      setCargando(false);
    })();
  }, [recargar]);

  // Al volver a la app después de un rato, se pide de nuevo la huella o Face ID
  useEffect(() => {
    let fuera = 0;
    const sub = AppState.addEventListener('change', async st => {
      if (st === 'background') fuera = Date.now();
      if (st === 'active' && fuera && Date.now() - fuera > 60_000 && suscriptor && await biometria.activa()) setBloqueado(true);
    });
    return () => sub.remove();
  }, [suscriptor]);

  useEffect(() => { if (suscriptor && !bloqueado) void registrarPush(); }, [suscriptor, bloqueado]);

  const desbloquear = async () => { const ok = await biometria.verificar('Entra a TU CÓDIGO'); if (ok) setBloqueado(false); return ok; };
  const entrar: Ctx['entrar'] = async (r) => { await tokens.save(r.accessToken, r.refreshToken); setSuscriptor(r.suscriptor); setBloqueado(false); await recargar(); };
  const salir = async () => {
    await quitarPush();
    try { await api('/v1/auth/salir', { method: 'POST', auth: true }); } catch { /* sin conexión: igual se borran los tokens */ }
    await tokens.clear(); await biometria.desactivar(); setSuscriptor(null); setBloqueado(false);
  };
  return <AuthCtx.Provider value={{ cargando, suscriptor, bloqueado, entrar, salir, recargar, desbloquear }}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

export const nombreDe = (s?: Pick<Suscriptor, 'nombres' | 'apellidos'> | null) => {
  const [n1, n2] = (s?.nombres ?? '').split(' ');
  return [n1, n2 ? `${n2[0]}.` : '', (s?.apellidos ?? '').split(' ')[0]].filter(Boolean).join(' ');
};
