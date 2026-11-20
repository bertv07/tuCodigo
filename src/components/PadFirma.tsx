import { useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, sombra } from '../lib/theme';

export type Trazos = number[][][];
export type FirmaDibujada = { ancho: number; alto: number; trazos: Trazos };

/** Recuadro para firmar con el dedo (pantalla 14). Los trazos se guardan como puntos y se dibujan en el PDF como vector. */
export function PadFirma({ onCambio, nombre }: { onCambio: (f: FirmaDibujada | null) => void; nombre?: string }) {
  const [trazos, setTrazos] = useState<Trazos>([]);
  const tam = useRef({ ancho: 1, alto: 1 });
  const actual = useRef<number[][]>([]);
  const [, forzar] = useState(0);

  const punto = (x: number, y: number) => [Math.round(Math.min(Math.max(x, 0), tam.current.ancho)), Math.round(Math.min(Math.max(y, 0), tam.current.alto))];
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { actual.current = [punto(e.nativeEvent.locationX, e.nativeEvent.locationY)]; forzar(n => n + 1); },
    onPanResponderMove: e => {
      const p = punto(e.nativeEvent.locationX, e.nativeEvent.locationY), u = actual.current[actual.current.length - 1];
      if (!u || Math.hypot(p[0] - u[0], p[1] - u[1]) >= 2) { actual.current.push(p); forzar(n => n + 1); }
    },
    onPanResponderRelease: () => {
      const t = actual.current; actual.current = [];
      if (!t.length) return;
      setTrazos(prev => { const nuevo = [...prev, t].slice(-60); onCambio({ ...tam.current, trazos: nuevo }); return nuevo; });
    },
  })).current;

  const d = (t: number[][]) => t.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + (t.length === 1 ? ' l0.5 0.5' : '');
  const borrar = () => { setTrazos([]); onCambio(null); };
  return (
    <View style={[s.card, sombra]}>
      <Pressable onPress={borrar} hitSlop={8} style={s.borrar} accessibilityRole="button"><Text style={s.borrarT}>Borrar</Text></Pressable>
      <View style={s.pad} onLayout={(e: LayoutChangeEvent) => { tam.current = { ancho: e.nativeEvent.layout.width, alto: e.nativeEvent.layout.height }; }} {...pan.panHandlers}
        accessibilityLabel="Recuadro para firmar con el dedo">
        <Svg style={StyleSheet.absoluteFill}>
          {[...trazos, actual.current].filter(t => t.length).map((t, i) => <Path key={i} d={d(t)} stroke={colors.navy} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
        </Svg>
        {!trazos.length && !actual.current.length && <Text style={s.guia} pointerEvents="none">Firma aquí</Text>}
      </View>
      <View style={s.linea} />
      {!!nombre && <Text style={s.nombre} numberOfLines={1}>{nombre}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 16, paddingTop: 12 },
  borrar: { alignSelf: 'flex-end' },
  borrarT: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  pad: { height: 130, alignItems: 'center', justifyContent: 'center' },
  guia: { fontFamily: fonts.semibold, color: colors.ink3, fontSize: 15 },
  linea: { height: 1, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line, marginHorizontal: 6 },
  nombre: { fontFamily: fonts.regular, fontSize: 11, color: colors.ink3, textAlign: 'center', marginTop: 8 },
});
