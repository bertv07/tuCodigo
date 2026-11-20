import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { api, BASE, tokens, ApiError } from './api';

/** Día 3 y 4 · Tipos y utilidades del catálogo, el simulador y Mis Planes. Los montos llegan en centavos de USD. */
export type Tarjeta = { id: string; nombre: string; marca: string; categoria: string; precio: number; desde: number; foto: string | null; etiqueta: string | null };
export type Catalogo = { marcas: { id: string; nombre: string; logo: string | null }[]; categorias: { id: string; nombre: string }[]; fabricas: { id: string; nombre: string; pais: string }[]; productos: Tarjeta[]; tasaBcv: number | null };
export type Producto = {
  id: string; nombre: string; descripcion: string | null; marca: string; categoria: string;
  fabrica: { nombre: string; pais: string; ciudad: string | null } | null; ficha: { etiqueta: string; valor: string }[];
  precio: number; desde: number; entregaEstimada: string; garantia: string | null; fotos: string[];
  plazos: { etapa1: number[]; etapa2: number[] }; porcentajeEntrega: number; registro: number; tasaBcv: number | null;
};
type Etapa = { meses: number; total: number; cuota: number; ultimaCuota: number };
export type Simulacion = {
  precio: number; porcentajeEntrega: number; registro: number; cuota1: number; activacion: number;
  etapa1: Etapa & { cuotasDespuesDeLaPrimera: number }; etapa2: Etapa; totalAPagar: number; tasaBcv: number | null; cuotasEnCuota1?: number;
};
export type Plan = {
  id: string; estado: 'PENDIENTE_FIRMA' | 'FIRMADO' | 'ACTIVO' | 'ANULADO'; creado: string;
  condiciones: { simulacion: Simulacion; producto: { id: string; nombre: string; marca: string; fabrica: string | null; categoria: string; entregaEstimada: string } };
  contrato: { numero: string; firmadoEn: string } | null;
};
export type Parte = { t: string; dato?: true };
export type TextoContrato = { numero: string; version: string; borrador: boolean; titulo: string; subtitulo: string; encabezado: string; encabezadoPartes: Parte[]; clausulas: { titulo: string; texto: string; partes: Parte[] }[]; firmante: { nombre: string; documento: string } };

export const imgUrl = (archivo: string) => `${BASE}/v1/catalogo/img/${archivo}`;

/** 69000 → "$690" ; 2875 → "$28,75" */
export function usd(centavos: number, siempreDecimales = false) {
  const v = centavos / 100;
  const dec = siempreDecimales || !Number.isInteger(v) ? 2 : 0;
  return '$' + v.toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
export const bs = (centavos: number, tasa: number | null) => tasa ? `≈ Bs. ${(centavos / 100 * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;

export const cargarCatalogo = (q = '', marca?: string, categoria?: string, fabrica?: string) => {
  const p = new URLSearchParams(); if (q) p.set('q', q); if (marca) p.set('marca', marca); if (categoria) p.set('categoria', categoria); if (fabrica) p.set('fabrica', fabrica);
  return api<Catalogo>(`/v1/catalogo?${p}`);
};
export const cargarProducto = (id: string) => api<Producto>(`/v1/catalogo/productos/${encodeURIComponent(id)}`);
export const simular = (productoId: string, etapa1: number, etapa2: number) => api<Simulacion>('/v1/catalogo/simular', { method: 'POST', body: { productoId, etapa1, etapa2 } });

/** Descarga el PDF (firmado o vista previa) con la sesión del suscriptor y abre el menú para verlo o compartirlo. */
export async function abrirContrato(planId: string, numero: string, vistaPrevia = false) {
  const destino = `${FileSystem.cacheDirectory}${vistaPrevia ? 'Contrato_vista_previa' : `Contrato_${numero}`}.pdf`;
  await api('/v1/auth/yo', { auth: true }).catch(() => {}); // renueva la sesión si hizo falta
  const t = await tokens.access();
  const r = await FileSystem.downloadAsync(`${BASE}/v1/planes/${planId}/${vistaPrevia ? 'contrato/vista-previa.pdf' : 'contrato.pdf'}`, destino, { headers: { Authorization: `Bearer ${t}` } });
  if (r.status === 401) throw new ApiError(401, 'NO_AUTENTICADO', 'Tu sesión expiró. Entra de nuevo.');
  if (r.status !== 200) throw new ApiError(r.status, 'ERROR', 'No pudimos descargar el contrato.');
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(r.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Contrato ${numero}` });
}
