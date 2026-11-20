import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable, Modal } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScanLine, MapPin, X } from 'lucide-react-native';
import { Boton, Logo } from '../components/ui';
import { TopBar, Hero, IconBtn } from '../components/ds';
import { api, ApiError } from '../lib/api';
import { colors, fonts } from '../lib/theme';

type T = { codigo: string | null; nombre: string; serial: string | null; formato: string };

/** 17 · Mi tarjeta fundadora: vincula el serial de la tarjeta PVC preimpresa a tu código (escribiéndolo o escaneándolo). */
export default function MiTarjeta() {
  const [t, setT] = useState<T | null>(null);
  const [serial, setSerial] = useState('');
  const [escanear, setEscanear] = useState(false);
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  useFocusEffect(useCallback(() => { api<T>('/v1/cuenta/tarjeta', { auth: true }).then(setT).catch(e => setError(e.message)); }, []));

  async function vincular() {
    setError(''); setOk(''); setCargando(true);
    try { const r = await api<{ serial: string }>('/v1/cuenta/tarjeta', { method: 'POST', auth: true, body: { serial } }); setT(x => x && { ...x, serial: r.serial }); setOk('¡Listo! Tu tarjeta quedó vinculada a tu código.'); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }
  async function abrirEscaner() { if (!permiso?.granted) { const r = await pedirPermiso(); if (!r.granted) return; } setEscanear(true); }

  const pvc = t?.serial?.replace(/^([A-Z]+)-\d{2}-/, '$1 ') ?? 'PVC ······';
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Mi tarjeta" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Hero style={s.tarjeta}>
            <View style={s.entre}><Logo size={30} dark /><Text style={s.fundador}>FUNDADOR</Text></View>
            <View style={s.chip} />
            <Text style={s.codigo}>{t?.codigo ?? 'TC-SUC-··-·····'}</Text>
            <View style={s.entre}><Text style={s.nombre}>{(t?.nombre ?? '').toUpperCase()}</Text><Text style={s.nombre}>{pvc}</Text></View>
          </Hero>
          {t?.serial ? (
            <Text style={s.p}>Tu tarjeta <Text style={s.fuerte}>{t.serial}</Text> está vinculada a tu código. Para cambiarla, acércate a una taquilla.</Text>
          ) : (
            <>
              <Text style={s.p}>Escribe o escanea el serial que viene al reverso de tu tarjeta física.</Text>
              <Text style={s.label}>Serial de la tarjeta</Text>
              <View style={s.input}>
                <TextInput value={serial} onChangeText={v => setSerial(v.toUpperCase())} placeholder={t?.formato ?? 'PVC-26-004817'} placeholderTextColor={colors.ink3} autoCapitalize="characters" autoCorrect={false} maxLength={30} style={s.textInput} accessibilityLabel="Serial de la tarjeta" />
                <Pressable onPress={abrirEscaner} hitSlop={8} accessibilityRole="button" accessibilityLabel="Escanear el serial"><ScanLine size={20} color={colors.navy} /></Pressable>
              </View>
            </>
          )}
          <View style={s.info}><MapPin size={18} color={colors.ink3} /><Text style={s.infoT}>Retira tu tarjeta en las taquillas del Centro Empresarial 8 de Mayo, Cumaná.</Text></View>
          {!!error && <Text style={s.error}>{error}</Text>}
          {!!ok && <Text style={s.ok}>{ok}</Text>}
        </ScrollView>
        <View style={s.bottom}>
          {t?.serial ? <Boton title="Volver" variant="ghost" onPress={() => router.back()} /> : <Boton title="Vincular tarjeta" onPress={vincular} loading={cargando} disabled={serial.length < 6} />}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={escanear} animationType="slide" onRequestClose={() => setEscanear(false)}>
        <View style={{ flex: 1, backgroundColor: colors.camara }}>
          <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
            onBarcodeScanned={({ data }) => { setEscanear(false); setSerial(String(data).toUpperCase().slice(0, 30)); }} />
          <SafeAreaView style={{ padding: 20 }}><IconBtn Icono={X} glass label="Cerrar" onPress={() => setEscanear(false)} /></SafeAreaView>
          <View style={s.mira} pointerEvents="none" />
          <Text style={s.miraT}>Apunta al código del reverso de tu tarjeta</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 12 },
  tarjeta: { gap: 12, paddingVertical: 20 },
  entre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fundador: { fontFamily: fonts.bold, fontSize: 11, color: colors.goldLight, letterSpacing: 1 },
  chip: { width: 40, height: 30, borderRadius: 7, backgroundColor: '#D9B865' },
  codigo: { fontFamily: 'Menlo', fontSize: 20, color: colors.white, letterSpacing: 1.5 },
  nombre: { fontFamily: fonts.semibold, fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.6 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  fuerte: { fontFamily: fonts.bold, color: colors.ink },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
  textInput: { flex: 1, fontFamily: 'Menlo', fontSize: 15, color: colors.ink },
  info: { flexDirection: 'row', gap: 10, backgroundColor: colors.white, borderRadius: 18, padding: 14, alignItems: 'center' },
  infoT: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 17 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  ok: { fontFamily: fonts.semibold, color: colors.green, fontSize: 13 },
  bottom: { padding: 20 },
  mira: { position: 'absolute', top: '35%', alignSelf: 'center', width: 260, height: 160, borderRadius: 18, borderWidth: 3, borderColor: colors.gold },
  miraT: { position: 'absolute', bottom: 80, alignSelf: 'center', fontFamily: fonts.semibold, color: colors.white, fontSize: 14 },
});
