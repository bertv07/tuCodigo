import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, Lock } from 'lucide-react-native';
import { Boton } from '../../components/ui';
import { Pasos, Seg } from '../../components/ds';
import { api, ApiError, tokens, asistido } from '../../lib/api';
import { borrador, estadoRegistro } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

const TIPOS = [{ v: 'V' as const, t: 'V · Venezolano' }, { v: 'E' as const, t: 'E · Extranjero' }, { v: 'P' as const, t: 'P · Pasaporte' }];

/**
 * 03 · ¿Quién eres? (1 de 4). Si aún no hay sesión, se valida el documento (formato, edad y que no esté
 * registrado) y los datos se guardan al verificar el teléfono. Si ya hay sesión (corrección o taquilla), se guardan de una vez.
 */
export default function Documento() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  const [conSesion, setConSesion] = useState(!!asistido.token);
  const [tipo, setTipo] = useState<'V' | 'E' | 'P'>(borrador.datos?.tipoDocumento ?? 'V');
  const [numero, setNumero] = useState(borrador.datos?.numero ?? '');
  const [nombres, setNombres] = useState(borrador.datos?.nombres ?? '');
  const [apellidos, setApellidos] = useState(borrador.datos?.apellidos ?? '');
  const [fecha, setFecha] = useState(() => { const [a = '', m = '', d = ''] = (borrador.datos?.fechaNacimiento ?? '').split('-'); return { d, m, a }; });
  const [foco, setFoco] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const refs = { d: useRef<ComponentRef<typeof TextInput>>(null), m: useRef<ComponentRef<typeof TextInput>>(null), a: useRef<ComponentRef<typeof TextInput>>(null) };

  // Con sesión (corrección o registro asistido) se cargan los datos que ya estén guardados
  useEffect(() => {
    (async () => {
      if (!asistido.token && !(await tokens.access())) return;
      setConSesion(true);
      const r = await estadoRegistro().catch(() => null);
      if (!r?.datos) return;
      setTipo(r.datos.tipoDocumento); setNumero(r.datos.documento.slice(2).replace(/\./g, ''));
      setNombres(r.datos.nombres); setApellidos(r.datos.apellidos);
      const [a, m, d] = r.datos.fechaNacimiento.split('-'); setFecha({ d, m, a });
    })();
  }, []);

  const completo = numero.length >= 5 && nombres.trim().length >= 2 && apellidos.trim().length >= 2 && fecha.d.length && fecha.m.length && fecha.a.length === 4;

  async function continuar() {
    setError(''); setErrores({}); setCargando(true);
    const datos = { tipoDocumento: tipo, numero, nombres: nombres.trim(), apellidos: apellidos.trim(), fechaNacimiento: `${fecha.a}-${fecha.m.padStart(2, '0')}-${fecha.d.padStart(2, '0')}` };
    try {
      if (conSesion) {
        await api('/v1/registro/datos', { method: 'PUT', auth: true, body: datos });
        if (volver) router.back(); else router.push('/registro/cedula');
      } else {
        await api('/v1/registro/validar-documento', { method: 'POST', body: datos });
        borrador.datos = datos;
        router.push('/registro/telefono');
      }
    } catch (e) {
      if (e instanceof ApiError && e.campos?.length) setErrores(Object.fromEntries(e.campos.map(c => [c.campo, c.problema])));
      else setError(e instanceof ApiError ? e.message : 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  const caja = (key: string) => [s.input, foco === key && s.inputOn];
  const campo = (label: string, key: string, input: React.ReactNode) => (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      {input}
      {!!errores[key] && <Text style={s.error}>{errores[key]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={asistido.token ? 2 : 1} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>¿Quién eres?</Text>
          <Text style={s.p}>Escribe tus datos tal como aparecen en tu documento.</Text>
          {campo('Tipo de documento', 'tipoDocumento', <Seg opciones={TIPOS} valor={tipo} onCambio={setTipo} />)}
          {campo(tipo === 'P' ? 'Número de pasaporte' : 'Número de cédula', 'numero', (
            <View style={caja('numero')}>
              <Text style={s.prefix}>{tipo}-</Text>
              <TextInput value={numero} onChangeText={v => setNumero(tipo === 'P' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, ''))}
                onFocus={() => setFoco('numero')} onBlur={() => setFoco('')} placeholder={tipo === 'P' ? 'A1234567' : '24587931'} placeholderTextColor={colors.ink3}
                keyboardType={tipo === 'P' ? 'default' : 'number-pad'} autoCapitalize="characters" maxLength={15} style={s.textInput} accessibilityLabel="Número de documento" />
            </View>
          ))}
          {campo('Nombres', 'nombres', <TextInput value={nombres} onChangeText={setNombres} onFocus={() => setFoco('nombres')} onBlur={() => setFoco('')} placeholder="María Alejandra" placeholderTextColor={colors.ink3} autoCapitalize="words" textContentType="givenName" maxLength={60} style={[caja('nombres'), s.textSolo]} />)}
          {campo('Apellidos', 'apellidos', <TextInput value={apellidos} onChangeText={setApellidos} onFocus={() => setFoco('apellidos')} onBlur={() => setFoco('')} placeholder="Rodríguez Salazar" placeholderTextColor={colors.ink3} autoCapitalize="words" textContentType="familyName" maxLength={60} style={[caja('apellidos'), s.textSolo]} />)}
          {campo('Fecha de nacimiento', 'fechaNacimiento', (
            <View style={caja('fecha')}>
              <TextInput ref={refs.d} value={fecha.d} onChangeText={v => { const d = v.replace(/\D/g, '').slice(0, 2); setFecha(f => ({ ...f, d })); if (d.length === 2) refs.m.current?.focus(); }} onFocus={() => setFoco('fecha')} onBlur={() => setFoco('')} placeholder="DD" placeholderTextColor={colors.ink3} keyboardType="number-pad" maxLength={2} style={s.fechaIn} accessibilityLabel="Día" />
              <Text style={s.sep}>/</Text>
              <TextInput ref={refs.m} value={fecha.m} onChangeText={v => { const m = v.replace(/\D/g, '').slice(0, 2); setFecha(f => ({ ...f, m })); if (m.length === 2) refs.a.current?.focus(); }} onFocus={() => setFoco('fecha')} onBlur={() => setFoco('')} placeholder="MM" placeholderTextColor={colors.ink3} keyboardType="number-pad" maxLength={2} style={s.fechaIn} accessibilityLabel="Mes" />
              <Text style={s.sep}>/</Text>
              <TextInput ref={refs.a} value={fecha.a} onChangeText={v => setFecha(f => ({ ...f, a: v.replace(/\D/g, '').slice(0, 4) }))} onFocus={() => setFoco('fecha')} onBlur={() => setFoco('')} placeholder="AAAA" placeholderTextColor={colors.ink3} keyboardType="number-pad" maxLength={4} style={[s.fechaIn, { width: 60 }]} accessibilityLabel="Año" />
              <View style={{ flex: 1 }} />
              <CalendarDays size={18} color={colors.ink3} />
            </View>
          ))}
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={s.bottom}>
          <View style={s.seguro}><Lock size={13} color={colors.ink3} /><Text style={s.seguroT}>Tus datos viajan cifrados y no se comparten.</Text></View>
          <Boton title="Continuar" onPress={continuar} loading={cargando} disabled={!completo} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 12, gap: 14 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginTop: -8 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  inputOn: { borderColor: colors.navy },
  textSolo: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  prefix: { fontFamily: fonts.title, fontSize: 15, color: colors.navy },
  textInput: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  fechaIn: { width: 32, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink, textAlign: 'center' },
  sep: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink3 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 20, gap: 12 },
  seguro: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  seguroT: { fontFamily: fonts.regular, fontSize: 11, color: colors.ink3 },
});
