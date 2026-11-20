import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Logo } from '../../components/ui';
import { TopBar, OtpBoxes } from '../../components/ds';
import { api, ApiError } from '../../lib/api';
import { useStaff } from '../../lib/staff';
import { colors, fonts } from '../../lib/theme';

/** Acceso del promotor o supervisor: correo + contraseña + código de su app autenticadora (igual que la Torre). */
export default function AccesoPromotor() {
  const { entrar } = useStaff();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function login() {
    setError(''); setCargando(true);
    try {
      const r = await api<{ mfaToken: string; configurar2fa?: string }>('/v1/staff/auth/login', { method: 'POST', body: { email: email.trim(), password } });
      if (r.configurar2fa) { setError('Primero configura tu código de verificación entrando una vez a la Torre de Control.'); return; }
      setMfa(r.mfaToken);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }
  async function verificar(c = codigo) {
    if (!mfa || c.length !== 6) return;
    setError(''); setCargando(true);
    try {
      const r = await api<{ accessToken: string; refreshToken: string }>('/v1/staff/auth/2fa', { method: 'POST', body: { mfaToken: mfa, codigo: c, canal: 'app' } });
      await entrar(r); router.replace('/promotor');
    } catch (e) { setCodigo(''); setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <TopBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Logo size={40} />
          <Text style={s.h1}>Estación de{'\n'}registro</Text>
          <Text style={s.p}>Acceso para promotores y supervisores de taquilla.</Text>
          {!mfa ? (
            <>
              <Text style={s.label}>Correo corporativo</Text>
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} textContentType="username" style={s.input} placeholder="promotor@procurasiglo21.com" placeholderTextColor={colors.ink3} />
              <Text style={s.label}>Contraseña</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry textContentType="password" style={s.input} placeholder="••••••••••••" placeholderTextColor={colors.ink3} />
            </>
          ) : (
            <>
              <Text style={s.label}>Código de verificación en dos pasos</Text>
              <OtpBoxes valor={codigo} />
              <TextInput value={codigo} onChangeText={v => { const d = v.replace(/\D/g, '').slice(0, 6); setCodigo(d); if (d.length === 6) verificar(d); }} autoFocus keyboardType="number-pad" textContentType="oneTimeCode" maxLength={6} style={{ position: 'absolute', opacity: 0 }} />
            </>
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={{ padding: 20 }}>
          {!mfa ? <Boton title="Continuar" onPress={login} loading={cargando} disabled={!email || !password} /> : <Boton title="Entrar" onPress={() => verificar()} loading={cargando} disabled={codigo.length !== 6} />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 10 },
  h1: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.navy, marginTop: 10 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, marginBottom: 8 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2, marginTop: 4 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
