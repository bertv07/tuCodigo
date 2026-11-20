import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint } from 'lucide-react-native';
import { Boton } from '../../../components/ui';
import { TopBar } from '../../../components/ds';
import { Otp, useEspera } from '../../../components/Otp';
import { PadFirma, type FirmaDibujada } from '../../../components/PadFirma';
import { api, ApiError } from '../../../lib/api';
import type { TextoContrato } from '../../../lib/catalogo';
import { colors, fonts } from '../../../lib/theme';

/** 14 · Firma táctil + código OTP enviado por WhatsApp. */
export default function Firma() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [firma, setFirma] = useState<FirmaDibujada | null>(null);
  const [firmante, setFirmante] = useState('');
  const [codigo, setCodigo] = useState('');
  const [espera, setEspera] = useEspera();
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [firmando, setFirmando] = useState(false);
  const [scroll, setScroll] = useState(true);
  const pedido = useRef(false);

  async function pedirCodigo() {
    setError('');
    try { const r = await api<{ reenviarEn: number }>(`/v1/planes/${id}/firma/codigo`, { method: 'POST', auth: true }); setEspera(r.reenviarEn); setAviso(''); }
    catch (e) {
      // Si ya se pidió uno hace poco, ese código sigue sirviendo: no es un error
      if (e instanceof ApiError && e.code === 'OTP_ESPERA') { setEspera(Number(/\d+/.exec(e.message)?.[0] ?? 60)); setAviso('Usa el código que te enviamos hace un momento.'); return; }
      setError(e instanceof ApiError ? e.message : 'No pudimos enviar el código.');
    }
  }
  useEffect(() => {
    if (pedido.current) return; pedido.current = true;
    pedirCodigo();
    api<TextoContrato>(`/v1/planes/${id}/contrato`, { auth: true }).then(c => setFirmante(`${c.firmante.nombre} · ${c.firmante.documento}`)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function firmar() {
    if (!firma) return;
    setError(''); setFirmando(true);
    try {
      const r = await api<{ numero: string; paginas: number; firmadoEn: string; copiaPorCorreo: boolean }>(`/v1/planes/${id}/firmar`, { method: 'POST', auth: true, body: { codigo, acepto: true, firma } });
      router.replace({ pathname: '/plan/[id]/firmado', params: { id, numero: r.numero, paginas: String(r.paginas), firmadoEn: r.firmadoEn, correo: r.copiaPorCorreo ? '1' : '' } });
    } catch (e) {
      setError(e instanceof ApiError ? (e.code === 'DATOS_INVALIDOS' && e.campos?.[0] ? e.campos[0].problema : e.message) : 'Ocurrió un error.');
      if (e instanceof ApiError && e.code.startsWith('OTP')) setCodigo('');
    } finally { setFirmando(false); }
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Sin «deslizar para volver»: en iOS 26 el gesto cubre toda la pantalla y se confunde con la firma */}
      <Stack.Screen options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TopBar titulo="Firma tu contrato" />
        <ScrollView contentContainerStyle={s.body} scrollEnabled={scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.p}>Dibuja tu firma con el dedo dentro del recuadro.</Text>
          <View onTouchStart={() => setScroll(false)} onTouchEnd={() => setScroll(true)} onTouchCancel={() => setScroll(true)}>
            <PadFirma onCambio={setFirma} nombre={firmante} />
          </View>
          <Text style={s.label}>Código de firma enviado por WhatsApp</Text>
          {!!aviso && <Text style={s.aviso}>{aviso}</Text>}
          <Otp valor={codigo} onCambio={setCodigo} espera={espera} onReenviar={pedirCodigo} autoFocus={false} />
          <View style={s.info}>
            <Fingerprint size={18} color={colors.navy} />
            <Text style={s.infoT}>Guardamos fecha y hora, IP, teléfono verificado y la huella digital del documento como evidencia de tu firma.</Text>
          </View>
          {!!error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
        <View style={s.bottom}><Boton title="Firmar contrato" onPress={firmar} loading={firmando} disabled={!firma || codigo.length !== 6} /></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  body: { padding: 20, paddingTop: 6, gap: 12 },
  p: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink2 },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginTop: 4 },
  aviso: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, marginTop: -6 },
  info: { flexDirection: 'row', gap: 10, backgroundColor: colors.white, borderRadius: 18, padding: 14, alignItems: 'flex-start' },
  infoT: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.ink3, lineHeight: 18 },
  error: { fontFamily: fonts.semibold, color: colors.red, fontSize: 13, textAlign: 'center' },
  bottom: { padding: 20, paddingTop: 8 },
});
