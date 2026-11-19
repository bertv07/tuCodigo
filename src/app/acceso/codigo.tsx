import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { useAuth, type Suscriptor } from '../../lib/auth';
import { irAlSiguientePaso } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

/** 04 · Código OTP de 6 dígitos */
export default function Codigo() {
  const { telefono, enmascarado, canal } = useLocalSearchParams<{ telefono: string; enmascarado: string; canal: 'whatsapp' | 'sms' }>();
  const { entrar } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(60);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => { const t = setInterval(() => setEspera(v => (v > 0 ? v - 1 : 0)), 1000); return () => clearInterval(t); }, []);

  async function verificar(c = codigo) {
    if (c.length !== 6) return;
    setError(''); setCargando(true);
    try {
      const r = await api<{ accessToken: string; refreshToken: string; suscriptor: Suscriptor }>('/v1/auth/otp/verificar', { method: 'POST', body: { telefono, codigo: c } });
      await entrar(r);
      // Si no ha terminado el registro, sigue donde lo dejó (Día 2: documento, cédula y selfie)
      if (r.suscriptor.estado === 'REGISTRO_INCOMPLETO' || r.suscriptor.estado === 'CORRECCION') await irAlSiguientePaso();
      else router.replace('/inicio');
    } catch (e) {
      setCodigo(''); setError(e instanceof ApiError ? e.message : 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  async function reenviar() {
    setError('');
    try { await api('/v1/auth/otp/solicitar', { method: 'POST', body: { telefono, canal } }); setEspera(60); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
  }

  return (
    <SafeAreaView style={s.root}>
      <View style={s.top}><Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹  Cambiar número</Text></Pressable></View>
      <View style={s.body}>
        <Text style={s.h1}>Verifica tu{'\n'}teléfono</Text>
        <Text style={s.p}>Escribe el código de 6 dígitos que enviamos por {canal === 'sms' ? 'SMS' : 'WhatsApp'} al <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{enmascarado}</Text>.</Text>

        <Pressable onPress={() => input.current?.focus()} style={s.otp} accessibilityLabel="Código de verificación">
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[s.box, i === codigo.length && s.boxOn]}><Text style={s.digit}>{codigo[i] ?? ''}</Text></View>
          ))}
        </Pressable>
        {/* Campo real oculto: permite autocompletar el código del SMS (iOS / Android) */}
        <TextInput ref={input} value={codigo} autoFocus maxLength={6} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp"
          onChangeText={v => { const d = v.replace(/\D/g, ''); setCodigo(d); if (d.length === 6) verificar(d); }} style={s.hidden} />

        {!!error && <Text style={s.error}>{error}</Text>}
        {espera > 0
          ? <Text style={s.small}>Puedes pedir otro código en 00:{String(espera).padStart(2, '0')}</Text>
          : <Pressable onPress={reenviar}><Text style={s.link}>Reenviar código</Text></Pressable>}
      </View>
      <View style={s.bottom}><Boton title="Verificar" onPress={() => verificar()} loading={cargando} disabled={codigo.length !== 6} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 20, paddingTop: 8 },
  back: { fontFamily: fonts.bold, color: colors.navy, fontSize: 15 },
  body: { flex: 1, padding: 22, gap: 14 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy, marginTop: 18 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  otp: { flexDirection: 'row', gap: 8, marginTop: 10 },
  box: { flex: 1, height: 60, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  boxOn: { borderColor: colors.navy },
  digit: { fontFamily: fonts.title, fontSize: 24, color: colors.navy },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  small: { fontFamily: fonts.regular, color: colors.ink3, fontSize: 13, textAlign: 'center' },
  link: { fontFamily: fonts.bold, color: colors.navy, fontSize: 14, textAlign: 'center', textDecorationLine: 'underline' },
  bottom: { padding: 22 },
});
