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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { leerClientesLocales, guardarClientesLocales, eliminarRespuestasCliente } from '../utils/syncDataFS';
import { syncClientesPendientesFS } from '../utils/syncDataFS';
import eventBus from '../utils/eventBus'; // ✅ EventBus adaptado

// Generador de UUID simple
const generateUUID = () => {
  return 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const icons = {
  verDatos: <MaterialCommunityIcons name="eye-outline" size={24} color="gray" />,
  eliminar: <MaterialCommunityIcons name="account-remove-outline" size={24} color="gray" />,
};

const Inicio = () => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

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

  const filteredClientes = useMemo(() => {
    if (!searchText.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, clientes]);

  const handleAgregarCliente = () => {
    navigation.navigate('AgregarCliente'); // 👈 sin params
  };

  const handleEditar = (idCliente) => {
    navigation.navigate('MostrarDatos', {
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

      // Alert de éxito
      Alert.alert('✅ Datos guardados exitosamente', 'El cliente ha sido registrado y sincronizado correctamente.');
    } catch (error) {
      console.warn('Error al guardar cliente:', error);
      Alert.alert('Error', 'No se pudo guardar el cliente');
    }
  };

  return (
    <View style={styles.container}>
      {/* Buscador y botón */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAgregarCliente}>
          <Text style={styles.addButtonText}>Agregar</Text>
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
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditar(cliente.idCliente)}>
                  {icons.verDatos}
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
});
