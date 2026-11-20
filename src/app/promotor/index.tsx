import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, CreditCard, ScanLine, UserRound } from 'lucide-react-native';
import { Card, Hero, Li, TabBar, Av } from '../../components/ds';
import { api, asistido, mensajeDe } from '../../lib/api';
import { useStaff } from '../../lib/staff';
import { colors, fonts } from '../../lib/theme';

type Resumen = { promotor: string; estacion: { codigo: string; nombre: string; metaDiaria: number } | null; registrosHoy: number; enTurno: boolean };
type Cola = { tipo: 'OTP' | 'REGISTRO'; id: string; nombre: string; detalle: string; telefono?: string };

/** 21 · Estación · Registro asistido */
export default function Estacion() {
  const { usuario } = useStaff();
  const [r, setR] = useState<Resumen | null>(null);
  const [cola, setCola] = useState<Cola[]>([]);
  const [error, setError] = useState('');
  const cargar = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api<Resumen>('/v1/promotor/resumen', { staff: true }), api<Cola[]>('/v1/promotor/cola', { staff: true })]);
      setR(a); setCola(b); setError('');
    } catch (e) { setError(mensajeDe(e)); }
  }, []);
  useFocusEffect(useCallback(() => { asistido.token = null; cargar(); }, [cargar]));
  if (!usuario) return <Redirect href="/" />;

  async function continuar(c: Cola) {
    if (c.tipo === 'OTP') { router.push({ pathname: '/promotor/registrar', params: { telefono: c.telefono } }); return; }
    try {
      const t = await api<{ accessToken: string }>(`/v1/promotor/cola/${c.id}/continuar`, { method: 'POST', staff: true });
      asistido.token = t.accessToken; asistido.nombre = c.nombre;
      const { irAlSiguientePaso } = await import('../../lib/registro');
      await irAlSiguientePaso(false);
    } catch (e) { setError(mensajeDe(e)); }
  }

  const meta = r?.estacion?.metaDiaria ?? 80;
  const pct = Math.min(100, Math.round(((r?.registrosHoy ?? 0) / Math.max(meta, 1)) * 100));
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}>
        <View style={s.entre}>
          <View style={{ flex: 1 }}>
            <Text style={s.small}>{usuario.rol === 'SUPERVISOR' ? 'Supervisor' : 'Promotor'} · {usuario.nombre}</Text>
            <Text style={s.h1}>{r?.estacion?.nombre ?? 'Sin estación asignada'}</Text>
          </View>
          {r?.enTurno && <View style={s.turno}><View style={s.dot} /><Text style={s.turnoT}>En turno</Text></View>}
        </View>
        <Hero style={{ gap: 6 }}>
          <Text style={s.hSmall}>Registros de hoy</Text>
          <View style={s.entre}><Text style={s.monto}>{r?.registrosHoy ?? '—'}</Text><Text style={s.hSmall}>Meta del día · {meta}</Text></View>
          <View style={s.barra}><View style={[s.barraIn, { width: `${pct}%` }]} /></View>
        </Hero>
        <Pressable style={s.registrar} onPress={() => router.push('/promotor/registrar')} accessibilityRole="button">
          <UserPlus size={22} color={colors.navyDark} /><Text style={s.registrarT}>Registrar nuevo suscriptor</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable style={s.accion} onPress={() => router.push({ pathname: '/promotor/escanear', params: { modo: 'tarjeta' } })} accessibilityRole="button">
            <Av Icono={CreditCard} size={40} /><Text style={s.accionT}>Entregar tarjeta</Text><Text style={s.accionD}>Vincular serial PVC</Text>
          </Pressable>
          <Pressable style={s.accion} onPress={() => router.push('/promotor/escanear')} accessibilityRole="button">
            <Av Icono={ScanLine} size={40} /><Text style={s.accionT}>Consultar código</Text><Text style={s.accionD}>Escanear QR</Text>
          </Pressable>
        </View>
        {cola.length > 0 && (
          <>
            <Text style={s.h3}>En cola</Text>
            <Card style={{ paddingVertical: 4 }}>
              {cola.map((c, i) => <Li key={c.id} Icono={UserRound} titulo={c.nombre} sub={c.detalle} ultimo={i === cola.length - 1}
                derecha={<Pressable onPress={() => continuar(c)} hitSlop={8}><Text style={s.link}>Continuar</Text></Pressable>} />)}
            </Card>
          </>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <TabBar set="promotor" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 30 },
  entre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  small: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  h1: { fontFamily: fonts.title, fontSize: 22, color: colors.navy },
  turno: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  turnoT: { fontFamily: fonts.bold, fontSize: 11, color: colors.green },
  hSmall: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  monto: { fontFamily: fonts.title, fontSize: 38, color: colors.white },
  barra: { height: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 4 },
  barraIn: { height: '100%', borderRadius: 10, backgroundColor: colors.gold },
  registrar: { height: 64, borderRadius: 20, backgroundColor: colors.gold, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  registrarT: { fontFamily: fonts.bold, fontSize: 17, color: colors.navyDark },
  accion: { flex: 1, backgroundColor: colors.white, borderRadius: 22, padding: 14, gap: 4 },
  accionT: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, marginTop: 8 },
  accionD: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  h3: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  link: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
