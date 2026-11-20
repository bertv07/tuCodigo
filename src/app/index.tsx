import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Boton, Simbolo } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useStaff } from '../lib/staff';
import { api } from '../lib/api';
import { colors, fonts, SLOGAN } from '../lib/theme';

/** 01 · Bienvenida */
export default function Bienvenida() {
  const { cargando, suscriptor } = useAuth();
  const { usuario, cargando: cargandoStaff } = useStaff();
  const [slogan, setSlogan] = useState(SLOGAN);
  useEffect(() => { api<Record<string, unknown>>('/v1/publico/textos').then(t => typeof t['app.slogan'] === 'string' && setSlogan(t['app.slogan'])).catch(() => {}); }, []);

  if (cargando || cargandoStaff) return <View style={[s.root, { justifyContent: 'center', backgroundColor: colors.navy }]}><ActivityIndicator color={colors.gold} /></View>;
  if (usuario) return <Redirect href="/promotor" />;
  if (suscriptor) return <Redirect href="/inicio" />;

  return (
    <LinearGradient colors={['#0D1B36', '#15294F', '#22407A']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={s.root}>
      <StatusBar style="light" />
      <View style={[s.aro, { width: 340, height: 340, top: 40, right: -150 }]} pointerEvents="none" />
      <View style={[s.aro, { width: 260, height: 260, top: 420, left: -170 }]} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.center}>
          <View style={s.iconBox}><Simbolo size={76} dark /></View>
          <Text style={s.tu}>TU</Text>
          <Text style={s.codigo}>CÓDIGO</Text>
          <Text style={s.slogan}>{slogan}</Text>
        </View>
        <View style={s.bottom}>
          <Text style={s.apoyo}>Precio de fábrica · Sin sobreprecios · Sin letras pequeñas</Text>
          <Boton title="Crear mi código" variant="gold" onPress={() => router.push('/como-funciona')} />
          <Boton title="Ya tengo cuenta" variant="glass" onPress={() => router.push('/acceso/cedula')} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  aro: { position: 'absolute', borderRadius: 999, borderWidth: 22, borderColor: 'rgba(255,255,255,0.10)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconBox: { width: 116, height: 116, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  tu: { fontFamily: fonts.title, color: colors.white, fontSize: 20, letterSpacing: 8 },
  codigo: { fontFamily: fonts.title, color: colors.white, fontSize: 50 },
  slogan: { fontFamily: fonts.title, color: colors.goldLight, fontSize: 17, marginTop: 14 },
  bottom: { padding: 22, gap: 12 },
  apoyo: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginBottom: 6 },
});
