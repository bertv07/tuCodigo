import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Boton, Simbolo } from '../components/ui';
import { useAuth } from '../lib/auth';
import { colors, fonts, SLOGAN } from '../lib/theme';

/** 01 · Bienvenida */
export default function Bienvenida() {
  const { cargando, suscriptor } = useAuth();
  if (cargando) return <View style={[s.root, { justifyContent: 'center' }]}><ActivityIndicator color={colors.gold} /></View>;
  if (suscriptor) return <Redirect href="/inicio" />;

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.center}>
          <View style={s.iconBox}><Simbolo size={76} dark /></View>
          <Text style={s.tu}>TU</Text>
          <Text style={s.codigo}>CÓDIGO</Text>
          <Text style={s.slogan}>{SLOGAN}</Text>
        </View>
        <View style={s.bottom}>
          <Text style={s.apoyo}>Precio de fábrica · Sin sobreprecios · Sin letras pequeñas</Text>
          <Boton title="Crear mi código" variant="gold" onPress={() => router.push('/acceso/telefono')} />
          <Boton title="Ya tengo cuenta" variant="glass" onPress={() => router.push('/acceso/telefono')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconBox: { width: 116, height: 116, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  tu: { fontFamily: fonts.title, color: colors.white, fontSize: 20, letterSpacing: 8 },
  codigo: { fontFamily: fonts.title, color: colors.white, fontSize: 50 },
  slogan: { fontFamily: fonts.title, color: colors.goldLight, fontSize: 17, marginTop: 14 },
  bottom: { padding: 22, gap: 12 },
  apoyo: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center', marginBottom: 6 },
});
