import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, Share } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ChevronDown, Share2, Factory, Ruler, Truck, ArrowRight } from 'lucide-react-native';
import { Card, IconBtn, Badge, Li } from '../../components/ds';
import { ProductoImg } from '../../components/ProductoImg';
import { cargarProducto, usd, bs, type Producto } from '../../lib/catalogo';
import { colors, fonts } from '../../lib/theme';

/** 10 · Detalle del producto */
export default function DetalleProducto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const ins = useSafeAreaInsets();
  const [p, setP] = useState<Producto | null>(null);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(0);
  const [ficha, setFicha] = useState(false);
  useEffect(() => { cargarProducto(id).then(setP).catch(e => setError(e.message)); }, [id]);

  if (!p) return <SafeAreaView style={[s.root, s.centro]}>{error ? <Text style={s.p}>{error}</Text> : <ActivityIndicator color={colors.navy} />}</SafeAreaView>;
  const ref = bs(p.precio, p.tasaBcv);
  const resumen = p.ficha.map(f => f.valor).join(' · ');
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ width, height: 320 + ins.top }}>
          {p.fotos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={e => setFoto(Math.round(e.nativeEvent.contentOffset.x / width))}>
              {p.fotos.map(f => <ProductoImg key={f} foto={f} style={{ width, height: 320 + ins.top }} radio={0} contain />)}
            </ScrollView>
          ) : <ProductoImg categoria={p.categoria} nombre={p.nombre} style={{ width, height: 320 + ins.top }} radio={0} />}
          <View style={[s.botones, { top: ins.top + 8 }]}>
            <IconBtn Icono={ChevronLeft} label="Volver" onPress={() => router.back()} />
            <IconBtn Icono={Share2} label="Compartir" onPress={() => Share.share({ message: `${p.nombre} (${p.marca}) · ${usd(p.precio)} · De la fábrica a tu mano. TU CÓDIGO` })} />
          </View>
          {p.fotos.length > 1 && <View style={s.puntos}>{p.fotos.map((f, i) => <View key={f} style={[s.punto, i === foto && s.puntoOn]} />)}</View>}
        </View>
        <View style={s.body}>
          <View style={s.chips}>
            {p.fabrica && <View style={s.fab}><Factory size={13} color={colors.navy} /><Text style={s.fabT}>Fábrica: {p.fabrica.nombre}{p.fabrica.pais ? ` ${p.fabrica.pais}` : ''}</Text></View>}
            {p.garantia && <Badge texto={`Garantía ${p.garantia}`} tono="ok" />}
          </View>
          <Text style={s.marca}>{p.marca} · {p.categoria}</Text>
          <Text style={s.h1}>{p.nombre}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <Text style={s.precio}>{usd(p.precio)}</Text>
            {ref && <Text style={s.bs}>{ref} · BCV {p.tasaBcv?.toLocaleString('es-VE')}</Text>}
          </View>
          <Card style={{ paddingVertical: 4, marginTop: 6 }}>
            {p.ficha.length > 0 && (
              <Li Icono={Ruler} titulo="Ficha técnica" sub={ficha ? undefined : resumen} onPress={() => setFicha(!ficha)}
                derecha={ficha ? <ChevronDown size={18} color={colors.ink3} /> : <ChevronRight size={18} color={colors.ink3} />} />
            )}
            {ficha && p.ficha.map((f, i) => <View key={i} style={s.fila}><Text style={s.k}>{f.etiqueta}</Text><Text style={s.v}>{f.valor}</Text></View>)}
            <Li Icono={Truck} tono="gold" titulo="Entrega estimada" sub={p.entregaEstimada} ultimo />
          </Card>
          {p.descripcion && <Text style={s.p}>{p.descripcion}</Text>}
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']} style={s.bottom}>
        <Pressable style={s.btn} onPress={() => router.push({ pathname: '/plan/simular', params: { productoId: p.id } })} accessibilityRole="button">
          <Text style={s.btnT}>Simular mi plan</Text><ArrowRight size={20} color={colors.white} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centro: { alignItems: 'center', justifyContent: 'center' },
  botones: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  puntos: { position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(21,41,79,0.25)' },
  puntoOn: { backgroundColor: colors.navy, width: 18 },
  body: { padding: 20, gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  fab: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.navy50, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  fabT: { fontFamily: fonts.bold, fontSize: 11, color: colors.navy },
  marca: { fontFamily: fonts.bold, fontSize: 11, color: colors.navyLight, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 6 },
  h1: { fontFamily: fonts.title, fontSize: 22, lineHeight: 27, color: colors.navy },
  precio: { fontFamily: fonts.title, fontSize: 30, color: colors.navy },
  bs: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, paddingLeft: 56, borderBottomWidth: 1, borderBottomColor: colors.line },
  k: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink2 },
  v: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, flexShrink: 1, textAlign: 'right' },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21, marginTop: 6 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 10, backgroundColor: colors.bg },
  btn: { height: 56, borderRadius: 18, backgroundColor: colors.navy, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  btnT: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
