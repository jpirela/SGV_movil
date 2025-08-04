import { useState, useMemo, useEffect } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { leerClientesLocales, guardarClientesLocales, eliminarRespuestasCliente } from '../utils/syncDataFS'; // ✅ Funciones específicas para clientes locales

// Generador de UUID simple y confiable para React Native
const generateUUID = () => {
  return 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const icons = {
  editar: <MaterialCommunityIcons name="account-edit-outline" size={24} color="gray" />,
  eliminar: <MaterialCommunityIcons name="account-remove-outline" size={24} color="gray" />,
};

const Inicio = () => {
  const [selectedRowId, setSelectedRowId] = useState(null); // Estado para fila seleccionada
  const [clientes, setClientes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  const cargarClientes = useCallback(async () => {
    const data = await leerClientesLocales(); // 📱 Solo datos locales, no API
    setClientes(data);
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Recargar datos cuando la pantalla tome foco (al volver de AgregarCliente)
  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, [cargarClientes])
  );

  const filteredClientes = useMemo(() => {
    if (!searchText.trim()) return clientes;
    return clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, clientes]);

  const handleAgregarCliente = () => {
    navigation.navigate('AgregarCliente');
  };

  const handleEditar = (idCliente) => {
    navigation.navigate('MostrarDatos', { idCliente });
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
              // 🔄 PASO 1: Eliminar respuestas relacionadas PRIMERO
              console.log(`🔄 Iniciando eliminación del cliente ${idCliente}...`);
              await eliminarRespuestasCliente(idCliente);
              
              // 🔄 PASO 2: Eliminar cliente DESPUÉS
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

      {/* Encabezado de tabla */}
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Clientes</Text>
        <Text style={[styles.cell, styles.headerCell, { width: '25%' }]}>Acciones</Text>
      </View>

      {/* Lista de clientes */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {filteredClientes.map(cliente => {
          // Generar un identificador único para key
          const uniqueKey = generateUUID();
          
          return (
            <TouchableOpacity 
              key={uniqueKey} 
              id={cliente.idCliente?.toString()} 
              style={[styles.row, cliente.idCliente === selectedRowId && styles.activeRow]}
              onPress={() => setSelectedRowId(cliente.idCliente)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cell, { flex: 1 }]}>{cliente.nombre}</Text>
              <View style={[styles.actionsCell, { width: '25%' }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  scrollArea: {
    flex: 1,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  activeRow: {
    backgroundColor: '#f0f0f0', // Gris claro para la fila seleccionada
  },
  cell: {
    fontSize: 16,
  },
  headerCell: {
    fontWeight: 'bold',
  },
  actionsCell: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default Inicio;
