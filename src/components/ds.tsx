/**
 * Componentes del diseño v2 (Figma «TU CÓDIGO · Diseño v2 (Fase 1)»): tarjetas, botones de ícono, chips,
 * insignias, selector segmentado, casillas OTP, filas de lista, tarjeta hero y barras de navegación.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type StyleProp, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useCanGoBack, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, X, House, LayoutGrid, QrCode, FileText, UserRound, UserPlus, ListChecks, type LucideIcon } from 'lucide-react-native';
import { colors, fonts, HERO, sombra } from '../lib/theme';

export function Card({ children, style, flat }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; flat?: boolean }) {
  return <View style={[s.card, flat ? s.flat : sombra, style]}>{children}</View>;
}

/** Botón cuadrado blanco 42×42 con ícono (volver, campana, compartir…) */
export function IconBtn({ Icono, onPress, glass, label, badge }: { Icono: LucideIcon; onPress?: () => void; glass?: boolean; label: string; badge?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.iconbtn, glass ? s.glass : sombra, pressed && { opacity: 0.8 }]}>
      <Icono size={20} color={glass ? colors.white : colors.navy} strokeWidth={2} />
      {badge && <View style={s.dotBadge} />}
    </Pressable>
  );
}

/** Encabezado de pantalla: botón volver (o cerrar) + título + texto a la derecha */
export function TopBar({ titulo, derecha, cerrar, dark, onBack, children }: { titulo?: string; derecha?: React.ReactNode; cerrar?: boolean; dark?: boolean; onBack?: () => void; children?: React.ReactNode }) {
  const puede = useCanGoBack();
  const volver = onBack ?? (() => (puede ? router.back() : router.replace('/')));
  return (
    <View style={s.topbar}>
      <IconBtn Icono={cerrar ? X : ChevronLeft} onPress={volver} glass={dark} label={cerrar ? 'Cerrar' : 'Volver'} />
      {titulo ? <Text style={[s.topTitle, dark && { color: colors.white }]} numberOfLines={1}>{titulo}</Text> : <View style={{ flex: 1 }} />}
      {children}
      {typeof derecha === 'string' ? <Text style={[s.topRight, dark && { color: 'rgba(255,255,255,0.6)' }]}>{derecha}</Text> : derecha}
    </View>
  );
}

/** Barra de pasos del registro: «Crea tu código · N de 4» */
export function Pasos({ paso, total = 4, dark, cerrar, onBack, titulo = 'Crea tu código' }: { paso: number; total?: number; dark?: boolean; cerrar?: boolean; onBack?: () => void; titulo?: string }) {
  return (
    <View>
      <TopBar titulo={titulo} derecha={`${paso} de ${total}`} dark={dark} cerrar={cerrar} onBack={onBack} />
      <View style={s.steps}>{Array.from({ length: total }).map((_, i) => <View key={i} style={[s.step, dark && { backgroundColor: 'rgba(255,255,255,0.18)' }, i < paso && { backgroundColor: dark ? colors.gold : colors.navy }]} />)}</View>
    </View>
  );
}

export function Hero({ children, style, aros = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; aros?: boolean }) {
  return (
    <LinearGradient colors={HERO} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[s.hero, style]}>
      {aros && <View style={s.aro} pointerEvents="none" />}
      {children}
    </LinearGradient>
  );
}

type Tono = 'ok' | 'warn' | 'bad' | 'info' | 'navy' | 'gold';
const TONOS: Record<Tono, [string, string]> = {
  ok: [colors.green50, colors.green], warn: [colors.amber50, colors.amberText], bad: [colors.red50, colors.red],
  info: [colors.blue50, colors.blue], navy: [colors.navy50, colors.navy], gold: ['rgba(193,154,62,0.18)', colors.goldLight],
};
export function Badge({ texto, tono = 'navy', style }: { texto: string; tono?: Tono; style?: StyleProp<ViewStyle> }) {
  const [bg, fg] = TONOS[tono];
  return <View style={[s.badge, { backgroundColor: bg }, style]}><Text style={[s.badgeT, { color: fg }]}>{texto}</Text></View>;
}

export function Chip({ texto, on, onPress, style }: { texto: string; on?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!on }} style={[s.chip, on && s.chipOn, style]}>
      <Text style={[s.chipT, on && { color: colors.white }]} numberOfLines={1}>{texto}</Text>
    </Pressable>
  );
}

export function Seg<T extends string>({ opciones, valor, onCambio }: { opciones: { v: T; t: string }[]; valor: T; onCambio: (v: T) => void }) {
  return (
    <View style={s.seg} accessibilityRole="radiogroup">
      {opciones.map(o => (
        <Pressable key={o.v} onPress={() => onCambio(o.v)} style={[s.segItem, valor === o.v && s.segOn]} accessibilityRole="radio" accessibilityState={{ checked: valor === o.v }}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[s.segT, valor === o.v && { color: colors.white }]}>{o.t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Seis casillas del código OTP (el campo real es invisible y recibe el autocompletado del SMS) */
export function OtpBoxes({ valor, onPress }: { valor: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.otp} accessibilityLabel="Código de verificación">
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[s.otpBox, i === Math.min(valor.length, 5) && s.otpOn]}><Text style={s.otpT}>{valor[i] ?? ''}</Text></View>
      ))}
    </Pressable>
  );
}

/** Ícono en cuadrito redondeado (filas de lista) */
export function Av({ Icono, tono = 'navy', size = 44 }: { Icono: LucideIcon; tono?: 'navy' | 'gold' | 'green' | 'red' | 'blue' | 'dk'; size?: number }) {
  const t = { navy: [colors.navy50, colors.navy], gold: [colors.gold50, colors.goldText], green: [colors.green50, colors.green], red: [colors.red50, colors.red], blue: [colors.blue50, colors.blue], dk: [colors.navy, colors.gold] }[tono];
  return <View style={[s.av, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: t[0] }]}><Icono size={size * 0.45} color={t[1]} strokeWidth={1.9} /></View>;
}

export function Li({ Icono, tono, titulo, sub, derecha, onPress, ultimo, tituloStyle }: { Icono?: LucideIcon; tono?: Parameters<typeof Av>[0]['tono']; titulo: string; sub?: string; derecha?: React.ReactNode; onPress?: () => void; ultimo?: boolean; tituloStyle?: StyleProp<TextStyle> }) {
  const C = onPress ? Pressable : View;
  return (
    <C onPress={onPress} style={[s.li, ultimo && { borderBottomWidth: 0 }]} accessibilityRole={onPress ? 'button' : undefined}>
      {Icono && <Av Icono={Icono} tono={tono} />}
      <View style={{ flex: 1 }}>
        <Text style={[s.liT, tituloStyle]}>{titulo}</Text>
        {!!sub && <Text style={s.liS}>{sub}</Text>}
      </View>
      {derecha}
    </C>
  );
}

/** Barra inferior: suscriptor (Inicio · Catálogo · Mi Código · Mis Planes · Perfil) o promotor */
const SETS = {
  cliente: [[House, 'Inicio', '/inicio'], [LayoutGrid, 'Catálogo', '/catalogo'], [QrCode, 'Mi Código', '/mi-codigo'], [FileText, 'Mis Planes', '/mis-planes'], [UserRound, 'Perfil', '/perfil']],
  promotor: [[House, 'Estación', '/promotor'], [UserPlus, 'Registrar', '/promotor/registrar'], [QrCode, 'Escanear', '/promotor/escanear'], [ListChecks, 'Registros', '/promotor/registros'], [UserRound, 'Perfil', '/promotor/perfil']],
} as const;
export function TabBar({ set = 'cliente' }: { set?: keyof typeof SETS }) {
  const actual = usePathname();
  const ins = useSafeAreaInsets();
  return (
    <View style={[s.tabbar, { paddingBottom: Math.max(ins.bottom, 10) }]}>
      {SETS[set].map(([Icono, t, ruta], i) => {
        const on = ruta === '/promotor' ? actual === '/promotor' : actual === ruta || actual.startsWith(`${ruta}/`);
        const ir = () => { if (!on) (i === 2 || set === 'promotor' ? router.push : router.replace)(ruta as never); };
        if (i === 2) return (
          <Pressable key={ruta} onPress={ir} style={s.tab} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: on }}>
            <View style={s.qr}><Icono size={26} color={colors.gold} strokeWidth={2} /></View>
            <Text style={[s.tabT, on && s.tabOn]}>{t}</Text>
          </Pressable>
        );
        return (
          <Pressable key={ruta} onPress={ir} style={s.tab} accessibilityRole="tab" accessibilityLabel={t} accessibilityState={{ selected: on }}>
            <Icono size={23} color={on ? colors.navy : colors.ink3} strokeWidth={on ? 2.1 : 1.8} />
            <Text style={[s.tabT, on && s.tabOn]}>{t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ on, onCambio, label }: { on: boolean; onCambio: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => onCambio(!on)} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} hitSlop={8}
      style={[s.toggle, !on && { backgroundColor: '#D1D7E2' }]}>
      <View style={[s.knob, on ? { right: 3 } : { left: 3 }]} />
    </Pressable>
  );
}

export const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 18 },
  flat: { borderWidth: 1, borderColor: colors.line },
  iconbtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  glass: { backgroundColor: 'rgba(255,255,255,0.12)' },
  dotBadge: { position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: colors.white },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  topTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.ink },
  topRight: { fontFamily: fonts.semibold, fontSize: 12, color: colors.ink3 },
  steps: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 6 },
  step: { flex: 1, height: 5, borderRadius: 5, backgroundColor: colors.line },
  hero: { borderRadius: 30, padding: 22, overflow: 'hidden' },
  aro: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 22, borderColor: 'rgba(193,154,62,0.20)', top: -90, right: -70 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  badgeT: { fontFamily: fonts.bold, fontSize: 11 },
  chip: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: 99, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipT: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink2 },
  seg: { flexDirection: 'row', backgroundColor: colors.seg, borderRadius: 16, padding: 4, gap: 4 },
  segItem: { flex: 1, minWidth: 0, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  segOn: { backgroundColor: colors.navy },
  segT: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink2 },
  otp: { flexDirection: 'row', gap: 8 },
  otpBox: { flex: 1, height: 60, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  otpOn: { borderColor: colors.navy, shadowColor: colors.navy, shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  otpT: { fontFamily: fonts.title, fontSize: 24, color: colors.navy },
  av: { alignItems: 'center', justifyContent: 'center' },
  li: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  liT: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  liS: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: 2 },
  tabbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  tab: { alignItems: 'center', gap: 4, width: 66 },
  tabT: { fontFamily: fonts.semibold, fontSize: 11, color: colors.ink3 },
  tabOn: { color: colors.navy, fontFamily: fonts.bold },
  qr: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', marginTop: -32, borderWidth: 4, borderColor: colors.white, shadowColor: colors.navy, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  toggle: { width: 42, height: 24, borderRadius: 99, backgroundColor: colors.navy, justifyContent: 'center' },
  knob: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.white },
});
