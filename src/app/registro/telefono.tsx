import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Pasos } from '../../components/ds';
import { Otp, useEspera } from '../../components/Otp';
import { api, ApiError } from '../../lib/api';
import { useAuth, type Suscriptor } from '../../lib/auth';
import { guardarBorrador, irAlSiguientePaso } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

const formato = (n: string) => n.replace(/^0?(\d{3})(\d{3})(\d{2})(\d{2})$/, '0$1-$2-$3-$4');

/** 04 · Verifica tu teléfono (2 de 4): celular + código de 6 dígitos por WhatsApp (SMS de respaldo). */
export default function Telefono() {
  const { entrar } = useAuth();
  const [tel, setTel] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useEspera();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const limpio = tel.replace(/\D/g, '');
  const valido = /^0?4(12|14|16|24|26|22)\d{7}$/.test(limpio);

  async function enviar(canal: 'whatsapp' | 'sms') {
    setError(''); setCargando(true);
    try {
      const r = await api<{ reenviarEn: number }>('/v1/auth/otp/solicitar', { method: 'POST', body: { telefono: limpio, canal } });
      setEnviado(true); setEspera(r.reenviarEn); setCodigo('');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  async function verificar(c = codigo) {
    if (c.length !== 6) return;
    setError(''); setCargando(true);
    try {
      const r = await api<{ accessToken: string; refreshToken: string; suscriptor: Suscriptor }>('/v1/auth/otp/verificar', { method: 'POST', body: { telefono: limpio, codigo: c } });
      await entrar(r);
      if (r.suscriptor.estado !== 'REGISTRO_INCOMPLETO' && r.suscriptor.estado !== 'CORRECCION') { router.replace('/inicio'); return; }
      await guardarBorrador();
      await irAlSiguientePaso();
    } catch (e) {
      setCodigo(''); setError(e instanceof ApiError ? e.message : 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={2} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>Verifica tu teléfono</Text>
          <Text style={s.p}>{enviado
            ? <>Te enviamos un código de 6 dígitos por WhatsApp al <Text style={s.fuerte}>{formato(limpio)}</Text>.</>
            : 'Te enviaremos un código de 6 dígitos por WhatsApp para verificar que eres tú.'}</Text>
          <Text style={s.label}>Celular</Text>
          <View style={[s.input, !enviado && s.inputOn]}>
            <Text style={s.prefix}>🇻🇪 +58</Text>
            <View style={s.div} />
            <TextInput value={tel} onChangeText={setTel} editable={!enviado} placeholder="414 555 2817" placeholderTextColor={colors.ink3}
              keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" maxLength={14} style={s.textInput} accessibilityLabel="Número de celular" />
            {enviado && <Pressable onPress={() => { setEnviado(false); setCodigo(''); }} hitSlop={8}><Text style={s.link}>Cambiar</Text></Pressable>}
          </View>
          {enviado && (
            <>
              <Text style={[s.label, { marginTop: 6 }]}>Código de verificación</Text>
              <Otp valor={codigo} onCambio={setCodigo} onCompleto={verificar} espera={espera} onReenviar={() => enviar('whatsapp')} onSms={() => enviar('sms')} />
            </>
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={s.bottom}>
          {enviado
            ? <Boton title="Verificar" onPress={() => verificar()} loading={cargando} disabled={codigo.length !== 6} />
            : <Boton title="Recibir código por WhatsApp" onPress={() => enviar('whatsapp')} loading={cargando} disabled={!valido} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 12, gap: 10 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginBottom: 6 },
  fuerte: { fontFamily: fonts.bold, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  inputOn: { borderColor: colors.navy },
  prefix: { fontFamily: fonts.semibold, color: colors.ink2, fontSize: 14 },
  div: { width: 1, height: 22, backgroundColor: colors.line },
  textInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 20 },
});
