import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import QRCode from 'qrcode';
import { colors } from '../lib/theme';

/** Dibuja un QR en SVG (sin imágenes ni red). Corrección de errores media: se lee bien en pantallas con brillo bajo. */
export function Qr({ value, size = 220 }: { value: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const n = qr.modules.size;
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
    return { d, n };
  }, [value]);
  const q = 2; // zona silenciosa
  return (
    <Svg width={size} height={size} viewBox={`${-q} ${-q} ${n + q * 2} ${n + q * 2}`} accessibilityLabel="Código QR de Mi Código">
      <Rect x={-q} y={-q} width={n + q * 2} height={n + q * 2} fill={colors.white} />
      <Path d={d} fill={colors.navyDark} />
    </Svg>
  );
}
