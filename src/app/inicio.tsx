import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, UserRound, LayoutGrid, Calculator, FileText, Scale, QrCode, TriangleAlert } from 'lucide-react-native';
import { Boton } from '../components/ui';
import { Card, Hero, IconBtn, Badge, TabBar, Av } from '../components/ds';
import { ProductoImg } from '../components/ProductoImg';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { irAlSiguientePaso } from '../lib/registro';
import { cargarCatalogo, usd, type Plan, type Tarjeta } from '../lib/catalogo';
import { colors, fonts } from '../lib/theme';

const AVISOS: Record<string, { titulo: string; texto: string; accion?: string }> = {
  REGISTRO_INCOMPLETO: { titulo: 'Completa tu registro', texto: 'Falta tu documento, la foto de tu cédula o tu selfie.', accion: 'Continuar registro' },
  EN_REVISION: { titulo: 'Estamos validando tus fotos', texto: 'Te avisamos por WhatsApp apenas el equipo apruebe tu identidad. Ya puedes ver el catálogo y mostrar Mi Código.' },
  CORRECCION: { titulo: 'Necesitamos un ajuste', texto: 'El equipo de validación te pidió corregir algo.', accion: 'Ver qué falta' },
  RECHAZADO: { titulo: 'No pudimos validar tu identidad', texto: 'Comunícate con soporte o acércate a una taquilla del Centro Empresarial 8 de Mayo.' },
};
const mesAnio = (d: Date) => d.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' }).replace('.', '').replace(/^\w/, c => c.toUpperCase());

/** 08 · Inicio */
export default function Inicio() {
  const { suscriptor, recargar } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [nuevos, setNuevos] = useState<Tarjeta[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const cargar = useCallback(async () => {
    await recargar();
    const [p, c, n] = await Promise.all([
      api<Plan[]>('/v1/planes', { auth: true }).catch(() => []),
      cargarCatalogo().catch(() => null),
      api<{ noLeidas: number }>('/v1/cuenta/notificaciones', { auth: true }).catch(() => ({ noLeidas: 0 })),
    ]);
    setPlan(p.find(x => x.contrato) ?? p.find(x => x.estado !== 'ANULADO') ?? null); setNuevos(c?.productos.slice(0, 8) ?? []); setNoLeidas(n.noLeidas);
  }, [recargar]);
  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));
  if (!suscriptor) return <Redirect href="/" />;

  const aviso = AVISOS[suscriptor.estado];
  const tieneCodigo = !!suscriptor.codigo && ['EN_REVISION', 'VERIFICADO'].includes(suscriptor.estado);
  const m = plan?.condiciones.simulacion;
  const entrega = plan && m ? mesAnio(new Date(new Date(plan.contrato?.firmadoEn ?? plan.creado).setMonth(new Date(plan.contrato?.firmadoEn ?? plan.creado).getMonth() + m.etapa1.meses))) : null;
  const acciones = [
    { Icono: LayoutGrid, t: 'Catálogo', f: () => router.replace('/catalogo') },
    { Icono: Calculator, t: 'Simulador', f: () => (plan ? router.push({ pathname: '/plan/simular', params: { productoId: plan.condiciones.producto.id } }) : router.replace('/catalogo')) },
    { Icono: FileText, t: 'Contrato', f: () => router.push('/perfil/contratos') },
    { Icono: Scale, t: 'Asistencia', f: () => router.push('/perfil/asistencia'), oro: true },
  ];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body} refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}>
        <View style={s.saludo}>
          <View style={s.avatar}><UserRound size={22} color={colors.navy} /></View>
          <View style={{ flex: 1 }}><Text style={s.hola}>Hola,</Text><Text style={s.nombre}>{suscriptor.nombres ?? 'Bienvenido'}</Text></View>
          <IconBtn Icono={Bell} label="Notificaciones" onPress={() => router.push('/notificaciones')} badge={noLeidas > 0} />
        </View>

        {plan && m ? (
          <Hero style={{ gap: 6 }}>
            <View style={s.entre}><Text style={s.hSmall}>Mi plan activo</Text><Badge texto="Etapa 1" tono="gold" /></View>
            <Text style={s.hSmall}>{plan.condiciones.producto.nombre} · {plan.condiciones.producto.marca}</Text>
            <Text style={s.monto}>{usd(m.etapa1.cuota, true)}<Text style={s.mes}> / mes</Text></Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={s.caja}><Text style={s.cajaK}>Cuotas Etapa 1</Text><Text style={s.cajaV}>{m.etapa1.meses}</Text></View>
              <View style={s.caja}><Text style={s.cajaK}>Entrega estimada</Text><Text style={s.cajaV}>{entrega}</Text></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Pressable style={s.btnBlanco} onPress={() => router.replace('/mis-planes')}><Text style={s.btnBlancoT}>Ver mi plan</Text></Pressable>
              <Pressable style={s.btnGlass} onPress={() => router.push('/mi-codigo')}><QrCode size={18} color={colors.white} /><Text style={s.btnGlassT}>Mi Código</Text></Pressable>
            </View>
          </Hero>
        ) : (
          <Hero style={{ gap: 6 }}>
            <Text style={s.hSmall}>Tu Código Directo</Text>
            <Text style={s.codigo}>{suscriptor.codigo ?? 'Se asigna al completar el registro'}</Text>
            <Text style={s.hSmall}>{suscriptor.estado === 'VERIFICADO' ? 'Identidad verificada ✓ · Elige tu producto y arma tu plan.' : 'Precio de fábrica · Sin sobreprecios'}</Text>
            {tieneCodigo && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Pressable style={s.btnBlanco} onPress={() => router.replace('/catalogo')}><Text style={s.btnBlancoT}>Elegir producto</Text></Pressable>
                <Pressable style={s.btnGlass} onPress={() => router.push('/mi-codigo')}><QrCode size={18} color={colors.white} /><Text style={s.btnGlassT}>Mi Código</Text></Pressable>
              </View>
            )}
          </Hero>
        )}

        {aviso && (
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Av Icono={TriangleAlert} tono="gold" size={36} /><Text style={s.h3}>{aviso.titulo}</Text></View>
            <Text style={s.p}>{aviso.texto}</Text>
            {aviso.accion && <Boton title={aviso.accion} onPress={() => irAlSiguientePaso(false)} style={{ marginTop: 6 }} />}
          </Card>
        )}

        <View style={s.acciones}>
          {acciones.map(a => (
            <Pressable key={a.t} onPress={a.f} style={s.accion} accessibilityRole="button" accessibilityLabel={a.t}>
              <View style={[s.accionIc, a.oro && { backgroundColor: colors.gold50 }]}><a.Icono size={20} color={a.oro ? colors.goldText : colors.navy} strokeWidth={1.8} /></View>
              <Text style={s.accionT}>{a.t}</Text>
            </Pressable>
          ))}
        </View>

        {nuevos.length > 0 && (
          <>
            <View style={s.entre}><Text style={s.h3}>Recién llegados de fábrica</Text><Pressable onPress={() => router.replace('/catalogo')} hitSlop={8}><Text style={s.link}>Ver todo</Text></Pressable></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }} style={{ marginHorizontal: -20, paddingLeft: 20 }}>
              {nuevos.map(p => (
                <Pressable key={p.id} onPress={() => router.push(`/catalogo/${p.id}`)} style={s.mini} accessibilityRole="button" accessibilityLabel={p.nombre}>
                  <ProductoImg foto={p.foto} categoria={p.categoria} nombre={p.nombre} style={{ height: 92 }} radio={16} />
                  <Text style={s.miniN} numberOfLines={1}>{p.nombre}</Text>
                  <Text style={s.miniP}>{usd(p.precio)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 8, gap: 16, paddingBottom: 30 },
  saludo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  hola: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  nombre: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  entre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hSmall: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  monto: { fontFamily: fonts.title, fontSize: 38, color: colors.white },
  mes: { fontFamily: fonts.bold, fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  codigo: { fontFamily: fonts.title, fontSize: 24, color: colors.goldLight },
  caja: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12 },
  cajaK: { fontFamily: fonts.regular, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  cajaV: { fontFamily: fonts.title, fontSize: 16, color: colors.white, marginTop: 2 },
  btnBlanco: { height: 42, borderRadius: 14, backgroundColor: colors.white, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnBlancoT: { fontFamily: fonts.bold, fontSize: 14, color: colors.navy },
  btnGlass: { height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnGlassT: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  h3: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 20 },
  acciones: { flexDirection: 'row', justifyContent: 'space-between' },
  accion: { alignItems: 'center', gap: 6, width: 72 },
  accionIc: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  accionT: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.ink2 },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  mini: { width: 128, backgroundColor: colors.white, borderRadius: 20, padding: 8, gap: 3 },
  miniN: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.ink, marginTop: 4 },
  miniP: { fontFamily: fonts.title, fontSize: 14, color: colors.navy },
});
