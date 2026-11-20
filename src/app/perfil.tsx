import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRound, FileText, CreditCard, Scale, Fingerprint, Headphones, LogOut, ChevronRight, Trash2 } from 'lucide-react-native';
import { Card, Li, Badge, Toggle, TabBar } from '../components/ds';
import { useAuth, nombreDe } from '../lib/auth';
import { api, mensajeDe } from '../lib/api';
import { biometria } from '../lib/biometria';
import { colors, fonts } from '../lib/theme';

const flecha = <ChevronRight size={18} color={colors.ink3} />;

/** 20 · Perfil */
export default function Perfil() {
  const { suscriptor, salir } = useAuth();
  const [huella, setHuella] = useState(false);
  const [disponible, setDisponible] = useState(false);
  const [asistencia, setAsistencia] = useState('Estudio Jurídico Internacional');
  useEffect(() => { (async () => { setDisponible(await biometria.disponible()); setHuella(await biometria.activa()); })(); }, []);
  useFocusEffect(useCallback(() => { api<{ asistencia: { nombre: string } | null }>('/v1/cuenta/perfil', { auth: true }).then(p => p.asistencia?.nombre && setAsistencia(p.asistencia.nombre)).catch(() => {}); }, []));
  if (!suscriptor) return <Redirect href="/" />;

  async function cambiarHuella(v: boolean) {
    if (v && !disponible) { Alert.alert('Huella o Face ID', 'Primero configura la huella o Face ID en los ajustes de tu teléfono.'); return; }
    if (v) { if (await biometria.activar()) setHuella(true); }
    else { await biometria.desactivar(); setHuella(false); }
  }
  const cerrar = () => Alert.alert('Cerrar sesión', '¿Quieres cerrar tu sesión en este teléfono?', [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await salir(); router.replace('/'); } },
  ]);
  const eliminar = () => Alert.alert('Eliminar mi cuenta', 'Se borrarán tus datos personales, las fotos de tu identidad y tu código TC-SUC quedará dado de baja. Los contratos ya firmados se conservan como exige la ley. Esta acción no se puede deshacer.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Continuar', style: 'destructive', onPress: () => Alert.alert('¿Seguro?', 'Tu cuenta se eliminará de forma definitiva.', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, eliminar', style: 'destructive', onPress: async () => {
        try { await api('/v1/cuenta', { method: 'DELETE', auth: true, body: { confirmacion: 'ELIMINAR' } }); await salir(); router.replace('/'); Alert.alert('Cuenta eliminada', 'Tus datos fueron eliminados.'); }
        catch (e) { Alert.alert('No se pudo eliminar', mensajeDe(e)); }
      } },
    ]) },
  ]);
  const verificado = suscriptor.estado === 'VERIFICADO';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View style={s.avatar}><UserRound size={40} color={colors.navy} /></View>
          <Text style={s.nombre}>{nombreDe(suscriptor) || 'Suscriptor'}</Text>
          {!!suscriptor.codigo && <Text style={s.codigo}>{suscriptor.codigo}</Text>}
          <Badge texto={verificado ? '✓ Identidad verificada' : suscriptor.estado === 'EN_REVISION' ? 'Identidad en revisión' : 'Registro pendiente'} tono={verificado ? 'ok' : 'warn'} style={{ alignSelf: 'center' }} />
        </View>
        <Card style={{ paddingVertical: 4 }}>
          <Li Icono={UserRound} titulo="Datos personales" onPress={() => router.push('/perfil/datos')} derecha={flecha} />
          <Li Icono={FileText} titulo="Mis contratos" onPress={() => router.push('/perfil/contratos')} derecha={flecha} />
          <Li Icono={CreditCard} titulo="Mi tarjeta fundadora" onPress={() => router.push('/tarjeta')} derecha={flecha} />
          <Li Icono={Scale} tono="gold" titulo="Asistencia Jurídica 24/7" sub={asistencia} onPress={() => router.push('/perfil/asistencia')} derecha={flecha} ultimo />
        </Card>
        <Card style={{ paddingVertical: 4 }}>
          <Li Icono={Fingerprint} titulo="Entrar con huella o Face ID" derecha={<Toggle on={huella} onCambio={cambiarHuella} label="Entrar con huella o Face ID" />} />
          <Li Icono={Headphones} tono="blue" titulo="Ayuda y soporte" onPress={() => router.push('/perfil/ayuda')} derecha={flecha} />
          <Li Icono={LogOut} tono="red" titulo="Cerrar sesión" tituloStyle={{ color: colors.red }} onPress={cerrar} />
          <Li Icono={Trash2} tono="red" titulo="Eliminar mi cuenta" tituloStyle={{ color: colors.red }} onPress={eliminar} ultimo />
        </Card>
      </ScrollView>
      <TabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14, paddingBottom: 30 },
  avatar: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.title, fontSize: 21, color: colors.navy, marginTop: 6 },
  codigo: { fontFamily: 'Menlo', fontSize: 12, color: colors.ink3, letterSpacing: 0.5 },
});
