import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Logo } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

/** 04/31 · Teléfono: pide el código OTP por WhatsApp (o SMS) */
export default function Telefono() {
  const [tel, setTel] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const limpio = tel.replace(/\D/g, '');
  const valido = /^0?4(12|14|16|24|26|22)\d{7}$/.test(limpio);

  async function enviar(canal: 'whatsapp' | 'sms') {
    setError(''); setCargando(true);
    try {
      const r = await api<{ telefono: string; reenviarEn: number }>('/v1/auth/otp/solicitar', { method: 'POST', body: { telefono: limpio, canal } });
      router.push({ pathname: '/acceso/codigo', params: { telefono: limpio, enmascarado: r.telefono, canal } });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.top}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={s.back}>‹  Volver</Text></Pressable>
          <Logo size={34} />
        </View>
        <View style={s.body}>
          <Text style={s.h1}>Tu número de{'\n'}celular</Text>
          <Text style={s.p}>Te enviaremos un código de 6 dígitos por WhatsApp para verificar que eres tú.</Text>
          <Text style={s.label}>Celular</Text>
          <View style={[s.input, tel.length > 0 && s.inputFocus]}>
            <Text style={s.prefix}>🇻🇪 +58</Text>
            <TextInput value={tel} onChangeText={setTel} placeholder="0414 555 2817" placeholderTextColor={colors.ink3}
              keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" maxLength={14} style={s.textInput} accessibilityLabel="Número de celular" />
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
        </View>
        <View style={s.bottom}>
          <Boton title="Recibir código por WhatsApp" onPress={() => enviar('whatsapp')} loading={cargando} disabled={!valido} />
          <Boton title="Prefiero SMS" variant="ghost" onPress={() => enviar('sms')} disabled={!valido || cargando} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  back: { fontFamily: fonts.bold, color: colors.navy, fontSize: 15 },
  body: { flex: 1, padding: 22, gap: 10 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy, marginTop: 18 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginBottom: 12 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 56, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  inputFocus: { borderColor: colors.navy },
  prefix: { fontFamily: fonts.semibold, color: colors.ink2, fontSize: 15 },
  textInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 22, gap: 10 },
});
