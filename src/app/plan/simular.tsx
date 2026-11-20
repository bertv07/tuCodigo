import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from '../../components/ui';
import { Card, Chip, Hero, TopBar } from '../../components/ds';
import { useAuth } from '../../lib/auth';
import { api, ApiError } from '../../lib/api';
import { cargarProducto, simular, usd, bs, type Producto, type Simulacion, type Plan } from '../../lib/catalogo';
import { colors, fonts } from '../../lib/theme';

const preferido = (l: number[]) => (l.includes(12) ? 12 : l[0]);

/** 11 · Simulador de planes: plazos de cada etapa y desglose (Registro / Tarjeta, Cuota 1 y cuotas). */
export default function Simulador() {
  const { productoId } = useLocalSearchParams<{ productoId: string }>();
  const { suscriptor } = useAuth();
  const [p, setP] = useState<Producto | null>(null);
  const [e1, setE1] = useState(0), [e2, setE2] = useState(0);
  const [sim, setSim] = useState<Simulacion | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarProducto(productoId).then(x => { setP(x); setE1(preferido(x.plazos.etapa1)); setE2(preferido(x.plazos.etapa2)); }).catch(e => setError(e.message)); }, [productoId]);
  useEffect(() => {
    if (!p || !e1 || !e2) return;
    let vigente = true;
    simular(p.id, e1, e2).then(r => vigente && setSim(r)).catch(e => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [p, e1, e2]);

  async function continuar() {
    setError('');
    if (!suscriptor) { router.push('/acceso/cedula'); return; }
    if (suscriptor.estado !== 'VERIFICADO') { setError('Podrás confirmar tu plan cuando el equipo verifique tu identidad. Te avisamos por WhatsApp.'); return; }
    setGuardando(true);
    try {
      const plan = await api<Plan>('/v1/planes', { method: 'POST', auth: true, body: { productoId: p!.id, etapa1: e1, etapa2: e2 } });
      router.push(`/plan/${plan.id}`);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setGuardando(false); }
  }

  if (!p) return <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>{error ? <Text style={s.p}>{error}</Text> : <ActivityIndicator color={colors.navy} />}</SafeAreaView>;
  const plazos = (lista: number[], v: number, set: (n: number) => void) => (
    <View style={s.plazos}>
      {lista.map(n => <Chip key={n} texto={String(n)} on={v === n} onPress={() => set(n)} style={s.plazo} />)}
      <Text style={s.meses}>meses</Text>
    </View>
  );
  const iguales = sim && sim.etapa1.cuota === sim.etapa2.cuota;
  const fila = (k: string, d: string | null, v: string, ultimo = false) => (
    <View style={[s.fila, ultimo && { borderBottomWidth: 0 }]}><View style={{ flex: 1 }}><Text style={s.k}>{k}</Text>{d && <Text style={s.kd}>{d}</Text>}</View><Text style={s.v}>{v}</Text></View>
  );

  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Arma tu plan" />
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.lbl}>Etapa 1 · completa el {p.porcentajeEntrega} % en</Text>
        {plazos(p.plazos.etapa1, e1, setE1)}
        <Text style={s.lbl}>Etapa 2 · paga el {100 - p.porcentajeEntrega} % restante en</Text>
        {plazos(p.plazos.etapa2, e2, setE2)}
        {sim && (
          <>
            <Hero style={{ gap: 4 }}>
              <Text style={s.heroK}>{iguales ? 'Tu cuota mensual' : 'Tus cuotas mensuales'}</Text>
              {iguales ? <Text style={s.heroV}>{usd(sim.etapa1.cuota, true)}<Text style={s.heroM}> / mes</Text></Text> : (
                <View style={{ flexDirection: 'row', gap: 22 }}>
                  <View><Text style={s.heroE}>Etapa 1</Text><Text style={[s.heroV, { fontSize: 28 }]}>{usd(sim.etapa1.cuota, true)}</Text></View>
                  <View><Text style={s.heroE}>Etapa 2</Text><Text style={[s.heroV, { fontSize: 28 }]}>{usd(sim.etapa2.cuota, true)}</Text></View>
                </View>
              )}
              {bs(sim.etapa1.cuota, sim.tasaBcv) && <Text style={s.heroBs}>{bs(sim.etapa1.cuota, sim.tasaBcv)} a tasa BCV de hoy</Text>}
            </Hero>
            <Card style={{ paddingVertical: 4 }}>
              {fila('Cuota Única de Registro / Tarjeta Plástica', null, usd(sim.registro, true))}
              {fila('Cuota 1', 'Activa tu plan', usd(sim.cuota1, true))}
              {fila(`Etapa 1 · ${sim.etapa1.cuotasDespuesDeLaPrimera} cuotas más`, 'Al completarla recibes tu producto', usd(sim.etapa1.cuota, true))}
              {fila(`Etapa 2 · ${sim.etapa2.meses} cuotas`, 'Con reserva de dominio', usd(sim.etapa2.cuota, true), true)}
            </Card>
            <View style={s.activar}><Text style={s.activarK}>Para activar pagas</Text><Text style={s.activarV}>{usd(sim.activacion, true)}</Text></View>
            {(sim.etapa1.ultimaCuota !== sim.etapa1.cuota || sim.etapa2.ultimaCuota !== sim.etapa2.cuota) && <Text style={s.nota}>La última cuota de cada etapa ajusta los céntimos.</Text>}
          </>
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
      </ScrollView>
      <View style={s.bottom}><Boton title="Continuar" onPress={continuar} loading={guardando} disabled={!sim} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 12 },
  lbl: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink2 },
  plazos: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: -4 },
  plazo: { paddingHorizontal: 0, width: 50, alignItems: 'center' },
  meses: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  heroK: { fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  heroE: { fontFamily: fonts.semibold, color: colors.goldLight, fontSize: 12 },
  heroV: { fontFamily: fonts.title, color: colors.white, fontSize: 38 },
  heroM: { fontFamily: fonts.bold, fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  heroBs: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.72)', fontSize: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  k: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  kd: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  v: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  activar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  activarK: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  activarV: { fontFamily: fonts.title, fontSize: 22, color: colors.navy },
  nota: { fontFamily: fonts.regular, fontSize: 11, color: colors.ink3, paddingHorizontal: 4 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 20, paddingTop: 8 },
});
