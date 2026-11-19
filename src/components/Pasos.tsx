import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useCanGoBack } from 'expo-router';
import { colors, fonts } from '../lib/theme';

/** Encabezado del registro: volver · "Crea tu código" · paso N de 4 + barra de progreso */
export function Pasos({ paso, total = 4, volver = true }: { paso: number; total?: number; volver?: boolean }) {
  const puedeVolver = useCanGoBack();
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {volver && puedeVolver
          ? <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Volver"><Text style={s.back}>‹</Text></Pressable>
          : <View style={{ width: 14 }} />}
        <Text style={s.title}>Crea tu código</Text>
        <Text style={s.count}>{paso} de {total}</Text>
      </View>
      <View style={s.bar}>{Array.from({ length: total }).map((_, i) => <View key={i} style={[s.seg, i < paso && s.on]} />)}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontFamily: fonts.bold, color: colors.navy, fontSize: 28, lineHeight: 30 },
  title: { fontFamily: fonts.bold, color: colors.ink, fontSize: 15 },
  count: { fontFamily: fonts.semibold, color: colors.ink3, fontSize: 13 },
  bar: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line },
  on: { backgroundColor: colors.navy },
});
