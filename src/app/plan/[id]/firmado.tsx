import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, FileText, Download, MessageCircle } from 'lucide-react-native';
import { Boton } from '../../../components/ui';
import { abrirContrato } from '../../../lib/catalogo';
import { colors, fonts, HERO } from '../../../lib/theme';

/** 15 · Contrato firmado */
export default function Firmado() {
  const { id, numero, correo } = useLocalSearchParams<{ id: string; numero: string; correo?: string }>();
  const [abriendo, setAbriendo] = useState(false);
  const [error, setError] = useState('');
  async function abrir() {
    setError(''); setAbriendo(true);
    try { await abrirContrato(id, numero); } catch (e) { setError((e as Error).message); } finally { setAbriendo(false); }
  }
  return (
    <LinearGradient colors={HERO} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={s.aro} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.body}>
          <View style={s.ok}><Check size={40} color={colors.navyDark} strokeWidth={3} /></View>
          <Text style={s.h1}>¡Contrato firmado!</Text>
          <Text style={s.p}>Te enviamos una copia en PDF por WhatsApp{correo ? ' y a tu correo' : ''}. Activa tu plan pagando la Cuota Única de Registro y la Cuota 1 en taquilla.</Text>
          <Pressable style={s.pdf} onPress={abrir} accessibilityRole="button" accessibilityLabel="Descargar el contrato en PDF">
            <View style={s.pdfIc}><FileText size={20} color={colors.red} /></View>
            <Text style={s.pdfT} numberOfLines={1}>Contrato_{numero}.pdf</Text>
            {abriendo ? <ActivityIndicator color={colors.navy} /> : <Download size={20} color={colors.navy} />}
          </Pressable>
          {!!error && <Text style={s.error}>{error}</Text>}
        </View>
        <View style={s.bottom}>
          <Boton title="Ver Mis Planes" variant="gold" onPress={() => router.replace('/mis-planes')} />
          <Pressable style={s.glass} onPress={abrir} accessibilityRole="button"><MessageCircle size={18} color={colors.white} /><Text style={s.glassT}>Compartir por WhatsApp</Text></Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  aro: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 22, borderColor: 'rgba(255,255,255,0.08)', top: -40, right: -110 },
  body: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 },
  ok: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  h1: { fontFamily: fonts.title, fontSize: 28, color: colors.white, textAlign: 'center' },
  p: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.78)', textAlign: 'center', lineHeight: 21 },
  pdf: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 20, padding: 14, marginTop: 8 },
  pdfIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.red50, alignItems: 'center', justifyContent: 'center' },
  pdfT: { flex: 1, fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  error: { fontFamily: fonts.semibold, color: '#FFB4B4', fontSize: 13, textAlign: 'center' },
  bottom: { padding: 20, gap: 10 },
  glass: { height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  glassT: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});
