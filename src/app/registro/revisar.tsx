import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Pasos } from '../../components/Pasos';
import { api, ApiError } from '../../lib/api';
import { estadoRegistro, type EstadoRegistro } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

/** Revisión antes de enviar (también cuando el validador pide corregir algo). */
export default function Revisar() {
  const [r, setR] = useState<EstadoRegistro | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  useFocusEffect(useCallback(() => { estadoRegistro().then(setR).catch(e => setError(e.message)); }, []));

  async function enviar() {
    setError(''); setCargando(true);
    try {
      const x = await api<{ codigo: string; fundadorNumero: number }>('/v1/registro/enviar', { method: 'POST', auth: true });
      router.replace({ pathname: '/registro/listo', params: { codigo: x.codigo, numero: String(x.fundadorNumero) } });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  if (!r) return <SafeAreaView style={[s.root, { justifyContent: 'center' }]}><ActivityIndicator color={colors.navy} /></SafeAreaView>;
  const item = (t: string, d: string, ok: boolean, ruta: string) => (
    <Pressable onPress={() => router.push(ruta as never)} style={s.item} accessibilityRole="button">
      <View style={[s.check, ok && { backgroundColor: colors.green, borderColor: colors.green }]}><Text style={s.checkT}>{ok ? '✓' : ''}</Text></View>
      <View style={{ flex: 1 }}><Text style={s.it}>{t}</Text><Text style={s.id}>{d}</Text></View>
      <Text style={s.cambiar}>{ok ? 'Cambiar' : 'Completar'}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={4} volver={false} />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.h1}>{r.estado === 'CORRECCION' ? 'Necesitamos un ajuste' : 'Revisa y envía'}</Text>
        {r.motivo ? <View style={s.aviso}><Text style={s.avisoT}>Mensaje del equipo de validación</Text><Text style={s.avisoD}>{r.motivo}</Text></View>
          : <Text style={s.p}>Confirma que todo esté bien antes de enviarlo a validación.</Text>}
        {item('Datos del documento', r.datos ? `${r.datos.documento} · ${r.datos.nombres} ${r.datos.apellidos}` : 'Pendiente', !!r.datos, '/registro/documento?volver=1')}
        {item('Foto de la cédula', r.cedula ? 'Enviada' : 'Pendiente', r.cedula, '/registro/cedula?volver=1')}
        {item('Selfie', r.selfie ? 'Enviada' : 'Pendiente', r.selfie, '/registro/selfie?volver=1')}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <View style={s.bottom}><Boton title="Enviar a validación" onPress={enviar} loading={cargando} disabled={!r.datos || !r.cedula || !r.selfie} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 22, gap: 12 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy, marginTop: 6 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  aviso: { backgroundColor: '#FFF6E5', borderRadius: 18, padding: 16, gap: 4, borderWidth: 1, borderColor: '#F1D9A6' },
  avisoT: { fontFamily: fonts.bold, fontSize: 12, color: '#8A5A00' },
  avisoD: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, lineHeight: 20 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 18, padding: 16 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  checkT: { fontFamily: fonts.bold, color: colors.white, fontSize: 13 },
  it: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  id: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink2 },
  cambiar: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 22 },
});
