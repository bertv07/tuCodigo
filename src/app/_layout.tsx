import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo-black';
import { AuthProvider } from '../lib/auth';
import { colors } from '../lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [listo] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold, ArchivoBlack_400Regular });
  useEffect(() => { if (listo) SplashScreen.hideAsync(); }, [listo]);
  if (!listo) return null;
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </AuthProvider>
  );
}
