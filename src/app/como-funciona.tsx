import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Factory, ShieldCheck, QrCode } from 'lucide-react-native';
import { Boton, Logo } from '../components/ui';
import { Hero } from '../components/ds';
import { api } from '../lib/api';
import { colors, fonts } from '../lib/theme';

type Tarjeta = { titulo: string; texto: string };
const INICIALES: Tarjeta[] = [
  { titulo: 'Elige, firma y recibe de fábrica', texto: 'Escoge tu producto, arma tu plan en cuotas y firma tu contrato desde el teléfono. Precio de fábrica, sin sobreprecios.' },
  { titulo: 'Completa el 50 % y recíbelo', texto: 'Pagas la Etapa 1 en 6 a 36 meses. Al completar el 50 % del precio recibes tu producto; el resto lo pagas en la Etapa 2.' },
  { titulo: 'Tu Código te identifica', texto: 'Con tu Código QR te atienden en la taquilla y tienes tu contrato y tus planes siempre a mano.' },
];

/** 02 · Cómo funciona: tres tarjetas antes de pedir datos (textos editables en la Torre). */
export default function ComoFunciona() {
  const { width } = useWindowDimensions();
  const [tarjetas, setTarjetas] = useState(INICIALES);
  const [i, setI] = useState(0);
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => { api<Record<string, unknown>>('/v1/publico/textos').then(t => Array.isArray(t['app.comoFunciona']) && setTarjetas(t['app.comoFunciona'] as Tarjeta[])).catch(() => {}); }, []);
  const siguiente = () => (i < tarjetas.length - 1 ? ref.current?.scrollTo({ x: (i + 1) * width, animated: true }) : router.replace('/registro/documento'));

  const visual = (n: number) => n === 0 ? (
    <Hero style={s.visual}>
      <View style={s.pill}><Text style={s.pillT}>Plan de compra programada</Text></View>
      <Text style={s.vSmall}>Nevera No Frost 14 pies · E·ÇEVIK</Text>
      <Text style={s.vMonto}>$690 <Text style={s.vUsd}>USD</Text></Text>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <View style={s.vCaja}><Text style={s.vCajaK}>Etapa 1 · 50 %</Text><Text style={s.vCajaV}>12 cuotas</Text><Text style={s.vCajaD}>y recibes tu nevera</Text></View>
        <View style={s.vCaja}><Text style={s.vCajaK}>Etapa 2 · 50 %</Text><Text style={s.vCajaV}>12 cuotas</Text><Text style={s.vCajaD}>con reserva de dominio</Text></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}><Factory size={15} color={colors.goldLight} /><Text style={s.vSmall}>Directo del Parque Industrial a tu casa</Text></View>
    </Hero>
  ) : (
    <Hero style={[s.visual, { alignItems: 'center', justifyContent: 'center' }]}>
      {n === 1 ? <ShieldCheck size={84} color={colors.goldLight} strokeWidth={1.4} /> : <QrCode size={84} color={colors.goldLight} strokeWidth={1.4} />}
    </Hero>
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.top}>
        <Logo size={30} />
        <Pressable onPress={() => router.replace('/registro/documento')} hitSlop={10} accessibilityRole="button"><Text style={s.saltar}>Saltar</Text></Pressable>
      </View>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={e => setI(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {tarjetas.map((t, n) => (
          <View key={n} style={{ width, paddingHorizontal: 20, gap: 18, paddingTop: 10 }}>
            {visual(n)}
            <Text style={s.h1}>{t.titulo}</Text>
            <Text style={s.p}>{t.texto}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={s.puntos}>{tarjetas.map((_, n) => <View key={n} style={[s.punto, n === i && s.puntoOn]} />)}</View>
      <View style={s.bottom}>
        <Pressable onPress={siguiente} style={s.btn} accessibilityRole="button">
          <Text style={s.btnT}>{i < tarjetas.length - 1 ? 'Siguiente' : 'Crear mi código'}</Text><ArrowRight size={20} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
  saltar: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  visual: { height: 300, gap: 8, padding: 20 },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(193,154,62,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  pillT: { fontFamily: fonts.bold, fontSize: 11, color: colors.goldLight },
  vSmall: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  vMonto: { fontFamily: fonts.title, fontSize: 38, color: colors.white },
  vUsd: { fontFamily: fonts.bold, fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  vCaja: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, gap: 2 },
  vCajaK: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  vCajaV: { fontFamily: fonts.title, fontSize: 17, color: colors.white },
  vCajaD: { fontFamily: fonts.regular, fontSize: 11, color: colors.goldLight },
  h1: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  puntos: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 6 },
  punto: { width: 7, height: 6, borderRadius: 3, backgroundColor: colors.line },
  puntoOn: { width: 24, backgroundColor: colors.navy },
  bottom: { padding: 20 },
  btn: { height: 56, borderRadius: 18, backgroundColor: colors.navy, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  btnT: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
