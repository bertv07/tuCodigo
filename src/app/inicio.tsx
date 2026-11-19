import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Boton, Logo } from '../components/ui';
import { useAuth } from '../lib/auth';
import { irAlSiguientePaso } from '../lib/registro';
import { colors, fonts } from '../lib/theme';

const ESTADOS: Record<string, { titulo: string; texto: string; accion?: string }> = {
  REGISTRO_INCOMPLETO: { titulo: 'Completa tu registro', texto: 'Tu teléfono ya está verificado. Falta tu documento, la foto de tu cédula y una selfie.', accion: 'Continuar registro' },
  EN_REVISION: { titulo: 'Estamos validando tus fotos', texto: 'Te avisamos por WhatsApp apenas el equipo apruebe tu identidad. Mientras tanto ya puedes mostrar Mi Código.' },
  CORRECCION: { titulo: 'Necesitamos un ajuste', texto: 'El equipo de validación te pidió corregir algo. Toca para ver el mensaje.', accion: 'Ver qué falta' },
  VERIFICADO: { titulo: 'Identidad verificada ✓', texto: 'Ya puedes elegir tu producto y armar tu plan.' },
  RECHAZADO: { titulo: 'No pudimos validar tu identidad', texto: 'Comunícate con soporte o acércate a una taquilla del Centro Empresarial 8 de Mayo.' },
};

/** 08 · Inicio (Día 2: estado del registro y acceso a Mi Código) */
export default function Inicio() {
  const { suscriptor, salir, recargar } = useAuth();
  useFocusEffect(useCallback(() => { recargar(); }, [recargar]));
  if (!suscriptor) return <Redirect href="/" />;
  const e = ESTADOS[suscriptor.estado] ?? ESTADOS.REGISTRO_INCOMPLETO;
  const tieneQr = !!suscriptor.codigo && ['EN_REVISION', 'VERIFICADO'].includes(suscriptor.estado);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.body}>
        <Logo size={34} />
        <View style={s.hero}>
          <Text style={s.small}>Tu Código Directo</Text>
          <Text style={s.code}>{suscriptor.codigo ?? 'Se asigna al completar el registro'}</Text>
          {suscriptor.telefono ? <Text style={s.small}>{suscriptor.telefono}</Text> : null}
          {tieneQr && <Boton title="Mostrar Mi Código QR" variant="gold" onPress={() => router.push('/mi-codigo')} style={{ alignSelf: 'stretch', marginTop: 12 }} />}
        </View>
        <View style={s.card}>
          <Text style={s.h3}>{e.titulo}</Text>
          <Text style={s.p}>{e.texto}</Text>
          {e.accion && <Boton title={e.accion} onPress={() => irAlSiguientePaso(false)} style={{ marginTop: 10 }} />}
        </View>
        <Boton title="Cerrar sesión" variant="ghost" onPress={salir} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16 },
  hero: { backgroundColor: colors.navy, borderRadius: 28, padding: 24, alignItems: 'center', gap: 6 },
  small: { fontFamily: fonts.regular, color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  code: { fontFamily: fonts.title, color: colors.goldLight, fontSize: 22, textAlign: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 22, padding: 18, gap: 6 },
  h3: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, lineHeight: 21 },
});
