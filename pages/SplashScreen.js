// pages/SplashScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';

export default function SplashScreen({ navigation }) { // 👈 tomamos navigation de props
  const [status, setStatus] = useState('Iniciando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const netInfo = await NetInfo.fetch();

        if (!netInfo.isConnected) {
          Alert.alert('📵 Sin conexión. Se omite sincronización de clientes -> API');
          setStatus('Sin conexión');
          setLoading(false);
          // Redirigir aunque no haya conexión
          setTimeout(() => navigation.replace('Login'), 1500);
          return;
        }

        const { URL_BASE } = Constants.expoConfig.extra;
        const baseUrl = URL_BASE.endsWith('/api') ? URL_BASE.replace(/\/api$/, '') : URL_BASE;

        const response = await fetch(baseUrl);
        const text = await response.text();

        if (text.includes('Bienvenido')) {
          setStatus('Conectado');
        } else {
          setStatus('Error de conexión');
        }

        // Esperar un poco y pasar al Login
        setTimeout(() => navigation.replace('Login'), 1500);

      } catch (error) {
        setStatus('Error de conexión');
        setTimeout(() => navigation.replace('Login'), 1500);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />}
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  spinner: {
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
});
