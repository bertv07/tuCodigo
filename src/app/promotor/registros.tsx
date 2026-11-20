import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRound } from 'lucide-react-native';
import { Card, Chip, Li, Badge, TabBar } from '../../components/ds';
import { api } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

type R = { conteos: Record<'hoy' | 'aprobados' | 'revision' | 'repetir', number>; filas: { id: string; nombre: string; codigo: string | null; estado: string; motivo: string | null; creado: string }[] };
const FILTROS = [['hoy', 'Hoy'], ['aprobados', 'Aprobados'], ['revision', 'En revisión'], ['repetir', 'Repetir']] as const;
const ESTADO: Record<string, [string, 'ok' | 'warn' | 'bad' | 'navy']> = { VERIFICADO: ['Aprobado', 'ok'], EN_REVISION: ['En revisión', 'warn'], CORRECCION: ['Repetir foto', 'bad'], RECHAZADO: ['Rechazado', 'bad'], REGISTRO_INCOMPLETO: ['Incompleto', 'navy'] };

/** 22 · Mis registros del día */
export default function Registros() {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number][0]>('hoy');
  const [r, setR] = useState<R | null>(null);
  const cargar = useCallback(async () => { try { setR(await api<R>(`/v1/promotor/registros?filtro=${filtro}`, { staff: true })); } catch { /* sin conexión */ } }, [filtro]);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-VE', { hour: 'numeric', minute: '2-digit' });
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}>
        <Text style={s.h1}>Mis registros</Text>
        <View style={s.chips}>{FILTROS.map(([v, t]) => <Chip key={v} texto={`${t} · ${r?.conteos[v] ?? 0}`} on={filtro === v} onPress={() => setFiltro(v)} />)}</View>
        <Card style={{ paddingVertical: 4 }}>
          {!r?.filas.length && <Text style={s.vacio}>Sin registros con este filtro.</Text>}
          {r?.filas.map((f, i) => {
            const [t, tono] = ESTADO[f.estado] ?? [f.estado, 'navy'];
            return <Li key={f.id} Icono={UserRound} tono={f.estado === 'CORRECCION' ? 'red' : 'navy'} titulo={f.nombre} sub={f.estado === 'CORRECCION' && f.motivo ? f.motivo : `${f.codigo ?? 'Sin código'} · ${hora(f.creado)}`} derecha={<Badge texto={t} tono={tono} />} ultimo={i === r.filas.length - 1} />;
          })}
        </Card>
      </ScrollView>
      <TabBar set="promotor" />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 30 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vacio: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink3, textAlign: 'center', paddingVertical: 18 },
});
