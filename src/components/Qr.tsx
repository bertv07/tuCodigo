import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import QRCode from 'qrcode';
import { colors } from '../lib/theme';

/**
 * QR en SVG con el estilo del diseño 16: módulos azul marino, ojos con centro dorado y el símbolo en el medio.
 * Corrección de errores alta (H) para que el símbolo central no impida leerlo.
 */
export function Qr({ value, size = 220 }: { value: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'H' });
    const n = qr.modules.size;
    const ojo = (x: number, y: number) => x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7;
    const c0 = Math.floor(n / 2) - 3, c1 = Math.floor(n / 2) + 3;
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (ojo(x, y) || (x >= c0 && x <= c1 && y >= c0 && y <= c1)) continue;
      if (qr.modules.get(x, y)) d += `M${x + 0.08} ${y + 0.08}h0.84v0.84h-0.84z`;
    }
    return { d, n };
  }, [value]);
  const q = 1;
  const ojo = (x: number, y: number) => (
    <G key={`${x}-${y}`}>
      <Rect x={x} y={y} width={7} height={7} rx={1.8} fill={colors.navy} />
      <Rect x={x + 1} y={y + 1} width={5} height={5} rx={1.2} fill={colors.white} />
      {/* El centro del ojo debe leerse oscuro para los escáneres: azul con un acento dorado */}
      <Rect x={x + 2} y={y + 2} width={3} height={3} rx={0.9} fill={colors.navy} />
      <Rect x={x + 2.7} y={y + 2.7} width={1.6} height={1.6} rx={0.5} fill={colors.gold} />
    </G>
  );
  const c = n / 2;
  return (
    <View accessibilityLabel="Código QR de Mi Código">
      <Svg width={size} height={size} viewBox={`${-q} ${-q} ${n + q * 2} ${n + q * 2}`}>
        <Rect x={-q} y={-q} width={n + q * 2} height={n + q * 2} fill={colors.white} />
        <Path d={d} fill={colors.navy} />
        {ojo(0, 0)}{ojo(n - 7, 0)}{ojo(0, n - 7)}
        {/* Símbolo de TU CÓDIGO en el centro */}
        <G transform={`translate(${c - 3} ${c - 3}) scale(0.06)`}>
          <Path d="M 80 24 A 37 37 0 1 0 80 76" fill="none" stroke={colors.gold} strokeWidth={15} />
          <Path d="M52 50 L98 50" stroke={colors.navy} strokeWidth={13} />
          <Rect x={37} y={39} width={22} height={22} rx={11} fill={colors.navy} />
        </G>
      </Svg>
    </View>
  );
}
