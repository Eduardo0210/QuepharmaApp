import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function HomeScreen() {
  const { idUsuario } = useLocalSearchParams();
  const router = useRouter();

  const handleMisRutas = () => {
    // Redirigir a las geocercas pasando el idUsuario
    router.push(`/geocercas?idUsuario=${idUsuario}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inicio</Text>
        <Text style={styles.headerSubtitle}>Bienvenido al panel de Promotores</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Opción Principal: Mis Rutas */}
        <TouchableOpacity style={[styles.card, styles.primaryCard]} onPress={handleMisRutas}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📍</Text>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>Mis Rutas</Text>
              <Text style={styles.cardSubtitle}>Consulta tus territorios y genera rutas</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Otras opciones ficticias/secundarias para hacer bulto */}
        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>Mis Estadísticas</Text>
              <Text style={styles.cardSubtitle}>Revisa tu desempeño semanal</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔔</Text>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>Notificaciones</Text>
              <Text style={styles.cardSubtitle}>Avisos y comunicados del administrador</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👤</Text>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.cardTitle}>Mi Perfil</Text>
              <Text style={styles.cardSubtitle}>Actualiza tus datos o cierra sesión</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 20, backgroundColor: '#1a237e', paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  headerSubtitle: { color: '#e0e7ff', marginTop: 8, fontSize: 16, fontWeight: '500' },
  content: { padding: 20, paddingTop: 30 },
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
  primaryCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#ff5722',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 32 },
  cardTitle: { fontSize: 19, fontWeight: 'bold', color: '#1e293b' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
});
