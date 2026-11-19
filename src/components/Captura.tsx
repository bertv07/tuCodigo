import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton } from './ui';
import { Pasos } from './Pasos';
import { ApiError } from '../lib/api';
import { subirFoto } from '../lib/registro';
import { colors, fonts } from '../lib/theme';

type Props = {
  tipo: 'cedula' | 'selfie'; paso: number; titulo: string; ayuda: string;
  onListo: () => void | Promise<unknown>;
};

/** Reduce la foto a 1600 px como máximo y la guarda como JPEG (pesa ~300 KB; la orientación queda corregida). */
async function preparar(uri: string) {
  const img = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync();
  const r = await img.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return r.uri;
}

/** 05 · Foto de la cédula y 06 · Selfie: cámara con guía, vista previa y envío cifrado. */
export function Captura({ tipo, paso, titulo, ayuda, onListo }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const selfie = tipo === 'selfie';

  async function disparar() {
    setError(''); setOcupado(true);
    try {
      const r = await cam.current?.takePictureAsync({ quality: 0.9, shutterSound: false });
      if (r) setFoto(await preparar(r.uri));
    } catch { setError('No pudimos tomar la foto. Intenta de nuevo.'); }
    finally { setOcupado(false); }
  }

  // Solo en desarrollo (el simulador de iPhone no tiene cámara). En la app publicada no existe.
  async function galeriaDev() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!r.canceled) setFoto(await preparar(r.assets[0].uri));
  }

  async function enviar() {
    if (!foto) return;
    setError(''); setOcupado(true);
    try { await subirFoto(tipo, foto); await onListo(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setOcupado(false); }
  }

  let cuerpo: React.ReactNode;
  if (foto) {
    cuerpo = <Image source={{ uri: foto }} style={[s.visor, selfie && { transform: [{ scaleX: -1 }] }]} resizeMode={selfie ? "cover" : "contain"} accessibilityLabel="Vista previa de la foto" />;
  } else if (!permiso) {
    cuerpo = <View style={[s.visor, s.centro]}><ActivityIndicator color={colors.gold} /></View>;
  } else if (!permiso.granted) {
    cuerpo = (
      <View style={[s.visor, s.centro, { padding: 24, gap: 14 }]}>
        <Text style={s.permiso}>Necesitamos usar la cámara para {selfie ? 'tomar tu selfie' : 'fotografiar tu cédula'}. Las fotos solo las ve el equipo de validación.</Text>
        {permiso.canAskAgain
          ? <Boton title="Permitir cámara" variant="gold" onPress={pedirPermiso} />
          : <Boton title="Abrir configuración" variant="gold" onPress={() => Linking.openSettings()} />}
      </View>
    );
  } else {
    cuerpo = (
      <View style={s.visor}>
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={selfie ? 'front' : 'back'} animateShutter />
        {/* Guía: rectángulo con proporción de cédula, u óvalo para el rostro */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.centro]}>
          <View style={selfie ? s.ovalo : s.marco} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <Pasos paso={paso} />
      <View style={s.body}>
        <Text style={s.h1}>{titulo}</Text>
        <Text style={s.p}>{foto ? '¿Se ve nítida y completa? Si no, repítela.' : ayuda}</Text>
        {cuerpo}
        {!!error && <Text style={s.error}>{error}</Text>}
      </View>
      <View style={s.bottom}>
        {foto ? (
          <>
            <Boton title="Usar esta foto" onPress={enviar} loading={ocupado} />
            <Boton title="Repetir" variant="ghost" onPress={() => setFoto(null)} disabled={ocupado} />
          </>
        ) : (
          <>
            <Pressable onPress={disparar} disabled={!permiso?.granted || ocupado} style={s.shutter} accessibilityRole="button" accessibilityLabel="Tomar foto">
              <View style={[s.shutterIn, (!permiso?.granted || ocupado) && { opacity: 0.4 }]} />
            </Pressable>
            {__DEV__ && <Pressable onPress={galeriaDev}><Text style={s.dev}>Elegir de la galería (solo pruebas)</Text></Pressable>}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 18, gap: 10 },
  h1: { fontFamily: fonts.title, fontSize: 26, color: colors.navy },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
  visor: { flex: 1, borderRadius: 26, overflow: 'hidden', backgroundColor: colors.navyDark, marginTop: 6 },
  centro: { alignItems: 'center', justifyContent: 'center' },
  marco: { width: '86%', aspectRatio: 85.6 / 54, borderRadius: 14, borderWidth: 3, borderColor: colors.gold },
  ovalo: { width: '66%', aspectRatio: 3 / 4, borderRadius: 999, borderWidth: 3, borderColor: colors.gold },
  permiso: { fontFamily: fonts.semibold, color: colors.white, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  bottom: { padding: 22, gap: 10, alignItems: 'stretch' },
  shutter: { alignSelf: 'center', width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.gold },
  dev: { fontFamily: fonts.semibold, color: colors.ink3, fontSize: 13, textAlign: 'center', textDecorationLine: 'underline' },
});
