import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';

export default function GeocercasScreen() {
  const { idUsuario } = useLocalSearchParams();
  const router = useRouter();
  const [geocercas, setGeocercas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarGeocercasAsignadas();
  }, []);

  const cargarGeocercasAsignadas = async () => {
    try {
      setLoading(true);
      // Llamada real al backend
      const URL_API = API_BASE_URL;
      const res = await fetch(`${URL_API}/promotoresapp/geocercas?idUsuario=${idUsuario}`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setGeocercas(data);
      } else {
        setGeocercas([]);
      }
    } catch (error) {
      Alert.alert("Error", "Fallo al cargar los territorios asignados.");
    } finally {
      setLoading(false);
    }
  };

  const generarRuta = (idGeocerca) => {
    router.push({ pathname: '/ruta', params: { idGeocerca, idUsuario } });
  };

  const renderItem = ({ item }) => {
    const esVigente = new Date(item.fFechaVencimiento) >= new Date().setHours(0,0,0,0);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: item.sColor || '#1a237e' }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.sNombre}</Text>
            <Text style={styles.subtitle}>
              Vigencia: {new Date(item.fFechaVencimiento).toLocaleDateString('es-MX')}
            </Text>
          </View>
        </View>

        {esVigente ? (
          <TouchableOpacity style={styles.button} onPress={() => generarRuta(item.idGeocerca)}>
            <Text style={styles.buttonText}>Generar Ruta de Hoy</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Territorio Caducado</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#ff5722" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Territorios</Text>
        <Text style={styles.headerSubtitle}>Geocercas asignadas para tu gestión</Text>
      </View>

      <FlatList 
        data={geocercas}
        keyExtractor={(item) => item.idGeocerca.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No tienes territorios asignados.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  header: { padding: 20, backgroundColor: '#1a237e', paddingTop: 60, paddingBottom: 25 },
  headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  headerSubtitle: { color: '#e0e7ff', marginTop: 6, fontSize: 16, fontWeight: '500' },
  listContainer: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  button: { backgroundColor: '#ff5722', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  expiredBadge: { backgroundColor: '#fee2e2', padding: 15, borderRadius: 12, alignItems: 'center' },
  expiredText: { color: '#b91c1c', fontSize: 16, fontWeight: 'bold' },
  emptyText: { fontSize: 16, color: '#64748b' }
});
