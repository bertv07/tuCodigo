import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarCheck, Truck, FileLock2, CircleCheck, Check, FilePen } from 'lucide-react-native';
import { Card, TopBar } from '../../../components/ds';
import { ProductoImg } from '../../../components/ProductoImg';
import { api } from '../../../lib/api';
import { usd, type Plan } from '../../../lib/catalogo';
import { colors, fonts } from '../../../lib/theme';

/** 12 · Confirma tu plan: resumen, cómo funciona y aceptación del contrato antes de revisarlo y firmarlo. */
export default function ResumenPlan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => { api<Plan>(`/v1/planes/${id}`, { auth: true }).then(setPlan).catch(e => setError(e.message)); }, [id]));

  if (!plan) return <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>{error ? <Text style={s.p}>{error}</Text> : <ActivityIndicator color={colors.navy} />}</SafeAreaView>;
  const { simulacion: m, producto } = plan.condiciones;
  const firmado = plan.estado !== 'PENDIENTE_FIRMA';
  const pasos = [
    { Icono: CalendarCheck, t: 'Pagas tus cuotas de la Etapa 1 a tu ritmo.' },
    { Icono: Truck, t: `Al completar el ${m.porcentajeEntrega} % recibes tu producto de fábrica.` },
    { Icono: FileLock2, t: `El ${100 - m.porcentajeEntrega} % restante lo pagas en la Etapa 2, con reserva de dominio.` },
    { Icono: CircleCheck, t: 'Precio de fábrica. Sin sobreprecios. Sin letras pequeñas.', verde: true },
  ];
  const dato = (k: string, v: string) => <View style={{ width: '50%', paddingVertical: 6 }}><Text style={s.dk}>{k}</Text><Text style={s.dv}>{v}</Text></View>;

  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Confirma tu plan" />
      <ScrollView contentContainerStyle={s.body}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
          <ProductoImg categoria={producto.categoria} nombre={producto.nombre} style={{ width: 52, height: 52 }} radio={14} />
          <View style={{ flex: 1 }}><Text style={s.prod} numberOfLines={2}>{producto.nombre}</Text><Text style={s.prodD}>{producto.marca} · {usd(m.precio)}</Text></View>
        </Card>
        <Card style={{ flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 12 }}>
          {dato(`Etapa 1 (${m.porcentajeEntrega} %)`, `${usd(m.etapa1.total)} · ${m.etapa1.meses} cuotas`)}
          {dato(`Etapa 2 (${100 - m.porcentajeEntrega} %)`, `${usd(m.etapa2.total)} · ${m.etapa2.meses} cuotas`)}
          {dato('Cuota mensual', m.etapa1.cuota === m.etapa2.cuota ? usd(m.etapa1.cuota, true) : `${usd(m.etapa1.cuota, true)} / ${usd(m.etapa2.cuota, true)}`)}
          {dato('Para activar', usd(m.activacion, true))}
        </Card>
        <Card style={{ gap: 10 }}>
          <Text style={s.h3}>Así funciona tu compra programada</Text>
          {pasos.map((x, i) => <View key={i} style={s.paso}><x.Icono size={17} color={x.verde ? colors.green : colors.navy} strokeWidth={1.9} /><Text style={s.pasoT}>{x.t}</Text></View>)}
        </Card>
        {!firmado && (
          <Pressable onPress={() => setAcepto(!acepto)} style={s.check} accessibilityRole="checkbox" accessibilityState={{ checked: acepto }}>
            <View style={[s.box, acepto && s.boxOn]}>{acepto && <Check size={14} color={colors.white} strokeWidth={3} />}</View>
            <Text style={s.checkT}>Leí y acepto el Contrato de Compraventa Programada con Reserva de Dominio.</Text>
          </Pressable>
        )}
        <Text style={s.nota}>Entrega estimada: {producto.entregaEstimada}. La activación se paga en la taquilla del Centro Empresarial 8 de Mayo.</Text>
      </ScrollView>
      <View style={s.bottom}>
        {firmado ? (
          <Pressable style={s.btn} onPress={() => router.replace('/mis-planes')}><Text style={s.btnT}>Ver Mis Planes</Text></Pressable>
        ) : (
          <Pressable style={[s.btn, !acepto && { opacity: 0.45 }]} disabled={!acepto} onPress={() => router.push(`/plan/${plan.id}/contrato`)} accessibilityRole="button">
            <FilePen size={20} color={colors.white} /><Text style={s.btnT}>Revisar y firmar contrato</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 12 },
  prod: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  prodD: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: 2 },
  dk: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  dv: { fontFamily: fonts.title, fontSize: 16, color: colors.navy, marginTop: 2 },
  h3: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  paso: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  pasoT: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.ink2, lineHeight: 19 },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 2 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.ink3, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkT: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.ink2, lineHeight: 19 },
  nota: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 18, paddingHorizontal: 2 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2 },
  bottom: { padding: 20, paddingTop: 8 },
  btn: { height: 56, borderRadius: 18, backgroundColor: colors.navy, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  btnT: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
