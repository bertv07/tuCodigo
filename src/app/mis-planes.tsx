import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, FilePen, Store, Truck, Plus } from 'lucide-react-native';
import { Boton } from '../components/ui';
import { Card, Hero, Badge, Li, Chip, TabBar } from '../components/ds';
import { ProductoImg } from '../components/ProductoImg';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/api';
import { usd, abrirContrato, type Plan } from '../lib/catalogo';
import { colors, fonts } from '../lib/theme';

const fecha = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '') : '');

/** 18 · Mis Planes: producto, plazos, cuota y estado (identidad, contrato, activación y entrega). Los pagos llegan con la Fase 2. */
export default function MisPlanes() {
  const { suscriptor } = useAuth();
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [sel, setSel] = useState(0);
  const [error, setError] = useState('');
  const [abriendo, setAbriendo] = useState(false);
  const cargar = useCallback(async () => {
    try { setError(''); setPlanes((await api<Plan[]>('/v1/planes', { auth: true })).sort((a, b) => (b.contrato ? 1 : 0) - (a.contrato ? 1 : 0))); } catch (e) { setError((e as Error).message); setPlanes([]); }
  }, []);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  if (!suscriptor) return <Redirect href="/" />;

  const p = planes?.[Math.min(sel, (planes?.length ?? 1) - 1)];
  const m = p?.condiciones.simulacion;
  async function ver() {
    if (!p?.contrato) return;
    setAbriendo(true);
    try { await abrirContrato(p.id, p.contrato.numero); } catch (e) { setError((e as Error).message); } finally { setAbriendo(false); }
  }
  function eliminar() {
    if (!p) return;
    Alert.alert('Eliminar plan', `¿Eliminar el plan de ${p.condiciones.producto.nombre}? Aún no lo has firmado.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { try { await api(`/v1/planes/${p.id}`, { method: 'DELETE', auth: true }); setSel(0); cargar(); } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); } } },
    ]);
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}>
        <Text style={s.h1}>Mis Planes</Text>
        {planes === null && <ActivityIndicator color={colors.navy} />}
        {planes?.length === 0 && (
          <Card style={{ gap: 6 }}>
            <Text style={s.h3}>Aún no tienes planes</Text>
            <Text style={s.p}>Elige un producto directo de fábrica y arma tu plan en el catálogo.</Text>
            <Boton title="Ir al catálogo" onPress={() => router.replace('/catalogo')} style={{ marginTop: 8 }} />
          </Card>
        )}
        {planes && planes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {planes.map((x, i) => <Chip key={x.id} texto={x.condiciones.producto.nombre} on={i === sel} onPress={() => setSel(i)} />)}
          </ScrollView>
        )}
        {p && m && (
          <>
            <Hero style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ProductoImg categoria={p.condiciones.producto.categoria} nombre={p.condiciones.producto.nombre} style={{ width: 46, height: 46, opacity: 0.95 }} radio={14} />
                <View style={{ flex: 1 }}><Text style={s.hNombre} numberOfLines={1}>{p.condiciones.producto.nombre}</Text><Text style={s.hSub}>{p.condiciones.producto.marca} · {usd(m.precio)}</Text></View>
                <Badge texto={p.contrato ? 'Etapa 1' : 'Sin firmar'} tono="gold" />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={s.caja}><Text style={s.cajaK}>Cuota</Text><Text style={s.cajaV}>{usd(m.etapa1.cuota, true)}</Text></View>
                <View style={s.caja}><Text style={s.cajaK}>Etapa 1</Text><Text style={s.cajaV}>{m.etapa1.meses} meses</Text></View>
                <View style={s.caja}><Text style={s.cajaK}>Etapa 2</Text><Text style={s.cajaV}>{m.etapa2.meses} meses</Text></View>
              </View>
            </Hero>
            <Text style={s.h3}>Estado del plan</Text>
            <Card style={{ paddingVertical: 4 }}>
              <Li Icono={Check} tono="green" titulo="Identidad verificada" sub={fecha(suscriptor.revisadoEn) || suscriptor.codigo || ''} />
              {p.contrato
                ? <Li Icono={FilePen} tono="green" titulo="Contrato firmado" sub={`${p.contrato.numero} · PDF`} derecha={abriendo ? <ActivityIndicator color={colors.navy} /> : <Pressable onPress={ver} hitSlop={8}><Text style={s.link}>Ver</Text></Pressable>} />
                : <Li Icono={FilePen} titulo="Contrato" sub="Falta tu firma" derecha={<Pressable onPress={() => router.push(`/plan/${p.id}`)} hitSlop={8}><Text style={s.link}>Firmar</Text></Pressable>} />}
              <Li Icono={Store} tono="gold" titulo="Activación en taquilla" sub={`Registro / Tarjeta + Cuota 1 · ${usd(m.activacion, true)}`} derecha={p.contrato ? <Badge texto="Pendiente" tono="warn" /> : undefined} />
              <Li Icono={Truck} titulo="Entrega de tu producto" sub={p.condiciones.producto.entregaEstimada} ultimo />
            </Card>
            {!p.contrato && <Pressable onPress={eliminar} hitSlop={8} style={{ alignSelf: 'center' }}><Text style={[s.link, { color: colors.red, textDecorationColor: colors.red }]}>Eliminar este plan</Text></Pressable>}
          </>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
        {!!planes?.length && (
          <Pressable onPress={() => router.replace('/catalogo')} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
              <View style={s.mas}><Plus size={20} color={colors.navy} /></View><Text style={s.h3}>Agregar otro plan</Text>
            </Card>
          </Pressable>
        )}
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 8, gap: 14, paddingBottom: 30 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy },
  h3: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 20 },
  hNombre: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  hSub: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  caja: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 10 },
  cajaK: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  cajaV: { fontFamily: fonts.title, fontSize: 15, color: colors.white, marginTop: 2 },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  mas: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
