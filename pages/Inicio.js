// pages/Inicio.js
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { leerClientesLocales, guardarClientesLocales, eliminarRespuestasCliente } from '../utils/syncDataUniversal';
import { syncClientesPendientesFS } from '../utils/syncDataUniversal';
import eventBus from '../utils/eventBus'; // ✅ EventBus adaptado
import { storage, platformInfo } from '../utils/storage';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';

// Generador de UUID simple
const generateUUID = () => {
  return 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const icons = {
  verDatos: <MaterialCommunityIcons name="eye-outline" size={24} color="gray" />,
  eliminar: <MaterialCommunityIcons name="account-remove-outline" size={24} color="gray" />,
  agregar: <MaterialCommunityIcons name="account-plus-outline" size={24} color="gray" />,
  descargar: <MaterialCommunityIcons name="download" size={24} color="gray" />,
  salir: <MaterialCommunityIcons name="logout" size={24} color="gray" />,
  editar: <MaterialCommunityIcons name="account-edit-outline" size={24} color="gray" />,
};

const Inicio = () => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();

  const cargarClientes = useCallback(async () => {
    const data = await leerClientesLocales();
    setClientes(data);
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // 🔄 Escuchar cuando syncClientesPendientesFS actualice los clientes
  useEffect(() => {
    const handler = async () => {
      console.log("🔄 Refrescando lista de clientes desde Inicio.js (eventBus)");
      await cargarClientes();
    };

    eventBus.on('clientesActualizados', handler);
    return () => eventBus.off('clientesActualizados', handler);
  }, [cargarClientes]);

  // 🆕 Detectar cuando se regresa de AgregarCliente con un cliente guardado
  useFocusEffect(
    useCallback(() => {
      if (route.params?.handleGuardarCliente) {
        console.log(`🆕 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Cliente guardado exitosamente, actualizando lista...`);
        
        // Recargar la lista de clientes
        cargarClientes();
        
        // Limpiar el parámetro para evitar que se ejecute múltiples veces
        navigation.setParams({ handleGuardarCliente: false });
      }
    }, [route.params?.handleGuardarCliente, cargarClientes, navigation])
  );

  const filteredClientes = useMemo(() => {
    if (!searchText.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, clientes]);

  const handleAgregarCliente = () => {
    navigation.navigate('AgregarCliente'); // 👈 sin params
  };

  const handleVer = (idCliente) => {
    navigation.navigate('MostrarDatos', {
      idCliente
    });
  };

  const handleEditar = (idCliente) => {
    navigation.navigate('EditarDatos', {
      idCliente
    });
  };

  const handleEliminar = (idCliente) => {
    Alert.alert(
      'Confirmación',
      '¿Está seguro de eliminar al cliente seleccionado?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              await eliminarRespuestasCliente(idCliente);
              const nuevosClientes = clientes.filter(cliente => cliente.idCliente !== idCliente);
              setClientes(nuevosClientes);
              await guardarClientesLocales(nuevosClientes);
              console.log(`✅ Cliente ${idCliente} y sus respuestas eliminados correctamente`);
            } catch (error) {
              console.warn('Error al eliminar cliente y respuestas:', error);
              Alert.alert('Error', 'No se pudo completar la eliminación');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 🔄 Función centralizada para guardar y sincronizar clientes
  const handleGuardarCliente = async (clienteData, idExistente = null) => {
    setLoading(true);
    try {
      let nuevosClientes = [...clientes];

      if (idExistente) {
        // Editar cliente existente
        const index = nuevosClientes.findIndex(c => c.idCliente === idExistente);
        if (index >= 0) nuevosClientes[index] = clienteData;
      } else {
        // Agregar cliente nuevo
        nuevosClientes.push(clienteData);
      }

      // Guardar localmente
      await guardarClientesLocales(nuevosClientes);
      setClientes(nuevosClientes);

      // 🔄 Sincronizar clientes pendientes antes del alert
      const resultadoSync = await syncClientesPendientesFS();
      if (!resultadoSync.ok) {
        console.log('🔄 Sincronización parcial o fallida:', resultadoSync.razon);
      }

      setLoading(false);
      // Alert de éxito
      Alert.alert('✅ Datos sincronizados', 'El cliente ha sido registrado y sincronizado correctamente.');
    } catch (error) {
      setLoading(false);
      console.warn('Error al guardar cliente:', error);
      Alert.alert('Error', 'No se pudo guardar el cliente');
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        animationType={'none'}
        visible={loading}
        onRequestClose={() => {}}>
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator animating={loading} size="large" />
          </View>
        </View>
      </Modal>
      {/* Buscador y botón */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.actionBtn} onPress={handleAgregarCliente}>
          {icons.agregar}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={async () => {
            try {
              console.log(`📦 [${platformInfo.isWeb ? 'WEB' : 'MOBILE'}] Exportando datos...`);
              
              // Leer datos usando el sistema universal
              const clientesData = await storage.readJSON('clientes.json', []);
              const respuestasData = await storage.readJSON('respuestas.json', {});
              
              const clientesContent = JSON.stringify(clientesData, null, 2);
              const respuestasContent = JSON.stringify(respuestasData, null, 2);

              if (platformInfo.isWeb) {
                // En web, descargar archivos directamente
                const downloadFile = (content, filename) => {
                  const blob = new Blob([content], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                };
                
                downloadFile(clientesContent, 'Clientes.json');
                downloadFile(respuestasContent, 'Respuestas.json');
                
                Alert.alert('Éxito', 'Se han descargado los archivos de datos');
              } else {
                // En móvil, crear ZIP y compartir
                const zip = new JSZip();
                zip.file('Clientes.json', clientesContent);
                zip.file('Respuestas.json', respuestasContent);

                const zipContent = await zip.generateAsync({ type: 'base64' });
                const zipPath = storage.getPath('datos_exportados.zip');
                
                // Guardar el zip usando FileSystem para móvil
                const FileSystem = require('expo-file-system/legacy');
                await FileSystem.writeAsStringAsync(zipPath, zipContent, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                await Sharing.shareAsync(zipPath);
                Alert.alert('Éxito', 'Se generó el archivo ZIP con los datos');
              }
            } catch (error) {
              console.error('Error al exportar:', error);
              Alert.alert('Error', `No se pudo exportar los datos: ${error.message}`);
            }
          }}
        >
          {icons.descargar}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            Alert.alert(
              'Salir',
              '¿Desea salir del sistema?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  style: 'destructive',
                  onPress: () => {
                    // Cerrar la app (en Expo no es posible cerrar la app, así que se puede navegar al login o pantalla inicial)
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  },
                },
              ],
              { cancelable: true }
            );
          }}
        >
          <Text style={styles.addButtonText}>
            {icons.salir}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Encabezado */}
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Clientes</Text>
        <Text style={[styles.cell, styles.headerCell, { width: '25%' }]}>Acciones</Text>
      </View>

      {/* Lista */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {filteredClientes.map(cliente => {
          const uniqueKey = generateUUID();
          return (
            <TouchableOpacity 
              key={uniqueKey}
              id={cliente.idCliente?.toString()}
              style={[styles.row, cliente.idCliente === selectedRowId && styles.activeRow]}
              onPress={() => setSelectedRowId(cliente.idCliente)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cell, { flex: 1 }]}>
                {cliente.fechaSincronizacion === '' ? '⚠️' : '🌐'} {cliente.nombre}
              </Text>
              <View style={[styles.actionsCell, { width: '25%' }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleVer(cliente.idCliente)}>
                  {icons.verDatos}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditar(cliente.idCliente)}>
                  {icons.editar}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEliminar(cliente.idCliente)}>
                  {icons.eliminar}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
        {filteredClientes.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Inicio;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchContainer: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 10 },
  addButton: { backgroundColor: '#0a84ff', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', padding: 10, backgroundColor: '#f0f0f0' },
  headerCell: { fontWeight: 'bold' },
  cell: { fontSize: 16 },
  row: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
  activeRow: { backgroundColor: '#d0ebff' },
  actionsCell: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn: { padding: 5 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: 50 },
  emptyRow: { padding: 20, alignItems: 'center' },
  emptyText: { fontStyle: 'italic', color: '#999' },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: '#00000040'
  },
  activityIndicatorWrapper: {
    backgroundColor: '#FFFFFF',
    height: 100,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around'
  }
});
