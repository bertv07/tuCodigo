import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCheck, Check, ScanFace, FileSignature } from 'lucide-react-native';
import { Boton } from '../../components/ui';
import { Card, Hero, Li, Badge, Av } from '../../components/ds';
import { useAuth } from '../../lib/auth';
import { asistido } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

/** 07 · ¡Ya tienes tu código! (o, en taquilla, el resumen para el promotor) */
export default function Listo() {
  const { codigo, numero } = useLocalSearchParams<{ codigo: string; numero: string }>();
  const { recargar } = useAuth();
  const enTaquilla = !!asistido.token;
  const ir = async () => {
    if (enTaquilla) { asistido.token = null; router.replace('/promotor'); return; }
    await recargar(); router.replace('/catalogo');
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ alignItems: 'center', gap: 10, marginTop: 18 }}>
          <Av Icono={BadgeCheck} tono="green" size={72} />
          <Text style={s.h1}>¡Ya tienes{'\n'}tu código!</Text>
          <Text style={s.p}>{enTaquilla ? 'El registro quedó en la cola de validación. El cliente recibirá el aviso por WhatsApp.' : 'Estamos validando tus fotos. Te avisamos por WhatsApp en minutos.'}</Text>
        </View>
        <Hero style={{ alignItems: 'center', gap: 6, paddingVertical: 24 }}>
          <Text style={s.small}>Tu Código Directo</Text>
          <Text style={s.codigo} selectable>{codigo}</Text>
          {Number(numero) > 0 && <Text style={s.small}>Suscriptor fundador N.º {Number(numero).toLocaleString('es-VE')}</Text>}
        </Hero>
        <Card style={{ paddingVertical: 4 }}>
          <Li Icono={Check} tono="green" titulo="Datos y teléfono" sub="Verificado por OTP" derecha={<Badge texto="Listo" tono="ok" />} />
          <Li Icono={ScanFace} tono="gold" titulo="Cédula y selfie" sub="Validación del equipo" derecha={<Badge texto="En revisión" tono="warn" />} />
          <Li Icono={FileSignature} titulo="Elegir producto y firmar" sub="Ya puedes ver el catálogo" derecha={<Badge texto="Siguiente" tono="info" />} ultimo />
        </Card>
      </ScrollView>
      <View style={s.bottom}><Boton title={enTaquilla ? 'Volver a la estación' : 'Ver catálogo'} onPress={ir} /></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 16 },
  h1: { fontFamily: fonts.title, fontSize: 28, lineHeight: 32, color: colors.navy, textAlign: 'center' },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2, textAlign: 'center', lineHeight: 21, paddingHorizontal: 10 },
  small: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  codigo: { fontFamily: fonts.title, fontSize: 26, color: colors.goldLight, letterSpacing: 0.5 },
  bottom: { padding: 20 },
});
