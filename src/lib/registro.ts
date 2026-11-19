import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { api, ApiError, tokens, BASE } from './api';

export type EstadoRegistro = {
  estado: 'REGISTRO_INCOMPLETO' | 'EN_REVISION' | 'CORRECCION' | 'VERIFICADO' | 'RECHAZADO' | 'BLOQUEADO';
  codigo: string | null; motivo: string | null;
  datos: { tipoDocumento: 'V' | 'E' | 'P'; documento: string; nombres: string; apellidos: string; fechaNacimiento: string } | null;
  cedula: boolean; selfie: boolean;
};

export const estadoRegistro = () => api<EstadoRegistro>('/v1/registro', { auth: true });

/** Lleva al suscriptor al primer paso que le falta (o al inicio si ya terminó). */
export async function irAlSiguientePaso(reemplazar = true) {
  const r = await estadoRegistro();
  const editable = r.estado === 'REGISTRO_INCOMPLETO' || r.estado === 'CORRECCION';
  const destino = !editable ? '/inicio'
    : !r.datos ? '/registro/documento'
    : r.estado === 'CORRECCION' ? '/registro/revisar'
    : !r.cedula ? '/registro/cedula'
    : !r.selfie ? '/registro/selfie'
    : '/registro/revisar';
  (reemplazar ? router.replace : router.push)(destino as never);
}

/**
 * Sube la foto como binario (image/jpeg) directo desde el archivo, sin pasarla por memoria en base64.
 * Antes se asegura de tener un token vigente (la llamada a /registro lo renueva si hizo falta).
 */
export async function subirFoto(tipo: 'cedula' | 'selfie', uri: string) {
  await estadoRegistro();
  const access = await tokens.access();
  let r;
  try {
    r = await uploadAsync(`${BASE}/v1/registro/foto/${tipo}`, uri, {
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
