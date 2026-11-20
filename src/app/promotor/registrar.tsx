import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Pasos } from '../../components/ds';
import { Otp, useEspera } from '../../components/Otp';
import { api, ApiError, asistido } from '../../lib/api';
import { irAlSiguientePaso } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

/**
 * Registro asistido · paso 1: teléfono del cliente. El código llega al teléfono del cliente y él se lo dicta al promotor.
 * Después sigue el mismo flujo de la app (documento, cédula y selfie) con una sesión temporal del cliente.
 */
export default function RegistrarCliente() {
  const { telefono: t0 } = useLocalSearchParams<{ telefono?: string }>();
  const [tel, setTel] = useState(t0 ? `0${t0.replace('+58', '')}` : '');
  const [enviado, setEnviado] = useState(!!t0);
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useEspera(t0 ? 30 : 0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const limpio = tel.replace(/\D/g, '');
  const valido = /^0?4(12|14|16|24|26|22)\d{7}$/.test(limpio);

  async function enviar(canal: 'whatsapp' | 'sms') {
    setError(''); setCargando(true);
    try { const r = await api<{ reenviarEn: number }>('/v1/promotor/registro/codigo', { method: 'POST', staff: true, body: { telefono: limpio, canal } }); setEnviado(true); setEspera(r.reenviarEn); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }
  async function verificar(c = codigo) {
    if (c.length !== 6) return;
    setError(''); setCargando(true);
    try {
      const r = await api<{ accessToken: string }>('/v1/promotor/registro/verificar', { method: 'POST', staff: true, body: { telefono: limpio, codigo: c } });
      asistido.token = r.accessToken;
      await irAlSiguientePaso(true);
    } catch (e) { setCodigo(''); setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={1} titulo="Registro en taquilla" onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>Teléfono del cliente</Text>
          <Text style={s.p}>{enviado ? 'Pídele al cliente el código de 6 dígitos que le llegó por WhatsApp.' : 'Le enviaremos un código por WhatsApp para verificar su número.'}</Text>
          <Text style={s.label}>Celular del cliente</Text>
          <View style={[s.input, !enviado && { borderColor: colors.navy }]}>
            <Text style={s.prefix}>🇻🇪 +58</Text>
            <TextInput value={tel} onChangeText={setTel} editable={!enviado} placeholder="414 555 2817" placeholderTextColor={colors.ink3} keyboardType="phone-pad" maxLength={14} style={s.textInput} />
            {enviado && <Pressable onPress={() => { setEnviado(false); setCodigo(''); }} hitSlop={8}><Text style={s.link}>Cambiar</Text></Pressable>}
          </View>
          {enviado && <><Text style={[s.label, { marginTop: 6 }]}>Código del cliente</Text><Otp valor={codigo} onCambio={setCodigo} onCompleto={verificar} espera={espera} onReenviar={() => enviar('whatsapp')} onSms={() => enviar('sms')} /></>}
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={{ padding: 20 }}>
          {enviado ? <Boton title="Verificar" onPress={() => verificar()} loading={cargando} disabled={codigo.length !== 6} /> : <Boton title="Enviar código al cliente" onPress={() => enviar('whatsapp')} loading={cargando} disabled={!valido} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 12, gap: 10 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginBottom: 6 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  prefix: { fontFamily: fonts.semibold, color: colors.ink2, fontSize: 14 },
  textInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
