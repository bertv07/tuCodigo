import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { UserRound, ScanLine } from 'lucide-react-native';
import { Boton } from '../../components/ui';
import { Card, Badge, TabBar, Seg } from '../../components/ds';
import { api, ApiError } from '../../lib/api';
import { colors, fonts } from '../../lib/theme';

type Cliente = { id: string; codigo: string; nombre: string; estado: string; tarjeta: string | null; telefono: string };
const ESTADO: Record<string, [string, 'ok' | 'warn' | 'bad' | 'navy']> = { VERIFICADO: ['Verificado', 'ok'], EN_REVISION: ['En revisión', 'warn'], CORRECCION: ['Repetir foto', 'warn'], RECHAZADO: ['Rechazado', 'bad'], BLOQUEADO: ['Bloqueado', 'bad'] };

/** Escanear: consulta el QR rotativo del cliente (o su código) y, en «Entregar tarjeta», vincula el serial PVC. */
export default function Escanear() {
  const { modo: m0 } = useLocalSearchParams<{ modo?: string }>();
  const [modo, setModo] = useState<'consultar' | 'tarjeta'>(m0 === 'tarjeta' ? 'tarjeta' : 'consultar');
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [codigo, setCodigo] = useState('');
  const [serial, setSerial] = useState('');
  const [leyendo, setLeyendo] = useState(true);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);

  async function consultar(body: { qr?: string; codigo?: string }) {
    setError(''); setOk(''); setCargando(true); setLeyendo(false);
    try { setCliente(await api<Cliente>('/v1/promotor/consultar', { method: 'POST', staff: true, body })); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); setTimeout(() => setLeyendo(true), 1500); }
    finally { setCargando(false); }
  }
  async function vincular() {
    if (!cliente) return;
    setError(''); setOk(''); setCargando(true);
    try { const r = await api<{ serial: string }>('/v1/promotor/tarjeta', { method: 'POST', staff: true, body: { suscriptorId: cliente.id, serial } }); setCliente({ ...cliente, tarjeta: r.serial }); setOk(`Tarjeta ${r.serial} entregada a ${cliente.nombre}.`); setSerial(''); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Ocurrió un error.'); }
    finally { setCargando(false); }
  }
  const otro = () => { setCliente(null); setCodigo(''); setSerial(''); setOk(''); setError(''); setLeyendo(true); };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.h1}>{modo === 'tarjeta' ? 'Entregar tarjeta' : 'Consultar código'}</Text>
          <Seg opciones={[{ v: 'consultar', t: 'Consultar código' }, { v: 'tarjeta', t: 'Entregar tarjeta' }]} valor={modo} onCambio={v => { setModo(v); otro(); }} />
          {!cliente ? (
            <>
              <View style={s.visor}>
                {permiso?.granted ? (
                  <>
                    <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      onBarcodeScanned={leyendo && !cargando ? ({ data }) => consultar({ qr: String(data) }) : undefined} />
                    <View style={s.mira} pointerEvents="none" />
                  </>
                ) : (
                  <View style={{ alignItems: 'center', gap: 12, padding: 20 }}>
                    <ScanLine size={40} color={colors.goldLight} />
                    <Text style={s.blanco}>Permite la cámara para escanear el Mi Código del cliente.</Text>
                    <Boton title="Permitir cámara" variant="gold" onPress={pedirPermiso} />
                  </View>
                )}
              </View>
              <Text style={s.label}>O escribe el código</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput value={codigo} onChangeText={v => setCodigo(v.toUpperCase())} placeholder="TC-SUC-26-00001" placeholderTextColor={colors.ink3} autoCapitalize="characters" autoCorrect={false} style={[s.input, { flex: 1 }]} />
                <Boton title="Buscar" onPress={() => consultar({ codigo })} disabled={codigo.length < 15} style={{ height: 54 }} />
              </View>
            </>
          ) : (
            <Card style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={s.avatar}><UserRound size={24} color={colors.navy} /></View>
                <View style={{ flex: 1 }}><Text style={s.nombre}>{cliente.nombre || 'Sin datos'}</Text><Text style={s.sub}>{cliente.codigo} · {cliente.telefono}</Text></View>
                <Badge texto={ESTADO[cliente.estado]?.[0] ?? 'Incompleto'} tono={ESTADO[cliente.estado]?.[1] ?? 'navy'} />
              </View>
              <Text style={s.sub}>Tarjeta PVC: <Text style={{ fontFamily: fonts.bold, color: colors.ink }}>{cliente.tarjeta ?? 'sin vincular'}</Text></Text>
              {modo === 'tarjeta' && (
                <>
                  <Text style={s.label}>Serial de la tarjeta que entregas</Text>
                  <TextInput value={serial} onChangeText={v => setSerial(v.toUpperCase())} placeholder="PVC-26-004817" placeholderTextColor={colors.ink3} autoCapitalize="characters" autoCorrect={false} style={s.input} />
                  <Boton title={cliente.tarjeta ? 'Cambiar tarjeta' : 'Vincular tarjeta'} onPress={vincular} loading={cargando} disabled={serial.length < 6} />
                </>
              )}
              <Pressable onPress={otro} hitSlop={8} style={{ alignSelf: 'center' }}><Text style={s.link}>Escanear otro</Text></Pressable>
            </Card>
          )}
          {!!error && <Text style={s.error}>{error}</Text>}
          {!!ok && <Text style={s.ok}>{ok}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
      <TabBar set="promotor" />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 8, gap: 12, paddingBottom: 30 },
  h1: { fontFamily: fonts.title, fontSize: 24, color: colors.navy },
  visor: { height: 300, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.navyDark, alignItems: 'center', justifyContent: 'center' },
  mira: { width: 200, height: 200, borderRadius: 24, borderWidth: 3, borderColor: colors.gold },
  blanco: { fontFamily: fonts.semibold, color: colors.white, textAlign: 'center' },
  label: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink2 },
  input: { height: 54, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.navy50, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.ink3 },
  link: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13 },
  ok: { fontFamily: fonts.semibold, color: colors.green, fontSize: 13 },
});
