import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Clock, MessageCircle } from 'lucide-react-native';
import { OtpBoxes, Av } from './ds';
import { colors, fonts } from '../lib/theme';

/**
 * Código de verificación (6 casillas) con reenvío y opción de SMS (pantallas 04 y 14).
 * El campo real es invisible: permite que el teléfono autocomplete el código.
 */
export function Otp({ valor, onCambio, onCompleto, onReenviar, onSms, espera, autoFocus = true }: {
  valor: string; onCambio: (v: string) => void; onCompleto?: (v: string) => void;
  onReenviar?: () => void; onSms?: () => void; espera: number; autoFocus?: boolean;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <View style={{ gap: 12 }}>
      <OtpBoxes valor={valor} onPress={() => input.current?.focus()} />
      <TextInput ref={input} value={valor} autoFocus={autoFocus} maxLength={6} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp"
        onChangeText={v => { const d = v.replace(/\D/g, '').slice(0, 6); onCambio(d); if (d.length === 6) onCompleto?.(d); }} style={s.oculto} accessibilityLabel="Código de 6 dígitos" />
      <View style={s.reenvio}>
        <Clock size={14} color={colors.ink3} />
        {espera > 0
          ? <Text style={s.small}>Reenviar en 00:{String(espera).padStart(2, '0')}</Text>
          : <Pressable onPress={onReenviar} hitSlop={8}><Text style={s.link}>Reenviar código</Text></Pressable>}
      </View>
      {onSms && (
        <View style={s.sms}>
          <Av Icono={MessageCircle} tono="green" size={36} />
          <Text style={s.smsT}>¿No te llegó por WhatsApp? </Text>
          <Pressable onPress={onSms} hitSlop={8} disabled={espera > 0}><Text style={[s.link, espera > 0 && { opacity: 0.45 }]}>Recibir por SMS</Text></Pressable>
        </View>
      )}
    </View>
  );
}

/** Cuenta regresiva de reenvío (1 minuto). */
export function useEspera(inicial = 0) {
  const [espera, setEspera] = useState(inicial);
  useEffect(() => { if (espera <= 0) return; const t = setTimeout(() => setEspera(espera - 1), 1000); return () => clearTimeout(t); }, [espera]);
  return [espera, setEspera] as const;
}

const s = StyleSheet.create({
  oculto: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  reenvio: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  small: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
  link: { fontFamily: fonts.bold, fontSize: 13, color: colors.navy, textDecorationLine: 'underline', textDecorationColor: colors.gold },
  sms: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: 12, gap: 8, flexWrap: 'wrap' },
  smsT: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink3 },
});
