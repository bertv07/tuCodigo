import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Pasos } from '../../components/Pasos';
import { api, ApiError } from '../../lib/api';
import { estadoRegistro } from '../../lib/registro';
import { colors, fonts } from '../../lib/theme';

const TIPOS = [{ v: 'V', t: 'V · Venezolano' }, { v: 'E', t: 'E · Extranjero' }, { v: 'P', t: 'P · Pasaporte' }] as const;

/** 03 · ¿Quién eres? Datos tal como aparecen en el documento */
export default function Documento() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  const [tipo, setTipo] = useState<'V' | 'E' | 'P'>('V');
  const [numero, setNumero] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fecha, setFecha] = useState({ d: '', m: '', a: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  // Al completar DD salta a MM, y de MM a AAAA
  const refs = { d: useRef<ComponentRef<typeof TextInput>>(null), m: useRef<ComponentRef<typeof TextInput>>(null), a: useRef<ComponentRef<typeof TextInput>>(null) };

  // Si ya los había escrito (o está corrigiendo), se cargan para editarlos
  useEffect(() => {
    estadoRegistro().then(r => {
      if (!r.datos) return;
      setTipo(r.datos.tipoDocumento); setNumero(r.datos.documento.slice(2).replace(/\./g, ''));
      setNombres(r.datos.nombres); setApellidos(r.datos.apellidos);
      const [a, m, d] = r.datos.fechaNacimiento.split('-'); setFecha({ d, m, a });
    }).catch(() => {});
  }, []);

  const completo = numero.length >= 5 && nombres.trim().length >= 2 && apellidos.trim().length >= 2 && fecha.d.length && fecha.m.length && fecha.a.length === 4;

  async function continuar() {
    setError(''); setErrores({}); setCargando(true);
    try {
      await api('/v1/registro/datos', {
        method: 'PUT', auth: true,
        body: { tipoDocumento: tipo, numero, nombres: nombres.trim(), apellidos: apellidos.trim(), fechaNacimiento: `${fecha.a}-${fecha.m.padStart(2, '0')}-${fecha.d.padStart(2, '0')}` },
      });
      if (volver) router.back(); else router.push('/registro/cedula');
    } catch (e) {
      if (e instanceof ApiError && e.campos?.length) setErrores(Object.fromEntries(e.campos.map(c => [c.campo, c.problema])));
      else setError(e instanceof ApiError ? e.message : 'Ocurrió un error.');
    } finally { setCargando(false); }
  }

  const campo = (label: string, key: string, input: React.ReactNode) => (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      {input}
      {!!errores[key] && <Text style={s.error}>{errores[key]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={2} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>¿Quién eres?</Text>
          <Text style={s.p}>Escribe tus datos tal como aparecen en tu documento.</Text>

          {campo('Tipo de documento', 'tipoDocumento', (
            <View style={s.chips}>
              {TIPOS.map(t => (
                <Pressable key={t.v} onPress={() => setTipo(t.v)} style={[s.chip, tipo === t.v && s.chipOn]} accessibilityRole="radio" accessibilityState={{ checked: tipo === t.v }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={[s.chipText, tipo === t.v && { color: colors.white }]}>{t.t}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          {campo(tipo === 'P' ? 'Número de pasaporte' : 'Número de cédula', 'numero', (
            <View style={s.input}>
              <Text style={s.prefix}>{tipo}-</Text>
              <TextInput style={s.text} value={numero} maxLength={tipo === 'P' ? 15 : 10} placeholder={tipo === 'P' ? 'AB1234567' : '24587931'} placeholderTextColor={colors.ink3}
                keyboardType={tipo === 'P' ? 'default' : 'number-pad'} autoCapitalize="characters" autoCorrect={false}
                onChangeText={v => setNumero(tipo === 'P' ? v.toUpperCase().replace(/[^A-Z0-9]/g, '') : v.replace(/\D/g, ''))} />
            </View>
          ))}
          {campo('Nombres', 'nombres', <View style={s.input}><TextInput style={s.text} value={nombres} onChangeText={setNombres} maxLength={60} autoComplete="name-given" textContentType="givenName" placeholder="María Alejandra" placeholderTextColor={colors.ink3} /></View>)}
          {campo('Apellidos', 'apellidos', <View style={s.input}><TextInput style={s.text} value={apellidos} onChangeText={setApellidos} maxLength={60} autoComplete="name-family" textContentType="familyName" placeholder="Rodríguez Salazar" placeholderTextColor={colors.ink3} /></View>)}
          {campo('Fecha de nacimiento', 'fechaNacimiento', (
            <View style={s.fecha}>
              {([['d', 'DD', 2], ['m', 'MM', 2], ['a', 'AAAA', 4]] as const).map(([k, ph, max]) => (
                <View key={k} style={[s.input, { flex: max === 4 ? 1.4 : 1, justifyContent: 'center' }]}>
                  <TextInput ref={refs[k]} style={[s.text, { textAlign: 'center' }]} value={fecha[k]} placeholder={ph} placeholderTextColor={colors.ink3} keyboardType="number-pad" maxLength={max}
                    onChangeText={v => {
                      const x = v.replace(/\D/g, '');
                      setFecha(f => ({ ...f, [k]: x }));
                      if (x.length === max) (k === 'd' ? refs.m : k === 'm' ? refs.a : null)?.current?.focus();
                    }} accessibilityLabel={`Fecha de nacimiento ${ph}`} />
                </View>
              ))}
            </View>
          ))}
          <Text style={s.nota}>🔒 Tus datos viajan cifrados y no se comparten.</Text>
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={s.bottom}><Boton title={volver ? 'Guardar' : 'Continuar'} onPress={continuar} loading={cargando} disabled={!completo} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 22, gap: 16 },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.navy, marginTop: 6 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginTop: -6 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, minWidth: 0, paddingHorizontal: 4, height: 42, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink },
  input: { height: 56, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  prefix: { fontFamily: fonts.semibold, color: colors.ink2, fontSize: 16 },
  text: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  fecha: { flexDirection: 'row', gap: 8 },
  nota: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink2 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { paddingHorizontal: 22, paddingBottom: 12, paddingTop: 6 },
});
