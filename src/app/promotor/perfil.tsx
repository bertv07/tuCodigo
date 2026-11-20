import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRound, Store, LogOut, Mail } from 'lucide-react-native';
import { Card, Li, Badge, TabBar } from '../../components/ds';
import { useStaff } from '../../lib/staff';
import { colors, fonts } from '../../lib/theme';

/** Perfil del promotor (barra de la estación) */
export default function PerfilPromotor() {
  const { usuario, salir } = useStaff();
  const cerrar = () => Alert.alert('Cerrar sesión', '¿Cerrar la sesión de la estación en este equipo?', [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await salir(); router.replace('/'); } },
  ]);
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View style={s.avatar}><UserRound size={40} color={colors.navy} /></View>
          <Text style={s.nombre}>{usuario?.nombre}</Text>
          <Badge texto={usuario?.rol === 'SUPERVISOR' ? 'Supervisor' : usuario?.rol === 'ADMIN' ? 'Administrador' : 'Promotor'} tono="navy" style={{ alignSelf: 'center' }} />
        </View>
        <Card style={{ paddingVertical: 4 }}>
          <Li Icono={Mail} titulo="Correo" sub={usuario?.email} />
          <Li Icono={Store} tono="gold" titulo="Estación" sub={usuario?.estacion ? `${usuario.estacion.nombre} · ${usuario.estacion.codigo}` : 'Sin estación asignada'} ultimo />
        </Card>
        <Card style={{ paddingVertical: 4 }}>
          <Li Icono={LogOut} tono="red" titulo="Cerrar sesión" tituloStyle={{ color: colors.red }} onPress={cerrar} ultimo />
        </Card>
      </ScrollView>
      <TabBar set="promotor" />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, gap: 14 },
  avatar: { width: 84, height: 84, borderRadius: 26, backgroundColor: colors.navy100, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.title, fontSize: 21, color: colors.navy, marginTop: 6 },
});
