import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Pressable, ScrollView, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { Chip, IconBtn, TabBar } from '../../components/ds';
import { Boton } from '../../components/ui';
import { ProductoImg } from '../../components/ProductoImg';
import { cargarCatalogo, usd, type Catalogo, type Tarjeta } from '../../lib/catalogo';
import { colors, fonts, sombra } from '../../lib/theme';

/** 09 · Catálogo directo de fábrica: buscador, chips por marca y filtro por categoría y fábrica. */
export default function CatalogoPantalla() {
  const [datos, setDatos] = useState<Catalogo | null>(null);
  const [q, setQ] = useState('');
  const [marca, setMarca] = useState<string | undefined>();
  const [categoria, setCategoria] = useState<string | undefined>();
  const [fabrica, setFabrica] = useState<string | undefined>();
  const [filtros, setFiltros] = useState(false);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try { setError(''); setDatos(await cargarCatalogo(q.trim(), marca, categoria, fabrica)); }
    catch (e) { setError((e as Error).message); }
  }, [q, marca, categoria, fabrica]);
  useEffect(() => { const t = setTimeout(cargar, 350); return () => clearTimeout(t); }, [cargar]);

  const tarjeta = ({ item: p }: { item: Tarjeta }) => (
    <Pressable style={[s.card, sombra]} onPress={() => router.push(`/catalogo/${p.id}`)} accessibilityRole="button" accessibilityLabel={`${p.nombre}, ${usd(p.precio)}`}>
      <ProductoImg foto={p.foto} categoria={p.categoria} nombre={p.nombre} style={{ height: 122 }} />
      {p.etiqueta && <Text style={[s.etiqueta, p.etiqueta === 'Nuevo' && { color: colors.green }]}>{p.etiqueta}</Text>}
      <Text style={s.marca} numberOfLines={1}>{p.marca}</Text>
      <Text style={s.nombre} numberOfLines={2}>{p.nombre}</Text>
      <Text style={s.precio}>{usd(p.precio)}</Text>
      <Text style={s.desde}>Desde {usd(p.desde, p.desde % 100 !== 0)} / mes</Text>
    </Pressable>
  );
  const activos = (categoria ? 1 : 0) + (fabrica ? 1 : 0);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.head}>
        <View style={s.titulo}><Text style={s.h1}>Catálogo</Text><IconBtn Icono={SlidersHorizontal} label="Filtrar por categoría y fábrica" onPress={() => setFiltros(true)} badge={activos > 0} /></View>
        <View style={s.buscar}>
          <Search size={18} color={colors.ink3} />
          <TextInput value={q} onChangeText={setQ} placeholder="Busca colchones, neveras, teléfonos…" placeholderTextColor={colors.ink3} style={s.buscarIn} returnKeyType="search" autoCorrect={false} accessibilityLabel="Buscar en el catálogo" />
          {!!q && <Pressable onPress={() => setQ('')} hitSlop={8}><X size={16} color={colors.ink3} /></Pressable>}
        </View>
        {!!datos?.marcas.length && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
            <Chip texto="Todas" on={!marca} onPress={() => setMarca(undefined)} />
            {datos.marcas.map(m => <Chip key={m.id} texto={m.nombre} on={marca === m.id} onPress={() => setMarca(m.id)} />)}
          </ScrollView>
        )}
      </View>
      {!datos && !error ? <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={datos?.productos ?? []} keyExtractor={p => p.id} renderItem={tarjeta} numColumns={2}
          columnWrapperStyle={{ gap: 12 }} contentContainerStyle={{ padding: 20, paddingTop: 12, gap: 12, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />}
          ListEmptyComponent={<Text style={s.vacio}>{error || (q || activos ? 'No encontramos productos con esos filtros.' : 'Pronto verás aquí los productos de fábrica.')}</Text>}
        />
      )}
      <TabBar />

      <Modal visible={filtros} animationType="slide" transparent onRequestClose={() => setFiltros(false)}>
        <Pressable style={s.fondo} onPress={() => setFiltros(false)} />
        <View style={s.hoja}>
          <View style={s.titulo}><Text style={s.h2}>Filtrar</Text><IconBtn Icono={X} label="Cerrar" onPress={() => setFiltros(false)} /></View>
          <Text style={s.label}>Categoría</Text>
          <View style={s.chips}>
            <Chip texto="Todas" on={!categoria} onPress={() => setCategoria(undefined)} />
            {datos?.categorias.map(c => <Chip key={c.id} texto={c.nombre} on={categoria === c.id} onPress={() => setCategoria(c.id)} />)}
          </View>
          <Text style={s.label}>Fábrica de origen</Text>
          <View style={s.chips}>
            <Chip texto="Todas" on={!fabrica} onPress={() => setFabrica(undefined)} />
            {datos?.fabricas.map(f => <Chip key={f.id} texto={`${f.nombre} · ${f.pais}`} on={fabrica === f.id} onPress={() => setFabrica(f.id)} />)}
          </View>
          <Boton title="Ver productos" onPress={() => setFiltros(false)} style={{ marginTop: 10 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  titulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy },
  h2: { fontFamily: fonts.title, fontSize: 21, color: colors.navy },
  buscar: { height: 50, borderRadius: 16, backgroundColor: colors.white, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: colors.line },
  buscarIn: { flex: 1, fontFamily: fonts.regular, fontSize: 14.5, color: colors.ink },
  card: { flex: 1, maxWidth: '50%', backgroundColor: colors.white, borderRadius: 22, padding: 10, gap: 3 },
  etiqueta: { position: 'absolute', top: 18, left: 18, backgroundColor: colors.white, color: colors.navy, fontFamily: fonts.bold, fontSize: 10.5, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99, overflow: 'hidden' },
  marca: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.navyLight, letterSpacing: 0.7, textTransform: 'uppercase', marginTop: 6 },
  nombre: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, lineHeight: 17, minHeight: 34 },
  precio: { fontFamily: fonts.title, fontSize: 16, color: colors.navy },
  desde: { fontFamily: fonts.regular, fontSize: 11, color: colors.ink3 },
  vacio: { fontFamily: fonts.regular, color: colors.ink2, textAlign: 'center', marginTop: 40, paddingHorizontal: 30 },
  fondo: { flex: 1, backgroundColor: 'rgba(13,27,54,0.4)' },
  hoja: { backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, gap: 10 },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
