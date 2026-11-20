import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { api, ApiError, BASE, asistido, tokenVigente } from './api';

export type EstadoRegistro = {
  estado: 'REGISTRO_INCOMPLETO' | 'EN_REVISION' | 'CORRECCION' | 'VERIFICADO' | 'RECHAZADO' | 'BLOQUEADO';
  codigo: string | null; motivo: string | null;
  datos: { tipoDocumento: 'V' | 'E' | 'P'; documento: string; nombres: string; apellidos: string; fechaNacimiento: string } | null;
  cedula: boolean; selfie: boolean;
};
export type DatosDocumento = { tipoDocumento: 'V' | 'E' | 'P'; numero: string; nombres: string; apellidos: string; fechaNacimiento: string };

/**
 * Datos del documento escritos en la pantalla 03, antes de verificar el teléfono (04).
 * Viven solo en memoria y se guardan en el servidor apenas se verifica el código.
 */
export const borrador: { datos: DatosDocumento | null } = { datos: null };

export const estadoRegistro = () => api<EstadoRegistro>('/v1/registro', { auth: true });

/** Guarda en el servidor los datos de la pantalla 03 (si quedaron pendientes). */
export async function guardarBorrador() {
  if (!borrador.datos) return;
  await api('/v1/registro/datos', { method: 'PUT', auth: true, body: borrador.datos });
  borrador.datos = null;
}

/** Lleva al suscriptor al primer paso que le falta (o al inicio si ya terminó). */
export async function irAlSiguientePaso(reemplazar = true) {
  const r = await estadoRegistro();
  const editable = r.estado === 'REGISTRO_INCOMPLETO' || r.estado === 'CORRECCION';
  const destino = !editable ? (asistido.token ? '/promotor' : '/inicio')
    : !r.datos ? '/registro/documento'
    : r.estado === 'CORRECCION' ? '/registro/revisar'
    : !r.cedula ? '/registro/cedula'
    : !r.selfie ? '/registro/selfie'
    : '/registro/revisar';
  (reemplazar ? router.replace : router.push)(destino as never);
}

/** Sube la foto como binario (image/jpeg) directo desde el archivo, sin pasarla por memoria en base64. */
export async function subirFoto(tipo: 'cedula' | 'selfie', uri: string) {
  const path = `/v1/registro/foto/${tipo}`;
  const access = await tokenVigente(path);
  let r;
  try {
    r = await uploadAsync(`${BASE}${path}`, uri, {
      httpMethod: 'PUT', uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${access}` },
    });
  } catch { throw new ApiError(0, 'SIN_CONEXION', 'No pudimos enviar la foto. Revisa tu internet e intenta de nuevo.'); }
  if (r.status >= 400) {
    let j: { error?: { code?: string; message?: string } } = {};
    try { j = JSON.parse(r.body); } catch { /* respuesta no JSON */ }
    throw new ApiError(r.status, j.error?.code ?? 'ERROR', j.error?.message ?? 'No pudimos guardar la foto.');
  }
}
