import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Switch, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import MapComponent from '../components/MapComponent';
import { API_BASE_URL } from '../constants/api';

export default function RutaScreen() {
  const { idGeocerca, idUsuario } = useLocalSearchParams();
  const router = useRouter();
  const [rutaData, setRutaData] = useState(null);
  const [puntosInteres, setPuntosInteres] = useState([]);
  const [loading, setLoading] = useState(true);

  // GPS en tiempo real
  const [userLocation, setUserLocation] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [mockGPS, setMockGPS] = useState(false);

  // Modal agregar farmacia
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevaFarmacia, setNuevaFarmacia] = useState({ nombre: '', direccion: '' });
  const [guardandoFarmacia, setGuardandoFarmacia] = useState(false);

  // Cargar ruta asignada
  const cargarRutaAsignada = async () => {
    try {
      setLoading(true);
      
      // Mock data inicial
      setRutaData({ idGeocerca, sNombreGeocerca: 'Territorio Asignado' });
      
      // Llamada al backend
      const URL_API = API_BASE_URL;
      const resPOI = await fetch(`${URL_API}/promotoresapp/geocercas/${idGeocerca}/poi`);
      const poiData = await resPOI.json();
      
      if (poiData && poiData.length > 0) {
        setPuntosInteres(poiData);
      } else {
        setPuntosInteres([]);
      }
    } catch (error) {
      Alert.alert(
        "Error de Conexión",
        "No se pudieron cargar las farmacias de tu ruta. Verifica tu conexión e intenta de nuevo.",
        [{ text: "Reintentar", onPress: cargarRutaAsignada }, { text: "Cancelar" }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Recargar datos cada vez que la pantalla tenga foco (por ejemplo, al volver de tomar la foto)
  useFocusEffect(
    useCallback(() => {
      cargarRutaAsignada();
    }, [idGeocerca])
  );

  // Activar y observar ubicación GPS en vivo
  useEffect(() => {
    let watchSubscription = null;

    const startGpsTracking = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permiso Denegado", "Se necesita acceso al GPS para calcular tu cercanía a los puntos.");
          return;
        }

        setGpsEnabled(true);

        // Obtener la ubicación inicial de inmediato
        let initialLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        if (!mockGPS) {
          setUserLocation(initialLoc.coords);
        }

        // Suscribirse a actualizaciones en vivo
        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 4000,   // Cada 4 segundos
            distanceInterval: 8   // Cada 8 metros
          },
          (loc) => {
            if (!mockGPS) {
              setUserLocation(loc.coords);
            }
          }
        );
      } catch (error) {
        console.error("Error al iniciar rastreo GPS:", error);
      }
    };

    startGpsTracking();

    return () => {
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, [mockGPS]);

  // Fórmula de Haversine para calcular distancia en metros
  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la tierra en metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const agregarFarmacia = async () => {
    if (!nuevaFarmacia.nombre.trim()) {
      Alert.alert("Campo Obligatorio", "Por favor ingresa el nombre de la farmacia.");
      return;
    }
    if (!userLocation) {
      Alert.alert("GPS Inestable", "Esperando señal GPS para registrar las coordenadas de la farmacia.");
      return;
    }
    setGuardandoFarmacia(true);
    try {
      const res = await fetch(`${API_BASE_URL}/promotoresapp/geocercas/${idGeocerca}/poi/agregar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sNombre: nuevaFarmacia.nombre.trim(),
          sDireccion: nuevaFarmacia.direccion.trim(),
          dLatitud: userLocation.latitude,
          dLongitud: userLocation.longitude,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModalVisible(false);
        setNuevaFarmacia({ nombre: '', direccion: '' });
        cargarRutaAsignada();
        Alert.alert("¡Farmacia Agregada!", `"${nuevaFarmacia.nombre.trim()}" se añadió a tu ruta de hoy.`);
      } else {
        Alert.alert("Error", data.message || "No se pudo agregar la farmacia.");
      }
    } catch (error) {
      Alert.alert("Error de Red", "No se pudo conectar con el servidor.");
    } finally {
      setGuardandoFarmacia(false);
    }
  };

  // Iniciar el formulario enviando el idPOI
  const iniciarFormularioVisita = (poi) => {
    router.push({
      pathname: '/evidencia',
      params: {
        idPOI: poi.idPOI,
        sNombre: poi.sNombre,
        idUsuario: idUsuario
      }
    });
  };

  const renderItem = ({ item }) => {
    // Calcular distancia real o mock
    const lat = userLocation?.latitude;
    const lng = userLocation?.longitude;
    const distancia = (lat && lng) 
      ? getDistanceInMeters(lat, lng, item.dLatitud, item.dLongitud) 
      : null;

    // Rango de tolerancia de 50 metros
    const enRango = distancia !== null && distancia <= 50;

    return (
      <View style={[
        styles.poiCard, 
        item.bVisitado && styles.poiCardVisited,
        enRango && !item.bVisitado && styles.poiCardInRange
      ]}>
        <View style={styles.poiHeader}>
          <View style={[styles.badge, item.bVisitado ? styles.badgeVisited : styles.badgePending]}>
            <Text style={styles.badgeText}>{item.iOrden}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.poiName}>{item.sNombre}</Text>
            <Text style={styles.poiAddress}>{item.sDireccion}</Text>
            
            {/* Indicador de Distancia */}
            {!item.bVisitado && (
              <View style={styles.distanceRow}>
                <Feather 
                  name="navigation" 
                  size={13} 
                  color={enRango ? "#16a34a" : "#64748b"} 
                  style={{ marginRight: 5, transform: [{ rotate: '45deg' }] }} 
                />
                <Text style={[styles.distanceText, enRango && styles.distanceTextInRange]}>
                  {distancia !== null 
                    ? `A ${distancia.toFixed(0)} metros de ti` 
                    : "Calculando distancia GPS..."}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Simulador GPS para testing */}
        {mockGPS && !item.bVisitado && (
          <TouchableOpacity
            style={styles.mockButton}
            onPress={() => {
              setUserLocation({ latitude: item.dLatitud, longitude: item.dLongitud });
              Alert.alert("GPS Simulado", `Ubicación establecida en: ${item.sNombre}`);
            }}
          >
            <Feather name="crosshair" size={14} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={styles.mockButtonText}>Simular llegada aquí (Pruebas)</Text>
          </TouchableOpacity>
        )}

        {/* Acciones */}
        {item.bVisitado ? (
          <View style={styles.visitedBadge}>
            <Feather name="check-circle" size={16} color="#166534" style={{ marginRight: 8 }} />
            <Text style={styles.visitedBadgeText}>✓ Visitado (Evidencia Registrada)</Text>
          </View>
        ) : (
          <View>
            {enRango ? (
              <TouchableOpacity 
                style={styles.activeCheckButton} 
                onPress={() => iniciarFormularioVisita(item)}
              >
                <Feather name="camera" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.checkButtonText}>Comenzar Formulario y Visita</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledCheckButton}>
                <Feather name="lock" size={14} color="#94a3b8" style={{ marginRight: 8 }} />
                <Text style={styles.disabledButtonText}>
                  Fuera de Rango (Acércate a menos de 50m)
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#051F5F" />
        <Text style={styles.loadingText}>Cargando itinerario de trabajo...</Text>
      </View>
    );
  }

  if (!rutaData) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>No hay rutas asignadas</Text>
      </View>
    );
  }

  const polylineCoordinates = puntosInteres.map(p => ({
    latitude: p.dLatitud,
    longitude: p.dLongitud
  }));

  const mapRegion = polylineCoordinates.length > 0 ? {
    latitude: polylineCoordinates[0].latitude,
    longitude: polylineCoordinates[0].longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  } : null;

  return (
    <View style={styles.container}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{rutaData.sNombreGeocerca}</Text>
          <Text style={styles.headerSubtitle}>
            {puntosInteres.filter(p => p.bVisitado).length} de {puntosInteres.length} Farmacias Completadas
          </Text>
        </View>
        
        {/* Indicador de GPS */}
        <View style={styles.gpsIndicatorRow}>
          <View style={[styles.gpsDot, gpsEnabled ? styles.gpsDotActive : styles.gpsDotInactive]} />
          <Text style={styles.gpsIndicatorText}>{gpsEnabled ? "GPS ACTIVO" : "Buscando GPS..."}</Text>
        </View>
      </View>

      {/* Panel de Simulador GPS (Modo Desarrollo) */}
      <View style={styles.simulatorPanel}>
        <View style={styles.simulatorHeader}>
          <Feather name="tool" size={16} color="#b45309" style={{ marginRight: 8 }} />
          <Text style={styles.simulatorTitle}>Modo Desarrollo: Simulador GPS</Text>
        </View>
        <Switch
          value={mockGPS}
          onValueChange={(val) => {
            setMockGPS(val);
            if (!val) setUserLocation(null);
          }}
          trackColor={{ false: "#cbd5e1", true: "#f59e0b" }}
          thumbColor={mockGPS ? "#d97706" : "#f1f5f9"}
        />
      </View>

      <View style={styles.mapContainer}>
        {mapRegion ? (
          <MapComponent 
            mapRegion={mapRegion} 
            polylineCoordinates={polylineCoordinates} 
            puntosInteres={puntosInteres} 
          />
        ) : (
          <View style={styles.center}><Text>Mapa no disponible</Text></View>
        )}
      </View>

      {/* Lista interactiva debajo del mapa */}
      <FlatList
        data={puntosInteres}
        keyExtractor={(item) => item.idPOI.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón flotante para agregar farmacia */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Modal: Agregar Farmacia */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Farmacia a la Ruta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nombre de la Farmacia *</Text>
            <View style={styles.modalInputWrapper}>
              <Feather name="home" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Farmacia del Ahorro"
                placeholderTextColor="#94a3b8"
                value={nuevaFarmacia.nombre}
                onChangeText={(t) => setNuevaFarmacia(prev => ({ ...prev, nombre: t }))}
                maxLength={120}
              />
            </View>

            <Text style={styles.modalLabel}>Dirección (opcional)</Text>
            <View style={styles.modalInputWrapper}>
              <Feather name="map-pin" size={16} color="#94a3b8" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.modalInput}
                placeholder="Ej. Av. Principal 123"
                placeholderTextColor="#94a3b8"
                value={nuevaFarmacia.direccion}
                onChangeText={(t) => setNuevaFarmacia(prev => ({ ...prev, direccion: t }))}
                maxLength={200}
              />
            </View>

            <View style={styles.modalGpsRow}>
              <Feather name="navigation" size={13} color={userLocation ? "#16a34a" : "#ef4444"} style={{ marginRight: 6 }} />
              <Text style={[styles.modalGpsText, { color: userLocation ? "#16a34a" : "#ef4444" }]}>
                {userLocation
                  ? `GPS: ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`
                  : "GPS no disponible — activa el Simulador arriba"}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalSaveBtn, (!userLocation || guardandoFarmacia) && { opacity: 0.6 }]}
              onPress={agregarFarmacia}
              disabled={!userLocation || guardandoFarmacia}
            >
              {guardandoFarmacia ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="plus-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalSaveBtnText}>Agregar a la Ruta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#64748b', marginTop: 12 },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: '#051F5F', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#e2e8f0', marginTop: 4, fontSize: 14, fontWeight: '500' },
  gpsIndicatorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  gpsDotActive: { backgroundColor: '#22c55e' },
  gpsDotInactive: { backgroundColor: '#ef4444' },
  gpsIndicatorText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  
  simulatorPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  simulatorHeader: { flexDirection: 'row', alignItems: 'center' },
  simulatorTitle: { fontSize: 13, color: '#b45309', fontWeight: 'bold' },

  mapContainer: { height: '32%', width: '100%', backgroundColor: '#e2e8f0' },
  listContainer: { padding: 15, paddingBottom: 30 },
  poiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  poiCardVisited: { 
    backgroundColor: '#f8fafc', 
    borderColor: '#e2e8f0',
    opacity: 0.85 
  },
  poiCardInRange: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5
  },
  poiHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  badge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  badgePending: { backgroundColor: '#051F5F' },
  badgeVisited: { backgroundColor: '#16a34a' },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  poiName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  poiAddress: { fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 },
  
  distanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  distanceText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  distanceTextInRange: { color: '#16a34a', fontWeight: 'bold' },

  mockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  mockButtonText: { color: '#b45309', fontSize: 12, fontWeight: '600' },

  activeCheckButton: { 
    backgroundColor: '#051F5F', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12, 
    borderRadius: 10 
  },
  checkButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  disabledCheckButton: { 
    backgroundColor: '#f1f5f9', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  disabledButtonText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },

  visitedBadge: {
    backgroundColor: '#dcfce7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10
  },
  visitedBadgeText: { color: '#166534', fontWeight: 'bold', fontSize: 14 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#051F5F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 8, marginTop: 14 },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  modalInput: { flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '500' },
  modalGpsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 4 },
  modalGpsText: { fontSize: 12, fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: '#051F5F',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    marginTop: 22,
  },
  modalSaveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
