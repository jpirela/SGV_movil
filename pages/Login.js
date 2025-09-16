// pages/Login.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { initModelos } from '../utils/syncDataFS'; // 👈 ajustado
import { setApiBaseUrl, getApiBaseUrlOrDefault, getAuthConfig } from '../utils/config';
import { useAppEnvironment } from '../hooks/useAppEnvironment'; 
import { useExpoHostIp } from '../hooks/useExpoHostIp';

export default function Login() {
  const navigation = useNavigation();
  const AUTENTICACION = getAuthConfig();
  const { isExpo } = useAppEnvironment();

  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const expoHost = useExpoHostIp(8080, '/api');

  useEffect(() => {
    if (isExpo && expoHost?.apiUrl) {
      setApiUrl(expoHost.apiUrl);
    } else {
      const cargarUrl = async () => {
        const url = await getApiBaseUrlOrDefault(); // 👈 sin URL_BASE
        setApiUrl(url);
      };
      cargarUrl();
    }  
  }, [isExpo, expoHost]);

  const validarCampos = () => {
    if (!usuario.trim() || !password.trim() || (isExpo && !apiUrl.trim())) {
      Alert.alert('Validación', 'Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const verificarCredenciales = () => {
    const userCfg = AUTENTICACION?.user;
    const adminCfg = AUTENTICACION?.admin;
    console.log('Configuración de autenticación:', AUTENTICACION);

    const esUser = userCfg && usuario === userCfg.user && password === userCfg.password;
    const esAdmin = adminCfg && usuario === adminCfg.user && password === adminCfg.password;

    if (!esUser && !esAdmin) return null;
    return esAdmin ? 'admin' : 'user';
  };

  const onAceptar = async () => {
    if (!validarCampos()) return;

    const rol = verificarCredenciales();
    if (!rol) {
      Alert.alert('Aviso', 'Error de acceso: usuario o contraseña inválida');
      return;
    }

    try {
      setLoading(true);

      // Guardar la URL dinámica si estamos en Expo
      if (isExpo) {
        const validUrl = await setApiBaseUrl(apiUrl);
        console.log('URL base válida y guardada:', validUrl);
      }

      // Inicializar modelos antes de sincronizar
      //initModelos(['clientes', 'categorias',  'preguntas', 'formas-pago', 'condiciones-pago', 'estados', 'municipios', 'parroquias', 'ciudades']); // 👈 ajusta según tu API

    } catch (e) {
      if (isExpo) {
        Alert.alert('Error', e.message || 'Ocurrió un error durante la autenticación/sincronización');
      } 
    } finally {
      setLoading(false);
    }
    navigation.reset({ index: 0, routes: [{ name: rol === 'admin' ? 'Admin' : 'Inicio' }] });
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

        {isExpo && (
          <>
            <Text style={styles.label}>URL de la API</Text>
            <TextInput
              style={styles.input}
              value={apiUrl}
              onChangeText={setApiUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="http://IP:PUERTO/api"
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onAceptar}
          disabled={loading}
        >
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
