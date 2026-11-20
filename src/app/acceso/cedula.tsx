import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint } from 'lucide-react-native';
import { Boton, Logo } from '../../components/ui';
import { IconBtn, Seg, Av } from '../../components/ds';
import { ChevronLeft } from 'lucide-react-native';
import { api, ApiError } from '../../lib/api';
import { biometria } from '../../lib/biometria';
import { colors, fonts } from '../../lib/theme';

/** 31 · Inicio de sesión: con la cédula se envía un código por WhatsApp al teléfono registrado. */
export default function AccesoCedula() {
  const [tipo, setTipo] = useState<'V' | 'E' | 'P'>('V');
  const [numero, setNumero] = useState('');
  const [huella, setHuella] = useState(false);
  const [error, setError] = useState('');
  const [noRegistrado, setNoRegistrado] = useState(false);
  const [cargando, setCargando] = useState(false);
  useEffect(() => { biometria.disponible().then(setHuella); }, []);

  async function enviar() {
    setError(''); setNoRegistrado(false); setCargando(true);
    try {
      const r = await api<{ telefono: string; reenviarEn: number }>('/v1/auth/documento/solicitar', { method: 'POST', body: { tipoDocumento: tipo, numero } });
      router.push({ pathname: '/acceso/codigo', params: { tipo, numero, enmascarado: r.telefono, espera: String(r.reenviarEn) } });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'NO_REGISTRADO') setNoRegistrado(true);
      setError(e instanceof ApiError ? e.message : 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.body}>
          <IconBtn Icono={ChevronLeft} onPress={() => router.back()} label="Volver" />
          <View style={{ marginTop: 14 }}><Logo size={40} /></View>
          <Text style={s.h1}>Bienvenida{'\n'}de nuevo</Text>
          <Text style={s.p}>Entra con tu cédula y te enviamos un código por WhatsApp.</Text>
          <Text style={s.label}>Cédula</Text>
          <Seg opciones={[{ v: 'V', t: 'V' }, { v: 'E', t: 'E' }, { v: 'P', t: 'P' }]} valor={tipo} onCambio={setTipo} />
          <View style={s.input}>
            <Text style={s.prefix}>{tipo}-</Text>
            <TextInput value={numero} onChangeText={v => setNumero(tipo === 'P' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, ''))} placeholder={tipo === 'P' ? 'A1234567' : '24587931'} placeholderTextColor={colors.ink3}
              keyboardType={tipo === 'P' ? 'default' : 'number-pad'} autoFocus maxLength={15} style={s.textInput} accessibilityLabel="Número de cédula" />
          </View>
          {huella && (
            <View style={s.nota}>
              <Av Icono={Fingerprint} size={36} />
              <Text style={s.notaT}>En este teléfono también puedes entrar con <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>huella o Face ID</Text>.</Text>
            </View>
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
          {noRegistrado && <Boton title="Crear mi código" variant="gold" onPress={() => router.replace('/como-funciona')} style={{ marginTop: 4 }} />}
        </View>
        <View style={s.bottom}>
          <Boton title="Enviar código" onPress={enviar} loading={cargando} disabled={numero.length < 5} />
          <Text style={s.pie}>¿Aún no tienes tu código? <Text style={s.link} onPress={() => router.replace('/como-funciona')}>Créalo aquí</Text></Text>
          <Pressable onPress={() => router.push('/promotor/acceso')} hitSlop={8}><Text style={[s.pie, { fontSize: 11 }]}>¿Eres promotor de taquilla? <Text style={s.link}>Entra aquí</Text></Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, padding: 20, paddingTop: 8, gap: 12 },
  h1: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.navy, marginTop: 6 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2, marginTop: 6 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  prefix: { fontFamily: fonts.title, fontSize: 15, color: colors.navy },
  textInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  nota: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: 20, padding: 12 },
  notaT: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 17 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 20, gap: 12 },
  pie: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, textAlign: 'center' },
  link: { fontFamily: fonts.bold, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
});
