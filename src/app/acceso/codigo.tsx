import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { TopBar } from '../../components/ds';
import { Otp, useEspera } from '../../components/Otp';
import { api, ApiError } from '../../lib/api';
import { useAuth, type Suscriptor } from '../../lib/auth';
import { irAlSiguientePaso } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

/** 04 (reutilizada desde 31) · Código para entrar con la cédula. Al verificar entra directo a 08 · Inicio. */
export default function AccesoCodigo() {
  const { tipo, numero, enmascarado, espera: e0 } = useLocalSearchParams<{ tipo: 'V' | 'E' | 'P'; numero: string; enmascarado: string; espera?: string }>();
  const { entrar } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useEspera(Number(e0 ?? 60));
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function verificar(c = codigo) {
    if (c.length !== 6) return;
    setError(''); setCargando(true);
    try {
      const r = await api<{ accessToken: string; refreshToken: string; suscriptor: Suscriptor }>('/v1/auth/documento/verificar', { method: 'POST', body: { tipoDocumento: tipo, numero, codigo: c } });
      await entrar(r);
      if (r.suscriptor.estado === 'REGISTRO_INCOMPLETO' || r.suscriptor.estado === 'CORRECCION') await irAlSiguientePaso();
      else router.replace('/inicio');
    } catch (e) { setCodigo(''); setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }
  async function reenviar(canal: 'whatsapp' | 'sms') {
    setError('');
    try { const r = await api<{ reenviarEn: number }>('/v1/auth/documento/solicitar', { method: 'POST', body: { tipoDocumento: tipo, numero, canal } }); setEspera(r.reenviarEn); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
  }

  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Inicia sesión" />
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>Verifica tu teléfono</Text>
        <Text style={s.p}>Te enviamos un código de 6 dígitos por WhatsApp al <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{enmascarado}</Text>.</Text>
        <Text style={s.label}>Código de verificación</Text>
        <Otp valor={codigo} onCambio={setCodigo} onCompleto={verificar} espera={espera} onReenviar={() => reenviar('whatsapp')} onSms={() => reenviar('sms')} />
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <View style={s.bottom}><Boton title="Verificar" onPress={() => verificar()} loading={cargando} disabled={codigo.length !== 6} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 12 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2, marginTop: 6 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 20 },
});
