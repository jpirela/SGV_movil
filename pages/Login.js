import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import { setBaseUrl, syncOnStartup } from '../utils/syncDataFS';

export default function Login() {
  const navigation = useNavigation();
  const { AUTENTICACION, URL_BASE } = Constants.expoConfig?.extra || {};

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(URL_BASE || '');
  const [loading, setLoading] = useState(false);

  const validarCampos = () => {
    if (!usuario.trim() || !password.trim() || !apiUrl.trim()) {
      Alert.alert('Validación', 'Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const verificarCredenciales = () => {
    // Estructura esperada en app.config.js:
    // AUTENTICACION: { user: { user, password }, admin: { user, password } }
    const userCfg = AUTENTICACION?.user;
    const adminCfg = AUTENTICACION?.admin;

    const esUser = userCfg && usuario === userCfg.user && password === userCfg.password;
    const esAdmin = adminCfg && usuario === adminCfg.user && password === adminCfg.password;

    if (!esUser && !esAdmin) return null;
    return esAdmin ? 'admin' : 'user';
  };

  const onAceptar = async () => {
    if (!validarCampos()) return;

    const rol = verificarCredenciales();
    if (!rol) {
      Alert.alert('Aviso', 'Error de acceso: usuario o contraseña invalida');
      return;
    }

    try {
      setLoading(true);
      await setBaseUrl(apiUrl);
      await syncOnStartup();

      if (rol === 'admin') {
        navigation.reset({ index: 0, routes: [{ name: 'Admin' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Inicio' }] });
      }
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un error durante la autenticación/sincronización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Bienvenido</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Usuario</Text>
        <TextInput
          style={styles.input}
          value={usuario}
          onChangeText={setUsuario}
          autoCapitalize="none"
          placeholder="Ingrese su usuario"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Ingrese su contraseña"
        />

        <Text style={styles.label}>URL de la API</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="http://IP:PUERTO/api"
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={onAceptar} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Procesando...' : 'Aceptar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 20,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 225,
    height: 100,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

