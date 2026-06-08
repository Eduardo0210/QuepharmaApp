import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function MapComponent({ mapRegion, polylineCoordinates, puntosInteres }) {
  if (Platform.OS === 'web') {
    const API_KEY = "AIzaSyBd9IlSsPDnzSc-I-hFwYI8akkjv-zfzOQ";
    
    // Construir la URL del Static Map
    let staticUrl = `https://maps.googleapis.com/maps/api/staticmap?size=800x600&key=${API_KEY}`;
    
    if (mapRegion) {
        staticUrl += `&center=${mapRegion.latitude},${mapRegion.longitude}&zoom=13`;
    }

    // Agregar la polilínea si existe
    if (polylineCoordinates && polylineCoordinates.length > 0) {
        const path = polylineCoordinates.map(c => `${c.latitude},${c.longitude}`).join('|');
        staticUrl += `&path=color:0x1a237eff|weight:4|${path}`;
    }

    // Agregar los marcadores
    if (puntosInteres && puntosInteres.length > 0) {
        puntosInteres.forEach(poi => {
            const color = poi.bVisitado ? 'green' : 'red';
            const label = poi.iOrden ? `label:${poi.iOrden}|` : '';
            staticUrl += `&markers=color:${color}|${label}${poi.dLatitud},${poi.dLongitud}`;
        });
    }

    return (
      <View style={StyleSheet.absoluteFillObject}>
        <img 
          src={staticUrl} 
          alt="Mapa Web Estático" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <View style={styles.webOverlay}>
            <Text style={styles.webOverlayTitle}>🗺️ Previsualización Web (Google Static)</Text>
            <Text style={styles.webOverlayText}>En la app nativa (iOS/Android) este mapa será 100% interactivo.</Text>
        </View>
      </View>
    );
  }

  return (
    <MapView style={StyleSheet.absoluteFillObject} initialRegion={mapRegion}>
      <Polyline coordinates={polylineCoordinates} strokeColor="#1a237e" strokeWidth={5} />
      {puntosInteres && puntosInteres.map(poi => (
        <Marker 
          key={poi.idPOI || poi.sNombre}
          coordinate={{ latitude: poi.dLatitud, longitude: poi.dLongitud }}
          title={`${poi.iOrden || ''}. ${poi.sNombre}`}
          description={poi.sDireccion}
          pinColor={poi.bVisitado ? "green" : "tomato"}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  webOverlay: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  webOverlayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4
  },
  webOverlayText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  }
});
