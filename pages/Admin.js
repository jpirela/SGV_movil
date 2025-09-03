import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

const DATA_DIR = FileSystem.documentDirectory + 'data/';
const CLIENTES_PATH = `${DATA_DIR}clientes.json`;

export default function Admin() {
  const navigation = useNavigation();
  const [working, setWorking] = useState(false);

  const reiniciarSincronizacion = async () => {
    try {
      setWorking(true);
      // Leer clientes locales
      const info = await FileSystem.getInfoAsync(CLIENTES_PATH);
      if (!info.exists) {
        Alert.alert('Listo', 'No hay clientes almacenados');
        return;
      }
      const content = await FileSystem.readAsStringAsync(CLIENTES_PATH);
      const clientes = content ? JSON.parse(content) : [];

      const actualizados = (Array.isArray(clientes) ? clientes : []).map(c => ({
        ...c,
        fechaSincronizacion: '',
      }));

      await FileSystem.writeAsStringAsync(CLIENTES_PATH, JSON.stringify(actualizados, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Éxito', 'Se reinició la sincronización de todos los clientes');
    } catch (e) {
      Alert.alert('Error', 'No se pudo reiniciar la sincronización');
    } finally {
      setWorking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <TouchableOpacity style={[styles.bigButton, working && styles.disabled]} onPress={reiniciarSincronizacion} disabled={working}>
        <Text style={styles.bigButtonText}>{working ? 'Procesando...' : 'Reiniciar Sincronizacion'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.bigButton, styles.danger]} onPress={() => Alert.alert('Pendiente', 'Eliminar Usuario aún no implementado')}>
        <Text style={styles.bigButtonText}>Eliminar Usuario</Text>
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

