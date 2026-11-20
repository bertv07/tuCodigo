import { router, useLocalSearchParams } from 'expo-router';
import { Captura } from '../../components/Captura';
import { api } from '../../lib/api';

/** 06 · Selfie (4 de 4). Al terminar se envía a validación y se asigna el código TC-SUC. */
export default function Selfie() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  async function listo() {
    if (volver) return router.back();
    const r = await api<{ codigo: string; fundadorNumero: number | null }>('/v1/registro/enviar', { method: 'POST', auth: true });
    router.replace({ pathname: '/registro/listo', params: { codigo: r.codigo, numero: String(r.fundadorNumero) } });
  }
  return <Captura tipo="selfie" paso={4} titulo="Tu selfie" guia="Acércate un poco más"
    ayuda="Mira de frente, sin lentes oscuros ni gorra." onListo={listo} />;
}
