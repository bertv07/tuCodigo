import React from 'react';
import { Pressable, Text, View, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { colors, fonts } from '../lib/theme';

/** Símbolo oficial: arco dorado + llave (azul sobre claro, blanco sobre oscuro). No se deforma ni cambia de color. */
export function Simbolo({ size = 48, dark = false }: { size?: number; dark?: boolean }) {
  const key = dark ? colors.white : colors.navy;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="TU CÓDIGO">
      <Path d="M 80 24 A 37 37 0 1 0 80 76" fill="none" stroke={colors.gold} strokeWidth={15} />
      <Line x1={52} y1={50} x2={98} y2={50} stroke={key} strokeWidth={13} />
      <Circle cx={48} cy={50} r={11} fill={key} />
    </Svg>
  );
}

export function Logo({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  const c = dark ? colors.white : colors.navy;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Simbolo size={size} dark={dark} />
      <View>
        <Text style={{ fontFamily: fonts.title, color: c, fontSize: size * 0.27, letterSpacing: size * 0.09 }}>TU</Text>
        <Text style={{ fontFamily: fonts.title, color: c, fontSize: size * 0.62, lineHeight: size * 0.66 }}>CÓDIGO</Text>
      </View>
    </View>
  );
}

type BtnProps = { title: string; onPress: () => void; variant?: 'navy' | 'gold' | 'glass' | 'ghost'; loading?: boolean; disabled?: boolean; style?: ViewStyle };
export function Boton({ title, onPress, variant = 'navy', loading, disabled, style }: BtnProps) {
  const bg = { navy: colors.navy, gold: colors.gold, glass: 'rgba(255,255,255,0.12)', ghost: 'transparent' }[variant];
  const fg = variant === 'gold' ? colors.navyDark : variant === 'ghost' ? colors.navy : colors.white;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, variant === 'ghost' && s.ghost, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  ghost: { borderWidth: 1.5, borderColor: '#DCE3F0' },
  btnText: { fontFamily: fonts.bold, fontSize: 16 },
});
