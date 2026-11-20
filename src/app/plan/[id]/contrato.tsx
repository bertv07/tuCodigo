import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, CircleCheck } from 'lucide-react-native';
import { Boton, Simbolo } from '../../../components/ui';
import { TopBar, IconBtn } from '../../../components/ds';
import { api } from '../../../lib/api';
import { abrirContrato, type Parte, type TextoContrato } from '../../../lib/catalogo';
import { colors, fonts, sombra } from '../../../lib/theme';

/** Texto con los datos del suscriptor y del plan resaltados */
function Resaltado({ partes, estilo }: { partes: Parte[]; estilo: object }) {
  return <Text style={estilo}>{partes.map((x, i) => x.dato ? <Text key={i} style={s.dato}>{x.t}</Text> : x.t)}</Text>;
}

/** 13 · Contrato prellenado */
export default function ContratoPrellenado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [c, setC] = useState<TextoContrato | null>(null);
  const [error, setError] = useState('');
  const [bajando, setBajando] = useState(false);
  useEffect(() => { api<TextoContrato>(`/v1/planes/${id}/contrato`, { auth: true }).then(setC).catch(e => setError(e.message)); }, [id]);

  async function descargar() {
    setBajando(true);
    try { await abrirContrato(id, '', true); } catch (e) { setError((e as Error).message); } finally { setBajando(false); }
  }

  if (!c) return <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>{error ? <Text style={s.p}>{error}</Text> : <ActivityIndicator color={colors.navy} />}</SafeAreaView>;
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Tu contrato" derecha={bajando ? <ActivityIndicator color={colors.navy} /> : <IconBtn Icono={Download} label="Descargar vista previa en PDF" onPress={descargar} />} />
      <View style={[s.hoja, sombra]}>
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
          <View style={{ alignItems: 'center' }}><Simbolo size={34} /></View>
          {c.borrador && <Text style={s.borrador}>Texto provisional, pendiente de aprobación legal</Text>}
          <Text style={s.t}>{c.titulo}</Text>
          {!!c.subtitulo && <Text style={s.st}>{c.subtitulo}</Text>}
          <Text style={s.num}>N.º {c.numero}</Text>
          <Resaltado partes={c.encabezadoPartes} estilo={s.p} />
          {c.clausulas.map((x, i) => (
            <Text key={i} style={s.p}><Text style={s.ct}>{x.titulo} </Text>{x.partes.map((y, j) => y.dato ? <Text key={j} style={s.dato}>{y.t}</Text> : y.t)}</Text>
          ))}
        </ScrollView>
      </View>
      <View style={s.pie}>
        <Text style={s.pieT}>{c.clausulas.length} cláusulas</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><CircleCheck size={14} color={colors.green} /><Text style={[s.pieT, { color: colors.green }]}>Datos prellenados</Text></View>
      </View>
      {!!error && <Text style={s.error}>{error}</Text>}
      <View style={s.bottom}><Boton title="Firmar contrato" onPress={() => router.push(`/plan/${id}/firma`)} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hoja: { flex: 1, marginHorizontal: 20, marginTop: 4, backgroundColor: colors.white, borderRadius: 22, overflow: 'hidden' },
  borrador: { fontFamily: fonts.bold, fontSize: 11, color: colors.red, textAlign: 'center' },
  t: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy, textAlign: 'center' },
  st: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.navy, textAlign: 'center', marginTop: -6 },
  num: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.ink3, textAlign: 'center' },
  ct: { fontFamily: fonts.bold, color: colors.ink },
  p: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.ink2, lineHeight: 20 },
  dato: { fontFamily: fonts.bold, color: colors.navy, backgroundColor: colors.navy50 },
  pie: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10 },
  pieT: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink3 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13, textAlign: 'center', paddingTop: 6 },
  bottom: { padding: 20, paddingTop: 10 },
});
