import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Fingerprint } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { AuthProvider, useAuth } from '../lib/auth';
import { StaffProvider } from '../lib/staff';
import { Simbolo } from '../components/ui';
import { colors, fonts, HERO } from '../lib/theme';

SplashScreen.preventAutoHideAsync();

/** Pantalla de bloqueo cuando el suscriptor activó «Entrar con huella o Face ID». */
function Bloqueo() {
  const { bloqueado, desbloquear, salir } = useAuth();
  useEffect(() => { if (bloqueado) void desbloquear(); }, [bloqueado]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!bloqueado) return null;
  return (
    <LinearGradient colors={HERO} style={[StyleSheet.absoluteFill, s.bloqueo]}>
      <Simbolo size={72} dark />
      <Text style={s.titulo}>TU CÓDIGO</Text>
      <Pressable onPress={() => void desbloquear()} style={s.boton} accessibilityRole="button"><Fingerprint size={22} color={colors.navyDark} /><Text style={s.botonT}>Entrar con huella o Face ID</Text></Pressable>
      <Pressable onPress={() => void salir()} hitSlop={10}><Text style={s.otro}>Entrar con mi cédula</Text></Pressable>
    </LinearGradient>
  );
}

export default function RootLayout() {
  const [listo] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, ArchivoBlack_400Regular });
  useEffect(() => { if (listo) SplashScreen.hideAsync(); }, [listo]);
  if (!listo) return null;
  return (
    <AuthProvider>
      <StaffProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            {/* Pantallas principales con barra inferior: sin animación al cambiar de pestaña */}
            {['inicio', 'catalogo/index', 'mis-planes', 'perfil', 'promotor/index', 'promotor/registros', 'promotor/perfil'].map(n => <Stack.Screen key={n} name={n} options={{ animation: 'none' }} />)}
          </Stack>
          <Bloqueo />
        </View>
      </StaffProvider>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  bloqueo: { alignItems: 'center', justifyContent: 'center', gap: 18, padding: 30 },
  titulo: { fontFamily: fonts.title, fontSize: 26, color: colors.white },
  boton: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.gold, height: 56, borderRadius: 18, paddingHorizontal: 22, marginTop: 20 },
  botonT: { fontFamily: fonts.bold, fontSize: 16, color: colors.navyDark },
  otro: { fontFamily: fonts.semibold, fontSize: 14, color: 'rgba(255,255,255,0.75)', textDecorationLine: 'underline' },
});
