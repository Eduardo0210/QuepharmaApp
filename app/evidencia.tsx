import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Platform, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Alert 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../constants/api';

export default function EvidenciaScreen() {
  const router = useRouter();
  const { idPOI, sNombre, idUsuario } = useLocalSearchParams();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  
  // Estados del Formulario
  const [photo, setPhoto] = useState<any>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [nombreEncargado, setNombreEncargado] = useState('');
  const [esCliente, setEsCliente] = useState<boolean | null>(null); // null = sin elegir, true = Sí, false = No
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      // Solicitar permisos de GPS en cuanto abre la pantalla
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('El permiso para acceder a la ubicación fue denegado.');
        Alert.alert("Permiso de GPS Necesario", "Se requiere el GPS para validar las coordenadas del negocio.");
        return;
      }
      // Obtener ubicación GPS actual
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation);
    })();
  }, []);

  if (Platform.OS !== 'web' && !permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#051F5F" /></View>;
  }

  if (Platform.OS !== 'web' && !permission?.granted) {
    return (
      <View style={styles.center}>
        <Feather name="camera-off" size={48} color="#94a3b8" style={{ marginBottom: 20 }} />
        <Text style={styles.text}>Necesitamos tu permiso para usar la cámara y registrar la fachada del negocio.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsTakingPhoto(true);
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true, // Vital en base64 para la base de datos SQL
        });
        setPhoto(photoData);
      } catch (e) {
        console.error("Error al capturar foto:", e);
        Alert.alert("Error", "Ocurrió un error al capturar la fotografía.");
      }
      setIsTakingPhoto(false);
    }
  };

  const simulatePictureWeb = () => {
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    setPhoto({ 
      uri: `data:image/png;base64,${base64Image}`,
      base64: base64Image
    });
  };

  const uploadEvidence = async () => {
    // Validar foto obligatoria
    if (!photo) {
      Alert.alert("Foto Faltante", "Debes tomar una foto de la fachada del negocio para continuar.");
      return;
    }

    // Validar campos del formulario
    if (!nombreEncargado.trim()) {
      Alert.alert("Campo Obligatorio", "Por favor ingresa el nombre de la persona encargada del negocio.");
      return;
    }

    if (esCliente === null) {
      Alert.alert("Selección Obligatoria", "Por favor selecciona si el negocio es cliente Quepharma o no lo es.");
      return;
    }

    if (!location) {
      Alert.alert("GPS Inestable", "Esperando señal GPS para guardar las coordenadas precisas...");
      return;
    }

    setIsUploading(true);

    try {
      const API_URL = `${API_BASE_URL}/api/evidencias/upload`; 

      const payload = {
        idUsuario: idUsuario ? parseInt(idUsuario as string, 10) : 0,
        tipoEvidencia: 'Fachada',
        imagenBase64: photo.base64 || '',
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        nombreEncargado: nombreEncargado.trim(),
        esClienteQuepharma: esCliente,
        idPOI: idPOI ? parseInt(idPOI as string, 10) : null
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          "¡Registro Exitoso!",
          "La visita y la evidencia han sido cargadas exitosamente en el servidor de Quepharma.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error del Servidor', data.message || 'No se pudo guardar la evidencia.');
      }
    } catch (error) {
      console.error("Error al enviar evidencia:", error);
      Alert.alert('Error de Red', 'Fallo al comunicarse con el servidor de Quepharma. Revisa tu conexión.');
    } finally {
      setIsUploading(false);
    }
  };

  // VISTA DE FORMULARIO (TRAS CAPTURAR LA FOTO)
  if (photo) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false}>
          {/* Mitad superior: Previsualización de Foto */}
          <View style={styles.previewHeaderContainer}>
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <LinearGradient 
              colors={['rgba(0,0,0,0.6)', 'transparent']} 
              style={styles.previewGradientTop} 
            />
            
            {/* GPS Overlay */}
            <View style={styles.gpsOverlay}>
              <Feather name="map-pin" size={14} color="#ef4444" style={{ marginRight: 5 }} />
              <Text style={styles.gpsText}>
                {location 
                  ? `GPS: ${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}` 
                  : 'Obteniendo GPS...'}
              </Text>
            </View>

            {/* Retake Button */}
            <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
              <Feather name="rotate-ccw" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.retakeBtnText}>Repetir Foto</Text>
            </TouchableOpacity>
          </View>

          {/* Mitad inferior: Formulario Premium de Visita */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Registro de Visita</Text>
            <Text style={styles.formSubtitle}>{sNombre || "Establecimiento seleccionado"}</Text>

            {/* Campo 1: Nombre del Encargado */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Encargado</Text>
              <View style={styles.textInputWrapper}>
                <Feather name="user" size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Farm. Carlos Pérez"
                  placeholderTextColor="#94a3b8"
                  value={nombreEncargado}
                  onChangeText={setNombreEncargado}
                  maxLength={100}
                />
              </View>
            </View>

            {/* Campo 2: ¿Es cliente Quepharma? */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>¿Es cliente de Quepharma?</Text>
              <View style={styles.selectorContainer}>
                {/* Botón SÍ */}
                <TouchableOpacity 
                  style={[
                    styles.selectorOption, 
                    esCliente === true && styles.selectorActiveYes
                  ]}
                  onPress={() => setEsCliente(true)}
                  activeOpacity={0.8}
                >
                  <Feather 
                    name={esCliente === true ? "check-circle" : "circle"} 
                    size={16} 
                    color={esCliente === true ? "#fff" : "#94a3b8"} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.selectorText, 
                    esCliente === true && styles.selectorTextActive
                  ]}>
                    Sí, es cliente
                  </Text>
                </TouchableOpacity>

                {/* Botón NO */}
                <TouchableOpacity 
                  style={[
                    styles.selectorOption, 
                    esCliente === false && styles.selectorActiveNo
                  ]}
                  onPress={() => setEsCliente(false)}
                  activeOpacity={0.8}
                >
                  <Feather 
                    name={esCliente === false ? "x-circle" : "circle"} 
                    size={16} 
                    color={esCliente === false ? "#fff" : "#94a3b8"} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.selectorText, 
                    esCliente === false && styles.selectorTextActive
                  ]}>
                    No es cliente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de Enviar */}
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={uploadEvidence}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Guardar y Enviar Registro</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // VISTA DE CÁMARA (ANTES DE TOMAR LA FOTO)
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          {/* Botón de regreso */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Guía en pantalla para el promotor */}
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionText}>
              📸 Toma una foto de la fachada del negocio para iniciar el formulario
            </Text>
          </View>

          {/* Contenedor inferior de acciones */}
          <View style={styles.cameraControlsRow}>
            {/* Botón de Simulación para Pruebas en Web */}
            {Platform.OS === 'web' ? (
              <TouchableOpacity style={styles.webSimulateBtn} onPress={simulatePictureWeb}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Simular Captura Web</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            {/* Disparador Central */}
            <TouchableOpacity 
              style={styles.captureBtn} 
              onPress={takePicture}
              disabled={isTakingPhoto}
            >
              {isTakingPhoto ? (
                <ActivityIndicator color="#051F5F" size="large" />
              ) : (
                <View style={styles.captureInner} />
              )}
            </TouchableOpacity>

            <View style={{ width: 60 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboardContainer: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContainer: { flexGrow: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff', padding: 30 },
  text: { textAlign: 'center', marginBottom: 25, fontSize: 16, color: '#64748b', lineHeight: 24 },
  permissionBtn: { backgroundColor: '#051F5F', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  
  // Cámara
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'space-between', padding: 20 },
  backBtn: {
    marginTop: 40,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 24,
  },
  instructionBanner: {
    backgroundColor: 'rgba(5, 31, 95, 0.85)',
    padding: 15,
    borderRadius: 14,
    alignSelf: 'center',
    width: '90%',
  },
  instructionText: { color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cameraControlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  webSimulateBtn: { backgroundColor: '#e11d48', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10 },

  // Previsualización y Formulario
  previewHeaderContainer: { height: 260, position: 'relative', backgroundColor: '#e2e8f0' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  previewGradientTop: { ...StyleSheet.absoluteFillObject },
  gpsOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gpsText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  retakeBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retakeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Formulario
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -25,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  formSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  
  inputGroup: { marginTop: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, color: '#0f172a', fontSize: 15, fontWeight: '500' },

  selectorContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  selectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    height: 52,
  },
  selectorActiveYes: {
    borderColor: '#051F5F',
    backgroundColor: '#051F5F',
  },
  selectorActiveNo: {
    borderColor: '#e11d48',
    backgroundColor: '#e11d48',
  },
  selectorText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  selectorTextActive: { color: '#ffffff' },

  submitBtn: {
    backgroundColor: '#051F5F',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 36,
    shadowColor: '#051F5F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 }
});
