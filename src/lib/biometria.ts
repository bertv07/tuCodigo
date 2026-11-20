import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

/** «Entrar con huella o Face ID» (pantallas 20 y 31). La preferencia se guarda en el llavero del teléfono. */
const K = 'tc.biometria';
export const biometria = {
  async disponible() { return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync()); },
  async activa() { return (await SecureStore.getItemAsync(K)) === '1' && (await this.disponible()); },
  async verificar(motivo: string) {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: motivo, cancelLabel: 'Cancelar', fallbackLabel: 'Usar código del teléfono' });
    return r.success;
  },
  async activar() { if (!(await this.verificar('Confirma para activar el acceso con huella o Face ID'))) return false; await SecureStore.setItemAsync(K, '1'); return true; },
  async desactivar() { await SecureStore.deleteItemAsync(K); },
};
