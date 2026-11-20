import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BedDouble, Smartphone, Refrigerator, House, AirVent, CookingPot, WashingMachine, Tv, Package } from 'lucide-react-native';
import { imgUrl } from '../lib/catalogo';
import { colors } from '../lib/theme';

/** Fondo e ícono por categoría cuando el producto aún no tiene foto (como en el diseño 09/10). */
function estilo(categoria = '', nombre = '') {
  const t = `${categoria} ${nombre}`.toLowerCase();
  if (/colch|cama/.test(t)) return { Icono: BedDouble, fondo: ['#FBF5E6', '#EEDDB3'] };
  if (/tel[eé]f|smart|celular/.test(t)) return { Icono: Smartphone, fondo: ['#E9F0FF', '#C9D8F5'] };
  if (/vivienda|casa/.test(t)) return { Icono: House, fondo: ['#EAF7F1', '#C7E9DA'] };
  if (/aire|climat/.test(t)) return { Icono: AirVent, fondo: ['#E9F0FF', '#C9D8F5'] };
  if (/cocina/.test(t)) return { Icono: CookingPot, fondo: ['#F1F4FA', '#DDE4F1'] };
  if (/lavadora/.test(t)) return { Icono: WashingMachine, fondo: ['#F1F4FA', '#DDE4F1'] };
  if (/tv|televis/.test(t)) return { Icono: Tv, fondo: ['#F1F4FA', '#DDE4F1'] };
  if (/nevera|blanca|refri/.test(t)) return { Icono: Refrigerator, fondo: ['#F1F4FA', '#DDE4F1'] };
  return { Icono: Package, fondo: ['#F1F4FA', '#DDE4F1'] };
}

export function ProductoImg({ foto, categoria, nombre, style, radio = 18, contain }: { foto?: string | null; categoria?: string; nombre?: string; style?: StyleProp<ViewStyle>; radio?: number; contain?: boolean }) {
  const { Icono, fondo } = estilo(categoria, nombre);
  return (
    <LinearGradient colors={fondo as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.base, { borderRadius: radio }, style]}>
      {foto
        ? <Image source={{ uri: imgUrl(foto) }} style={StyleSheet.absoluteFill} resizeMode={contain ? 'contain' : 'cover'} />
        : <View style={s.icono}><Icono size={44} color={colors.navy} strokeWidth={1.3} /></View>}
    </LinearGradient>
  );
}
const s = StyleSheet.create({ base: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, icono: { transform: [{ scale: 1 }] } });
