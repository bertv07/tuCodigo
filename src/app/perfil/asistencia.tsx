import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Phone, MessageCircle, Scale } from 'lucide-react-native';
import { Boton } from '../../components/ui';
import { Card, Hero, TopBar, Av } from '../../components/ds';
import { api } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

type A = { nombre: string; telefono: string; whatsapp: string; horario: string };

/** Asistencia Jurídica 24/7 (beneficio de la Tarjeta Fundadora). El contacto se edita en la Torre. */
export default function Asistencia() {
  const [a, setA] = useState<A | null>(null);
  useEffect(() => { api<Record<string, unknown>>('/v1/publico/textos').then(t => setA((t['asistencia.juridica'] as A) ?? null)).catch(() => {}); }, []);
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Asistencia Jurídica" />
      <ScrollView contentContainerStyle={s.body}>
        <Hero style={{ gap: 8, alignItems: 'flex-start' }}>
          <Av Icono={Scale} tono="gold" size={48} />
          <Text style={s.h1}>Asistencia Jurídica {a?.horario ?? '24/7'}</Text>
          <Text style={s.p}>Beneficio de tu Tarjeta Fundadora TU CÓDIGO. Te orientamos ante cualquier duda legal.</Text>
          {a && <Text style={s.nombre}>{a.nombre}</Text>}
        </Hero>
        {a ? (
          <Card style={{ gap: 10 }}>
            <Boton title="Escribir por WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${a.whatsapp.replace(/\D/g, '')}`)} />
            <Boton title="Llamar" variant="ghost" onPress={() => Linking.openURL(`tel:${a.telefono.replace(/[^\d+]/g, '')}`)} />
          </Card>
        ) : <Text style={s.nota}>El contacto de la asistencia jurídica estará disponible pronto.</Text>}
        <Text style={s.nota}><Phone size={12} color={colors.ink3} /> <MessageCircle size={12} color={colors.ink3} /> El servicio lo presta el aliado jurídico de PROCURA SIGLO 21, C.A.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 14 },
  h1: { fontFamily: fonts.title, fontSize: 22, color: colors.white },
  p: { fontFamily: fonts.regular, fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 20 },
  nombre: { fontFamily: fonts.bold, fontSize: 14, color: colors.goldLight },
  nota: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 17, textAlign: 'center' },
});
