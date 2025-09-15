import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { storage, platformInfo } from '../utils/storage';

export default function Admin() {
  const navigation = useNavigation();
  const [working, setWorking] = useState(false);

  const reiniciarSincronizacion = async () => {
    try {
      setWorking(true);
      console.log(`🔄 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Reiniciando sincronización...`);
      
      // Leer clientes locales
      const clientes = await storage.readJSON('clientes.json', []);
      if (!Array.isArray(clientes) || clientes.length === 0) {
        Alert.alert('Listo', 'No hay clientes almacenados');
        return;
      }

      const actualizados = clientes.map(c => ({
        ...c,
        fechaSincronizacion: '',
      }));

      await storage.writeJSON('clientes.json', actualizados);

      Alert.alert('Éxito', `Se reinició la sincronización de ${clientes.length} clientes`);
    } catch (e) {
      console.error('Error reiniciando sincronización:', e);
      Alert.alert('Error', 'No se pudo reiniciar la sincronización');
    } finally {
      setWorking(false);
    }
  };

  const eliminarTodosLosArchivos = async () => {
    try {
      setWorking(true);
      console.log(`🗑️ [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Eliminando todos los archivos...`);
      
      // Eliminar contenido de Clientes.json
      await storage.writeJSON('clientes.json', []);
      
      // Eliminar contenido de Respuestas.json (como objeto, no array)
      await storage.writeJSON('respuestas.json', {});
      
      console.log('Eliminados todos los archivos');
      Alert.alert('Éxito', `[${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Se han eliminado todos los datos de clientes y respuestas`);
    } catch (e) {
      console.error('Error al eliminar archivos:', e);
      Alert.alert('Error', 'No se pudieron eliminar todos los archivos');
    } finally {
      setWorking(false);
    }
  };

  const confirmarEliminacion = () => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Está seguro de que desea eliminar todos los usuarios y respuestas? Esta acción no se puede deshacer.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: eliminarTodosLosArchivos,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <TouchableOpacity style={[styles.bigButton, working && styles.disabled]} onPress={reiniciarSincronizacion} disabled={working}>
        <Text style={styles.bigButtonText}>{working ? 'Procesando...' : 'Reiniciar Sincronizacion'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.bigButton, styles.danger, working && styles.disabled]} onPress={confirmarEliminacion} disabled={working}>
        <Text style={styles.bigButtonText}>{working ? 'Procesando...' : 'Eliminar Todos los Datos'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  logo: {
    width: 225,
    height: 100,
  },
  bigButton: {
    backgroundColor: '#007bff',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  danger: {
    backgroundColor: '#dc3545',
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  },
});

