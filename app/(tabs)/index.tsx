import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Clean Light Background */}
      <LinearGradient
        colors={['#FFFFFF', '#F2F5F8']} // Soft white to very light gray/blue
        style={StyleSheet.absoluteFill}
      />
      
      {/* Subtle Decorative Blur Circles for Glassmorphism Background Effect */}
      <View style={[styles.circleBlur, { top: -50, left: -50, backgroundColor: 'rgba(236, 31, 39, 0.08)' }]} />
      <View style={[styles.circleBlur, { bottom: 100, right: -50, backgroundColor: 'rgba(5, 31, 95, 0.08)' }]} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, Vendedor</Text>
            <Text style={styles.date}>Martes, 5 de Mayo</Text>
          </View>
          <View style={styles.avatarContainer}>
            <LinearGradient colors={['#051F5F', '#004A99']} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>VD</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Main Glassmorphism Card (Light Theme) */}
        <View style={styles.glassContainer}>
          <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="light" style={styles.glassCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cardHeader}>
              <FontAwesome5 name="map-marker-alt" size={20} color="#EC1F27" />
              <Text style={styles.cardTitle}>Tracking Activo</Text>
            </View>
            <Text style={styles.statusText}>Tu ruta está siendo monitoreada de forma segura.</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Visitas Hoy</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#EC1F27' }]}>4</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Action Buttons */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={() => router.push('/evidencia')}>
            <LinearGradient colors={['#004A99', '#051F5F']} style={styles.actionGradient}>
              <Feather name="camera" size={28} color="#fff" />
              <Text style={styles.actionText}>Nueva Evidencia</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={['#EC1F27', '#b3151b']} style={styles.actionGradient}>
              <Feather name="check-square" size={28} color="#fff" />
              <Text style={styles.actionText}>Check-in Visita</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={['#ffffff', '#f5f5f5']} style={styles.actionGradientSecondary}>
              <Feather name="map" size={28} color="#051F5F" />
              <Text style={styles.actionTextSecondary}>Ruta del Día</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
            <LinearGradient colors={['#ffffff', '#f5f5f5']} style={styles.actionGradientSecondary}>
              <Feather name="bar-chart-2" size={28} color="#051F5F" />
              <Text style={styles.actionTextSecondary}>Métricas</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  circleBlur: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#051F5F', // Navy Blue
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  avatarContainer: {
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  glassContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 35,
    borderWidth: 1,
    borderColor: 'rgba(5, 31, 95, 0.1)',
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  glassCard: {
    padding: 25,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051F5F',
    marginLeft: 10,
  },
  statusText: {
    color: '#555555',
    fontSize: 14,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 31, 95, 0.04)',
    borderRadius: 16,
    padding: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(5, 31, 95, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#051F5F',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#051F5F',
    marginBottom: 15,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 55) / 2,
    height: 110,
    marginBottom: 15,
    borderRadius: 20,
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  actionGradient: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  actionGradientSecondary: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(5, 31, 95, 0.1)',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  actionTextSecondary: {
    color: '#051F5F',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
