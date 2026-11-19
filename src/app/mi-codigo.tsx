import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, AppState, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Qr } from '../components/Qr';
import { Boton } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { colors, fonts } from '../lib/theme';

type QrResp = { qr: string; venceEn: number; codigo: string; estado: string; nombre: string; documento: string | null };

/**
 * 16 · Mi Código: QR firmado por el servidor que cambia cada 60 s.
 * Una captura de pantalla deja de servir al minuto, y en Android las capturas quedan bloqueadas en esta pantalla.
 */
export default function MiCodigo() {
  usePreventScreenCapture();
  const [d, setD] = useState<QrResp | null>(null);
  const [resta, setResta] = useState(0);
  const [error, setError] = useState('');
  const vence = useRef(0);

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
    // Al volver a la app se pide un QR nuevo
    const sub = AppState.addEventListener('change', st => { if (st === 'active') cargar(); });
    return () => { clearInterval(t); sub.remove(); };
  }, [cargar]);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Volver"><Text style={s.back}>‹</Text></Pressable>
        <Text style={s.title}>Mi Código</Text>
        <View style={{ width: 14 }} />
      </View>
      <View style={s.body}>
        {d ? (
          <>
            <Text style={s.nombre}>{d.nombre}</Text>
            <Text style={s.doc}>{d.documento} · {d.estado === 'VERIFICADO' ? 'Verificada ✓' : 'En validación'}</Text>
            <View style={s.qrBox}><Qr value={d.qr} size={236} /></View>
            <Text style={s.codigo} selectable>{d.codigo}</Text>
            <View style={s.reloj}>
              <View style={[s.barra, { width: `${(resta / 60) * 100}%` }]} />
            </View>
            <Text style={s.small}>Se renueva en {resta} s · las capturas no sirven</Text>
          </>
        ) : error ? (
          <View style={{ gap: 14, alignItems: 'stretch', width: '100%' }}>
            <Text style={s.err}>{error}</Text>
            <Boton title="Reintentar" variant="gold" onPress={cargar} />
          </View>
        ) : <ActivityIndicator color={colors.gold} />}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  back: { fontFamily: fonts.bold, color: colors.white, fontSize: 28, lineHeight: 30 },
  title: { fontFamily: fonts.bold, color: colors.white, fontSize: 16 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  nombre: { fontFamily: fonts.title, color: colors.white, fontSize: 22 },
  doc: { fontFamily: fonts.semibold, color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  qrBox: { backgroundColor: colors.white, borderRadius: 28, padding: 18, marginVertical: 14, borderWidth: 3, borderColor: colors.gold },
  codigo: { fontFamily: fonts.title, color: colors.goldLight, fontSize: 22, letterSpacing: 0.5 },
  reloj: { width: 200, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginTop: 8 },
  barra: { height: 4, backgroundColor: colors.gold },
  small: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  err: { fontFamily: fonts.semibold, color: colors.white, fontSize: 15, textAlign: 'center' },
});
