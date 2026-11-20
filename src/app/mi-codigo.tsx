import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreventScreenCapture } from 'expo-screen-capture';
import * as Brightness from 'expo-brightness';
import Svg, { Circle } from 'react-native-svg';
import { Sun, UserRound } from 'lucide-react-native';
import { Qr } from '../components/Qr';
import { IconBtn, TabBar } from '../components/ds';
import { Simbolo } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { colors, fonts, HERO } from '../lib/theme';

type QrResp = { qr: string; venceEn: number; codigo: string; estado: string; nombre: string; documento: string | null };

/**
 * 16 · Mi Código: QR firmado por el servidor que cambia cada 60 s (una captura deja de servir al minuto;
 * en Android las capturas están bloqueadas). El botón de sol sube el brillo para que el escáner lo lea mejor.
 */
export default function MiCodigo() {
  usePreventScreenCapture();
  const [d, setD] = useState<QrResp | null>(null);
  const [resta, setResta] = useState(0);
  const [error, setError] = useState('');
  const [brillo, setBrillo] = useState(false);
  const vence = useRef(0);
  const previo = useRef<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const r = await api<QrResp>('/v1/mi-codigo/qr', { auth: true });
      vence.current = Date.now() + r.venceEn * 1000; setD(r); setResta(r.venceEn); setError('');
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((vence.current - Date.now()) / 1000));
      setResta(s);
      if (s === 0 && vence.current) { vence.current = 0; cargar(); }
    }, 1000);
    const sub = AppState.addEventListener('change', st => { if (st === 'active') cargar(); });
    return () => { clearInterval(t); sub.remove(); };
  }, [cargar]);

  // Al salir de la pantalla se devuelve el brillo que tenía el teléfono
  useFocusEffect(useCallback(() => () => { if (previo.current !== null) { Brightness.setBrightnessAsync(previo.current).catch(() => {}); previo.current = null; setBrillo(false); } }, []));
  async function alternarBrillo() {
    try {
      if (!brillo) { previo.current = await Brightness.getBrightnessAsync(); await Brightness.setBrightnessAsync(1); setBrillo(true); }
      else { if (previo.current !== null) await Brightness.setBrightnessAsync(previo.current); previo.current = null; setBrillo(false); }
    } catch { /* sin permiso de brillo */ }
  }

  const R = 9, C = 2 * Math.PI * R;
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <StatusBar style="light" />
      <LinearGradient colors={HERO} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
        <View style={s.aro} pointerEvents="none" />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={s.top}><Text style={s.title}>Mi Código</Text><IconBtn Icono={Sun} glass label={brillo ? 'Bajar el brillo' : 'Subir el brillo al máximo'} onPress={alternarBrillo} /></View>
          <View style={s.body}>
            {d ? (
              <>
                <View style={s.persona}>
                  <View style={s.avatar}><UserRound size={26} color={colors.navy} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.nombre}>{d.nombre}</Text>
                    <Text style={s.doc}>{d.documento} · {d.estado === 'VERIFICADO' ? 'Verificada ✓' : 'En validación'}</Text>
                  </View>
                  <Simbolo size={26} dark />
                </View>
                <View style={s.qrBox}><Qr value={d.qr} size={196} /></View>
                <Text style={s.codigo} selectable>{d.codigo}</Text>
                <View style={s.reloj}>
                  <Svg width={22} height={22}><Circle cx={11} cy={11} r={R} stroke="rgba(255,255,255,0.18)" strokeWidth={3} fill="none" />
                    <Circle cx={11} cy={11} r={R} stroke={colors.gold} strokeWidth={3} fill="none" strokeDasharray={`${C}`} strokeDashoffset={C * (1 - resta / 60)} strokeLinecap="round" transform="rotate(-90 11 11)" /></Svg>
                  <Text style={s.relojT}>Se renueva en <Text style={{ fontFamily: fonts.bold, color: colors.white }}>{resta} s</Text> · las capturas no sirven</Text>
                </View>
              </>
            ) : error ? <Text style={s.error}>{error}</Text> : <ActivityIndicator color={colors.gold} />}
          </View>
        </SafeAreaView>
      </LinearGradient>
      <TabBar />
    </View>
  );
}

const s = StyleSheet.create({
  aro: { position: 'absolute', width: 340, height: 340, borderRadius: 170, borderWidth: 22, borderColor: 'rgba(255,255,255,0.07)', top: 330, left: -170 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  body: { flex: 1, paddingHorizontal: 20, alignItems: 'center', gap: 16, paddingTop: 6 },
  persona: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 12 },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  doc: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  qrBox: { backgroundColor: colors.white, borderRadius: 26, padding: 14 },
  codigo: { fontFamily: fonts.title, fontSize: 22, color: colors.goldLight, letterSpacing: 1 },
  reloj: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  relojT: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  error: { fontFamily: fonts.semibold, color: '#FFB4B4', fontSize: 14, textAlign: 'center', marginTop: 40 },
});
