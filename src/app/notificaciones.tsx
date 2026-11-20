import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck, CircleX, FilePen, Store, Sparkles, TriangleAlert, Bell } from 'lucide-react-native';
import { Card, Li, TopBar } from '../components/ds';
import { api } from '../lib/api';
import { colors, fonts } from '../lib/theme';

type N = { id: string; tipo: string; titulo: string; texto: string; creado: string; leida: boolean };
const ICONOS = {
  IDENTIDAD_OK: [CircleCheck, 'green'], IDENTIDAD_AJUSTE: [TriangleAlert, 'gold'], IDENTIDAD_RECHAZADA: [CircleX, 'red'], CONTRATO_FIRMADO: [FilePen, 'navy'],
  ACTIVA_PLAN: [Store, 'gold'], NUEVAS_MARCAS: [Sparkles, 'blue'],
} as const;

/** 19 · Notificaciones (Hoy / Esta semana / Antes) */
export default function Notificaciones() {
  const [lista, setLista] = useState<N[] | null>(null);
  const cargar = useCallback(async () => { try { setLista((await api<{ filas: N[] }>('/v1/cuenta/notificaciones', { auth: true })).filas); } catch { setLista([]); } }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  async function leerTodas() { await api('/v1/cuenta/notificaciones/leer-todas', { method: 'POST', auth: true }).catch(() => {}); cargar(); }

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const semana = new Date(hoy.getTime() - 6 * 864e5);
  const grupos: [string, N[]][] = [
    ['Hoy', (lista ?? []).filter(n => new Date(n.creado) >= hoy)],
    ['Esta semana', (lista ?? []).filter(n => new Date(n.creado) < hoy && new Date(n.creado) >= semana)],
    ['Antes', (lista ?? []).filter(n => new Date(n.creado) < semana)],
  ];
  const destino = (n: N) => n.tipo === 'NUEVAS_MARCAS' ? '/catalogo' : n.tipo === 'IDENTIDAD_AJUSTE' || n.tipo === 'IDENTIDAD_RECHAZADA' ? '/inicio' : '/mis-planes';

  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Notificaciones" derecha={<Pressable onPress={leerTodas} hitSlop={8}><Text style={s.link}>Leer todas</Text></Pressable>} />
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}>
        {lista === null && <ActivityIndicator color={colors.navy} />}
        {lista?.length === 0 && <View style={s.vacio}><Bell size={30} color={colors.ink3} /><Text style={s.p}>Aquí verás los avisos de tu registro, tu contrato y tus planes.</Text></View>}
        {grupos.filter(([, g]) => g.length).map(([t, g]) => (
          <View key={t} style={{ gap: 8 }}>
            <Text style={s.grupo}>{t}</Text>
            <Card style={{ paddingVertical: 4 }}>
              {g.map((n, i) => {
                const [Icono, tono] = ICONOS[n.tipo as keyof typeof ICONOS] ?? [Bell, 'navy'];
                return <Li key={n.id} Icono={Icono} tono={tono} titulo={n.titulo} sub={n.texto} onPress={() => router.push(destino(n) as never)} ultimo={i === g.length - 1}
                  tituloStyle={!n.leida ? { color: colors.navy } : undefined} derecha={!n.leida ? <View style={s.punto} /> : undefined} />;
              })}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 16 },
  grupo: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink3 },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  vacio: { alignItems: 'center', gap: 10, marginTop: 50, paddingHorizontal: 30 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 20 },
});
