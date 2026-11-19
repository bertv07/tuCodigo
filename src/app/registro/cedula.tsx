import { router, useLocalSearchParams } from 'expo-router';
import { Captura } from '../../components/Captura';

/** 05 · Foto de la cédula */
export default function Cedula() {
  const { volver } = useLocalSearchParams<{ volver?: string }>();
  return <Captura tipo="cedula" paso={3} titulo="Foto de tu cédula"
    ayuda="Ubica tu cédula laminada dentro del marco, con buena luz y sin reflejos."
    onListo={() => (volver ? router.back() : router.push('/registro/selfie'))} />;
}
