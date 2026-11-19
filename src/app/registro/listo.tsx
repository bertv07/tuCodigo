import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Boton, Simbolo } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors, fonts } from '../../lib/theme';

const PASOS = [
  { t: 'Datos y teléfono', d: 'Verificado por OTP', e: 'Listo', ok: true },
  { t: 'Cédula y selfie', d: 'Validación del equipo', e: 'En revisión', ok: false },
  { t: 'Elegir producto y firmar', d: 'Ya puedes ver el catálogo', e: 'Siguiente', ok: false },
];

/** 07 · ¡Ya tienes tu código! */
export default function Listo() {
  const { codigo, numero } = useLocalSearchParams<{ codigo: string; numero: string }>();
  const { recargar } = useAuth();
  const ir = async () => { await recargar(); router.replace('/inicio'); };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ alignItems: 'center', gap: 10, marginTop: 10 }}>
          <Simbolo size={64} dark />
          <Text style={s.h1}>¡Ya tienes tu código!</Text>
          <Text style={s.p}>Estamos validando tus fotos. Te avisamos por WhatsApp en minutos.</Text>
        </View>
        <View style={s.tarjeta}>
          <Text style={s.small}>Tu Código Directo</Text>
          <Text style={s.codigo} selectable>{codigo}</Text>
          <View style={s.sello}><Text style={s.selloText}>Suscriptor fundador N.º {Number(numero).toLocaleString('es-VE')}</Text></View>
        </View>
        <View style={s.lista}>
          {PASOS.map((p, i) => (
            <View key={p.t} style={[s.fila, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={[s.punto, p.ok && { backgroundColor: colors.green }]}><Text style={s.puntoText}>{p.ok ? '✓' : i + 1}</Text></View>
              <View style={{ flex: 1 }}><Text style={s.ft}>{p.t}</Text><Text style={s.fd}>{p.d}</Text></View>
              <Text style={[s.fe, p.ok && { color: '#7BE0B5' }]}>{p.e}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={s.bottom}><Boton title="Ir al inicio" variant="gold" onPress={ir} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  body: { padding: 22, gap: 20 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.white, textAlign: 'center' },
  p: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 21 },
  tarjeta: { backgroundColor: colors.navyDark, borderRadius: 26, padding: 22, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(193,154,62,0.45)' },
  small: { fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.65)', fontSize: 12, letterSpacing: 1 },
  codigo: { fontFamily: fonts.title, color: colors.goldLight, fontSize: 24 },
  sello: { backgroundColor: 'rgba(193,154,62,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  selloText: { fontFamily: fonts.bold, color: colors.goldLight, fontSize: 12 },
  lista: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 22, paddingHorizontal: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  punto: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  puntoText: { fontFamily: fonts.bold, color: colors.white, fontSize: 13 },
  ft: { fontFamily: fonts.bold, color: colors.white, fontSize: 14 },
  fd: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  fe: { fontFamily: fonts.semibold, color: colors.goldLight, fontSize: 12 },
  bottom: { padding: 22 },
});
