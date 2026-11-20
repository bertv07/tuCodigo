import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image as ImageIcon, Zap, ZapOff } from 'lucide-react-native';
import { Boton } from './ui';
import { Pasos, Badge } from './ds';
import { ApiError } from '../lib/api';
import { subirFoto } from '../lib/registro';
import { colors, fonts } from '../lib/theme';

type Props = {
  tipo: 'cedula' | 'selfie'; paso: number; titulo: string; ayuda: string; guia: string;
  onListo: () => void | Promise<unknown>;
};

/** Reduce la foto a 1600 px como máximo y la guarda como JPEG (~300 KB, ideal para redes lentas; la orientación queda corregida). */
async function preparar(uri: string) {
  const img = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync();
  const r = await img.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return r.uri;
}

/** 05 · Foto de la cédula y 06 · Selfie (cámara nativa con guía de encuadre, vista previa y envío cifrado). */
export function Captura({ tipo, paso, titulo, ayuda, guia, onListo }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
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

  // La cédula también se puede elegir de la galería (diseño 05). La selfie es siempre con la cámara frontal.
  async function galeria() {
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

  let visor: React.ReactNode;
  if (foto) {
    visor = <Image source={{ uri: foto }} style={[StyleSheet.absoluteFill, selfie && { transform: [{ scaleX: -1 }] }]} resizeMode={selfie ? 'cover' : 'contain'} accessibilityLabel="Vista previa de la foto" />;
  } else if (!permiso) {
    visor = <ActivityIndicator color={colors.gold} />;
  } else if (!permiso.granted) {
    visor = (
      <View style={{ padding: 28, gap: 14 }}>
        <Text style={s.permiso}>Necesitamos usar la cámara para {selfie ? 'tomar tu selfie' : 'fotografiar tu cédula'}. Las fotos solo las ve el equipo de validación.</Text>
        {permiso.canAskAgain
          ? <Boton title="Permitir cámara" variant="gold" onPress={pedirPermiso} />
          : <Boton title="Abrir configuración" variant="gold" onPress={() => Linking.openSettings()} />}
      </View>
    );
  } else {
    visor = (
      <>
        <CameraView ref={cam} style={StyleSheet.absoluteFill} facing={selfie ? 'front' : 'back'} enableTorch={flash && !selfie} animateShutter />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.centro]}>
          <View style={selfie ? s.ovalo : s.marco} />
        </View>
      </>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <Pasos paso={paso} dark cerrar={!selfie} titulo={titulo} />
        <View style={s.viewport}>
          {visor}
          {!foto && permiso?.granted && <View style={s.badge} pointerEvents="none"><Badge texto={guia} tono={selfie ? 'warn' : 'ok'} /></View>}
        </View>
        <Text style={s.ayuda}>{foto ? '¿Se ve nítida y completa? Si no, repítela.' : ayuda}</Text>
        {!!error && <Text style={s.error}>{error}</Text>}
        <View style={s.bottom}>
          {foto ? (
            <View style={{ alignSelf: 'stretch', gap: 10 }}>
              <Boton title="Usar esta foto" variant="gold" onPress={enviar} loading={ocupado} />
              <Boton title="Repetir" variant="glass" onPress={() => setFoto(null)} disabled={ocupado} />
            </View>
          ) : (
            <View style={s.controles}>
              {/* Galería: siempre para la cédula; para la selfie solo en desarrollo (el simulador no tiene cámara) */}
              {selfie && !__DEV__ ? <View style={s.ladoVacio} /> : (
                <Pressable onPress={galeria} style={s.lado} accessibilityRole="button" accessibilityLabel="Elegir de la galería"><ImageIcon size={22} color={colors.white} /></Pressable>
              )}
              <Pressable onPress={disparar} disabled={!permiso?.granted || ocupado} style={s.shutter} accessibilityRole="button" accessibilityLabel="Tomar foto">
                <View style={[s.shutterIn, (!permiso?.granted || ocupado) && { opacity: 0.4 }]} />
              </Pressable>
              {selfie ? <View style={s.ladoVacio} /> : (
                <Pressable onPress={() => setFlash(!flash)} style={s.lado} accessibilityRole="switch" accessibilityState={{ checked: flash }} accessibilityLabel="Linterna">
                  {flash ? <Zap size={22} color={colors.goldLight} /> : <ZapOff size={22} color={colors.white} />}
                </Pressable>
              )}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.camara },
  viewport: { flex: 1, marginTop: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E1628' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  marco: { width: 310, height: 196, borderRadius: 20, borderWidth: 3, borderColor: colors.gold },
  ovalo: { width: 240, height: 310, borderRadius: 999, borderWidth: 3, borderColor: colors.gold },
  badge: { position: 'absolute', top: 18, alignSelf: 'center' },
  permiso: { fontFamily: fonts.semibold, color: colors.white, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  ayuda: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 40, paddingTop: 18 },
  error: { fontFamily: fonts.semibold, color: '#FF9C9C', fontSize: 13, textAlign: 'center', paddingTop: 6, paddingHorizontal: 24 },
  bottom: { padding: 22, paddingTop: 16, alignItems: 'center' },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 12 },
  lado: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ladoVacio: { width: 46, height: 46 },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.white },
});
