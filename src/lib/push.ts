import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

/**
 * Avisos push (identidad aprobada, contrato firmado…). Necesita el proyecto de EAS (projectId);
 * mientras no exista, la app funciona igual y los avisos quedan en Notificaciones.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const K = 'tc.push';
export async function registrarPush() {
  try {
    if (!Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return;
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Avisos', importance: Notifications.AndroidImportance.DEFAULT });
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if ((await SecureStore.getItemAsync(K)) === token) return;
    await api('/v1/cuenta/notificaciones/dispositivo', { method: 'POST', auth: true, body: { token, plataforma: Platform.OS === 'ios' ? 'ios' : 'android' } });
    await SecureStore.setItemAsync(K, token);
  } catch { /* sin permisos o sin conexión: se intenta en el próximo inicio */ }
}
export async function quitarPush() {
  const token = await SecureStore.getItemAsync(K);
  if (!token) return;
  try { await api('/v1/cuenta/notificaciones/dispositivo', { method: 'DELETE', auth: true, body: { token } }); } catch { /* sin conexión */ }
  await SecureStore.deleteItemAsync(K);
}
