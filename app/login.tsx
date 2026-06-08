import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../constants/api';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    console.log("Botón presionado. Usuario:", usuario, "Password:", password);
    if (!usuario || !password) {
      console.log("Faltan datos");
      try { Alert.alert("Error", "Por favor ingresa tu usuario y contraseña"); } catch(e) { window.alert("Por favor ingresa tu usuario y contraseña"); }
      return;
    }

    try {
      // 1. Llamada a la API real del backend (APIQPFramework)
      const URL_API = API_BASE_URL;
      const response = await fetch(`${URL_API}/login/iniciosesion?usuario=${usuario}&contrasena=${password}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
         if (data[0].idRespuesta === 1) {
            console.log("Credenciales incorrectas");
            try { Alert.alert("Error", "Valide su usuario o contraseña"); } catch(e) { window.alert("Valide su usuario o contraseña"); }
         } else {
            console.log("Login exitoso. ID Usuario:", data[0].idUsuario);
            const idUsuario = data[0].idUsuario;
            // Avanzamos al Home (Menú principal) pasándole el ID
            router.push(`/home?idUsuario=${idUsuario}`);
         }
      } else {
         console.log("Respuesta vacía del servidor");
         try { Alert.alert("Error", "Ocurrió un error inesperado al iniciar sesión."); } catch(e) { window.alert("Error en inicio de sesión."); }
      }
    } catch (error) {
      console.log("Error en login:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      try { 
        Alert.alert("Error de Conexión", `No se pudo conectar con el servidor central.\n\nDetalle: ${errorMsg}\nURL: ${API_BASE_URL}`); 
      } catch(e) { 
        window.alert(`No se pudo conectar con el servidor central. Detalle: ${errorMsg}`); 
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quepharma Promotores</Text>
      
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Usuario de Red"
          placeholderTextColor="#999"
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Jornada</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a237e',
    marginBottom: 40,
    textAlign: 'center'
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  button: {
    backgroundColor: '#ff5722',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
