import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokensStaff, asistido } from './api';

export type Staff = { id: string; nombre: string; email: string; rol: 'ADMIN' | 'VALIDADOR' | 'SUPERVISOR' | 'PROMOTOR' | 'JUNTA'; estacion?: { codigo: string; nombre: string; metaDiaria: number } | null };
type Ctx = { cargando: boolean; usuario: Staff | null; entrar: (r: { accessToken: string; refreshToken: string }) => Promise<void>; salir: () => Promise<void> };
const StaffCtx = createContext<Ctx>(null as never);

/** Sesión del promotor o supervisor en la app de taquilla (independiente de la del suscriptor). */
export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Staff | null>(null);
  const cargar = useCallback(async () => {
    try { setUsuario(await api<Staff>('/v1/staff/auth/yo', { staff: true })); } catch { setUsuario(null); }
  }, []);
  useEffect(() => { (async () => { if (await tokensStaff.access()) await cargar(); setCargando(false); })(); }, [cargar]);
  const entrar = async (r: { accessToken: string; refreshToken: string }) => { await tokensStaff.save(r.accessToken, r.refreshToken); await cargar(); };
  const salir = async () => {
    try { await api('/v1/staff/auth/app/salir', { method: 'POST', staff: true }); } catch { /* sin conexión */ }
    await tokensStaff.clear(); asistido.token = null; setUsuario(null);
  };
  return <StaffCtx.Provider value={{ cargando, usuario, entrar, salir }}>{children}</StaffCtx.Provider>;
}
export const useStaff = () => useContext(StaffCtx);
