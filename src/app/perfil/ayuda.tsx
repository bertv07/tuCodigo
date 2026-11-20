import { useEffect, useState } from 'react';
import { Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, MessageCircle, Mail } from 'lucide-react-native';
import { Card, Li, TopBar } from '../../components/ds';
import { api } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

/** Ayuda y soporte (contactos editables en la Torre) */
export default function Ayuda() {
  const [sop, setSop] = useState<{ whatsapp: string; correo: string } | null>(null);
  useEffect(() => { api<{ soporte: { whatsapp: string; correo: string } | null }>('/v1/cuenta/perfil', { auth: true }).then(p => setSop(p.soporte)).catch(() => {}); }, []);
  return (
    <SafeAreaView style={s.root}>
      <TopBar titulo="Ayuda y soporte" />
      <ScrollView contentContainerStyle={s.body}>
        <Card style={{ paddingVertical: 4 }}>
          {sop?.whatsapp && <Li Icono={MessageCircle} tono="green" titulo="WhatsApp de soporte" sub={sop.whatsapp} onPress={() => Linking.openURL(`https://wa.me/${sop.whatsapp.replace(/\D/g, '')}`)} />}
          {sop?.correo && <Li Icono={Mail} tono="blue" titulo="Correo de soporte" sub={sop.correo} onPress={() => Linking.openURL(`mailto:${sop.correo}`)} />}
          <Li Icono={MapPin} tono="gold" titulo="Taquillas" sub="Centro Empresarial 8 de Mayo, Av. Gran Mariscal, Cumaná" ultimo />
        </Card>
        <Text style={s.nota}>TU CÓDIGO · De la fábrica a tu mano. PROCURA SIGLO 21, C.A.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 14 },
  nota: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, textAlign: 'center' },
});
