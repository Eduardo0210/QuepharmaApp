import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Esta versión se carga automáticamente cuando Expo detecta que corres la app en la Web (Chrome/Edge)
export default function MapComponent({ mapRegion, polylineCoordinates, puntosInteres }) {
  return (
    <View style={styles.center}>
      <Text style={styles.textBold}>⚠️ Vista Web Detectada</Text>
      <Text style={styles.text}>El mapa de navegación para los promotores es un componente nativo (GPS).</Text>
      <Text style={styles.text}>Solo es visible cuando abres la App en un celular físico (Android/iOS) o en un emulador.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    padding: 20
  },
  textBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10
  },
  text: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 5
  }
});
