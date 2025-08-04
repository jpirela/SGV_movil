import { useState, useRef } from 'react';
import { View, useWindowDimensions, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import FichaCliente from './FichaCliente';
import FichaHuevos from './FichaHuevos';
import { useNavigation } from '@react-navigation/native';
import { guardarNuevoCliente, guardarRespuestas } from '../utils/syncDataFS';

export default function AgregarCliente() {
  const layout = useWindowDimensions();
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'cliente', title: 'Ficha Cliente' },
    { key: 'huevos', title: 'Ficha Huevos' },
  ]);

  const clienteRef = useRef();
  const huevosRef = useRef();

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'cliente':
        return <FichaCliente ref={clienteRef} />;
      case 'huevos':
        return <FichaHuevos ref={huevosRef} />;
      default:
        return null;
    }
  };

  const handleGuardar = async () => {
  try {
    const clienteValid = clienteRef.current?.validateData();
    const huevosValid = huevosRef.current?.validateData();

    if (!clienteValid || !huevosValid) {
      const clienteErrores = clienteRef.current?.getErrores();
      const huevosErrores = huevosRef.current?.getErrores();
      console.log('Errores en Ficha Cliente:', clienteErrores);
      console.log('Errores en Ficha Huevos:', huevosErrores);
      Alert.alert("Faltan datos por recolectar");
      return;
    }

    // Limpiar errores si la validación es exitosa
    clienteRef.current?.clearErrors();
    huevosRef.current?.clearErrors();

    // Obtener datos
    const clienteData = clienteRef.current?.getData();
    const huevosData = huevosRef.current?.getData();
    
    console.log('\n🔍 === DEBUG: PROCESO DE GUARDADO ===');
    console.log('\n📋 DATOS DEL CLIENTE:');
    console.log(JSON.stringify(clienteData, null, 2));
    
    console.log('\n🥚 DATOS DE HUEVOS:');
    console.log(JSON.stringify(huevosData, null, 2));

    // Guardar cliente y obtener idCliente
    console.log('\n💾 Guardando cliente...');
    const idCliente = await guardarNuevoCliente(clienteData);
    console.log('✅ Cliente guardado con ID:', idCliente);

    // Transformar datos al formato esperado
    const transformarDatos = (huevosData) => {
      const categorias = Object.entries(huevosData.categorias || {}).map(([key, value]) => {
        const id = parseInt(key.replace('cat_', ''), 10);
        return { idCategoria: id, cantidad: value };
      });

      const preguntas = Object.entries(huevosData.preguntas || {}).map(([key, value]) => {
        return { idPregunta: parseInt(key, 10), respuesta: value };
      });

      const formaPago = Object.entries(huevosData.formaPago || {})
        .filter(([_, value]) => value === '1')
        .map(([key]) => {
          const id = parseInt(key.replace('forma_', ''), 10);
          return { idFormaPago: id };
        });

      const condicionIdStr = huevosData.condicionPago?.['condicion_pago_select'];
      const condicionId = condicionIdStr ? parseInt(condicionIdStr.replace('condpago_', ''), 10) : null;

      const condicionPago = condicionId
        ? {
            idCondicionPago: condicionId,
            ...(condicionId === 2
              ? { diaCredito: parseInt(huevosData.diasCredito || '0', 10) }
              : { diaContado: 0 }),
          }
        : {};

      return {
        categorias,
        preguntas,
        'forma-pago': formaPago,
        'condicion-pago': condicionPago,
      };
    };

    const respuestasFormateadas = transformarDatos(huevosData);
    
    console.log('\n📝 RESPUESTAS FORMATEADAS:');
    console.log(JSON.stringify(respuestasFormateadas, null, 2));

    // Guardar respuestas
    console.log('\n💾 Guardando respuestas...');
    await guardarRespuestas(idCliente, respuestasFormateadas);
    console.log('✅ Respuestas guardadas correctamente');
    console.log('🔚 === FIN DEBUG: PROCESO DE GUARDADO ===\n');

    Alert.alert("Datos guardados exitosamente");
    navigation.goBack();
  } catch (error) {
    console.error('Error al guardar:', error);
    Alert.alert("Error al guardar los datos");
  }
};

  const renderTabBar = (props) => (
    <View style={styles.tabHeader}>
      <TabBar
        {...props}
        indicatorStyle={styles.indicator}
        style={styles.tabBar}
        labelStyle={styles.label}
        activeColor="#007bff"
        inactiveColor="#666"
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleGuardar}>
        <Text style={styles.saveButtonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingRight: 10,
  },
  tabBar: {
    flex: 1,
    backgroundColor: '#fff',
    elevation: 0,
  },
  indicator: {
    backgroundColor: '#007bff',
    height: 3,
  },
  label: {
    color: '#000',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
