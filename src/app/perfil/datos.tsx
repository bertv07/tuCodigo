import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Card, TopBar } from '../../components/ds';
import { api, ApiError } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

type P = { nombres: string | null; apellidos: string | null; documento: string | null; fechaNacimiento: string | null; telefono: string; email: string | null; codigo: string | null };

/** Perfil · Datos personales. El correo es opcional: sirve para recibir también ahí la copia del contrato. */
export default function Datos() {
  const [p, setP] = useState<P | null>(null);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  useFocusEffect(useCallback(() => { api<P>('/v1/cuenta/perfil', { auth: true }).then(x => { setP(x); setEmail(x.email ?? ''); }).catch(e => setError(e.message)); }, []));
  async function guardar() {
    setMsg(''); setError(''); setGuardando(true);
    try { await api('/v1/cuenta/perfil/email', { method: 'PUT', auth: true, body: { email: email.trim() || null } }); setMsg('Correo guardado.'); }
    catch (e) { setError(e instanceof ApiError ? (e.campos?.[0]?.problema ?? e.message) : 'Ocurrió un error.'); }
    finally { setGuardando(false); }
  }
  const fila = (k: string, v?: string | null) => <View style={s.fila}><Text style={s.k}>{k}</Text><Text style={s.v}>{v || '—'}</Text></View>;
  const nac = p?.fechaNacimiento ? p.fechaNacimiento.split('-').reverse().join('/') : null;
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Datos personales" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Card style={{ paddingVertical: 4 }}>
            {fila('Nombres', p?.nombres)}{fila('Apellidos', p?.apellidos)}{fila('Documento', p?.documento)}{fila('Nacimiento', nac)}{fila('Celular', p?.telefono)}{fila('Código', p?.codigo)}
          </Card>
          <Text style={s.nota}>Para corregir tus datos de identidad, acércate a una taquilla del Centro Empresarial 8 de Mayo.</Text>
          <Text style={s.label}>Correo (opcional)</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="tucorreo@ejemplo.com" placeholderTextColor={colors.ink3} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" maxLength={160} style={s.input} />
          <Text style={s.nota}>Si lo agregas, también te enviamos ahí la copia de tus contratos.</Text>
          {!!msg && <Text style={s.ok}>{msg}</Text>}
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={{ padding: 20 }}><Boton title="Guardar correo" onPress={guardar} loading={guardando} disabled={(p?.email ?? '') === email.trim()} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 10 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  k: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.ink3 },
  v: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2, marginTop: 6 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  nota: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 17 },
  ok: { fontFamily: fonts.semibold, color: colors.green, fontSize: 13 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
