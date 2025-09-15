import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncOnStartup, leerModeloFS, initModelos } from '../utils/syncDataFS';
import { getApiBaseUrlOrDefault, DEFAULT_URL_BASE} from '../utils/config';
import { loadMasterDataFromSync } from '../utils/dataCache';
import Constants from 'expo-constants';

export default function SplashScreen({ navigation }) {
  const [status, setStatus] = useState('Iniciando...');
  const [progress, setProgress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          setStatus('Sin conexión');
          setProgress('');
          setLoading(false);
          Alert.alert('📵 Sin conexión', 'Se omite sincronización de clientes -> API');
          setTimeout(() => navigation.replace('Login'), 1500);
          return;
        }

        // ✅ Trae la URL base desde config.js
        const baseUrl = (await getApiBaseUrlOrDefault()).replace(/\/api$/, '');

        // sincronización de archivos maestros
        (async () => {
          try {
            // Inicializar modelos antes de sincronizar
            setStatus('Inicializando...');
            const modelosLista = Constants.expoConfig?.extra?.MODELOS || [];
            console.log('🔧 Inicializando modelos:', modelosLista);
            initModelos(modelosLista);
            
            setStatus('Sincronizando datos maestros...');
            const datosLeidos = await syncOnStartup((msg, count, total) => {
              setStatus(msg);
              if (count && total) {
                setProgress(`${count} / ${total} modelos sincronizados`);
              }
            });
            
            // Cargar datos en cache usando los datos ya leídos (OPTIMIZADO)
            setStatus('Cargando datos en cache...');
            setProgress('');
            await loadMasterDataFromSync(datosLeidos);
            
            setStatus('Listo');
            setLoading(false);
          } catch (e) {
            console.log('⚠️ Error en syncOnStartup:', e.message);
            setStatus('Error en sincronización');
            setLoading(false);
          }
        })();

        // Verificación de conectividad del servidor (usando endpoint sin datos)
        if (DEFAULT_URL_BASE === baseUrl) {
          (async () => {
            try {
              // Verificar conectividad con endpoint que devuelve 'Bienvenido'
              const response = await fetch(baseUrl);
              const text = await response.text();
              if (text.includes('Bienvenido')) {
                setStatus('Conectado');
              } else {
                setStatus('Error de conexión');
                setProgress('');
                setLoading(false);
                Alert.alert('⚠️ Error de conexión', 'El servidor no respondió como se esperaba.');
              }
            } catch (err) {
              setStatus('Error de conexión');
              setProgress('');
              setLoading(false);
              Alert.alert('⚠️ Error de conexión', 'No se pudo contactar con el servidor.');
            }
          })();
        } else {
          setStatus('Conectado');
        }
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      } catch (error) {
        setStatus('Error de conexión');
        setProgress('');
        setLoading(false);
        Alert.alert('⚠️ Error de conexión', 'Ocurrió un problema al verificar la conexión.');
        setTimeout(() => navigation.replace('Login'), 1500);
      }
    };

    checkConnection();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon.png')} style={styles.logo} />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />}
      <Text style={styles.text}>{status}</Text>
      {progress !== '' && <Text style={styles.progress}>{progress}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  logo: { width: 100, height: 100, marginBottom: 30, resizeMode: 'contain' },
  spinner: { marginBottom: 20 },
  text: { fontSize: 18, fontWeight: '500', textAlign: 'center' },
  progress: { fontSize: 16, marginTop: 5, color: '#555' },
});
