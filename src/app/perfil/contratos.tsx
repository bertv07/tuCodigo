import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Download } from 'lucide-react-native';
import { Boton } from '../../components/ui';
import { Card, Li, TopBar } from '../../components/ds';
import { api } from '../../lib/api';
import { abrirContrato, type Plan } from '../../lib/catalogo';
import { colors, fonts } from '../../lib/theme';

/** Perfil · Mis contratos (PDF firmados) */
export default function Contratos() {
  const [planes, setPlanes] = useState<Plan[] | null>(null);
  const [abriendo, setAbriendo] = useState('');
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { api<Plan[]>('/v1/planes', { auth: true }).then(setPlanes).catch(() => setPlanes([])); }, []));
  const firmados = (planes ?? []).filter(p => p.contrato);
  async function abrir(p: Plan) { setAbriendo(p.id); try { await abrirContrato(p.id, p.contrato!.numero); } catch (e) { setError((e as Error).message); } finally { setAbriendo(''); } }
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Mis contratos" />
      <ScrollView contentContainerStyle={s.body}>
        {planes === null && <ActivityIndicator color={colors.navy} />}
        {planes && !firmados.length && (
          <Card style={{ gap: 8 }}>
            <Text style={s.p}>Aún no has firmado contratos. Elige un producto, arma tu plan y fírmalo desde la app.</Text>
            <Boton title="Ir al catálogo" onPress={() => router.replace('/catalogo')} />
          </Card>
        )}
        {!!firmados.length && (
          <Card style={{ paddingVertical: 4 }}>
            {firmados.map((p, i) => (
              <Li key={p.id} Icono={FileText} tono="red" titulo={p.contrato!.numero} sub={`${p.condiciones.producto.nombre} · ${new Date(p.contrato!.firmadoEn).toLocaleDateString('es-VE')}`}
                onPress={() => abrir(p)} derecha={abriendo === p.id ? <ActivityIndicator color={colors.navy} /> : <Download size={18} color={colors.navy} />} ultimo={i === firmados.length - 1} />
            ))}
          </Card>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 12 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 20 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
});
