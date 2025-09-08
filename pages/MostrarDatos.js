import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute } from '@react-navigation/native';

import StaticText from '../components/Input/StaticText';
import Divider from '../components/Input/Divider';

import { leerModeloFS } from '../utils/syncDataFS';
import * as FileSystem from 'expo-file-system';

// Función para leer respuestas.json directamente
const leerRespuestasDirecto = async () => {
  try {
    const DATA_DIR = FileSystem.documentDirectory + 'data/';
    const RESPUESTAS_PATH = `${DATA_DIR}respuestas.json`;
    
    const respuestasInfo = await FileSystem.getInfoAsync(RESPUESTAS_PATH);
    if (!respuestasInfo.exists) {
      return {};
    }
    
    const contenido = await FileSystem.readAsStringAsync(RESPUESTAS_PATH);
    if (!contenido || contenido.trim() === '') {
      return {};
    }
    
    const datos = JSON.parse(contenido);
    return datos;
  } catch (error) {
    return {};
  }
};

export default function MostrarDatos() {
  const route = useRoute();
  const { idCliente } = route.params;

  const [loading, setLoading] = useState(true);
  const [clienteData, setClienteData] = useState(null);
  const [respuestasData, setRespuestasData] = useState(null);
  const [categoriasModelo, setCategoriasModelo] = useState([]);
  const [preguntasModelo, setPreguntasModelo] = useState([]);
  const [formasPagoModelo, setFormasPagoModelo] = useState([]);
  const [condicionesPagoModelo, setCondicionesPagoModelo] = useState([]);
  const [estadosModelo, setEstadosModelo] = useState([]);
  const [municipiosModelo, setMunicipiosModelo] = useState([]);
  const [parroquiasModelo, setParroquiasModelo] = useState([]);
  const [ciudadesModelo, setCiudadesModelo] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          categoriasData,
          preguntasData,
          formasPagoData,
          condicionesPagoData,
          clientesData,
          estadosData,
          municipiosData,
          parroquiasData,
          ciudadesData,
        ] = await Promise.all([
          leerModeloFS('categorias'),
          leerModeloFS('preguntas'),
          leerModeloFS('formas-pago'),
          leerModeloFS('condiciones-pago'),
          leerModeloFS('clientes'),
          leerModeloFS('estados'),
          leerModeloFS('municipios'),
          leerModeloFS('parroquias'),
          leerModeloFS('ciudades'),
        ]);
        
        // Leer respuestas.json directamente
        const respuestasCompletas = await leerRespuestasDirecto();

        const categorias = Array.isArray(categoriasData) ? categoriasData : categoriasData?.rows ?? [];
        const preguntas = Array.isArray(preguntasData) ? preguntasData : preguntasData?.rows ?? [];
        const formasPago = Array.isArray(formasPagoData) ? formasPagoData : formasPagoData?.rows ?? [];
        const condicionesPago = Array.isArray(condicionesPagoData) ? condicionesPagoData : condicionesPagoData?.rows ?? [];
        const clientes = Array.isArray(clientesData) ? clientesData : clientesData?.rows ?? [];
        const estados = Array.isArray(estadosData) ? estadosData : estadosData?.rows ?? [];
        const municipios = Array.isArray(municipiosData) ? municipiosData : municipiosData?.rows ?? [];
        const parroquias = Array.isArray(parroquiasData) ? parroquiasData : parroquiasData?.rows ?? [];
        const ciudades = Array.isArray(ciudadesData) ? ciudadesData : ciudadesData?.rows ?? [];

        setCategoriasModelo(categorias);
        setPreguntasModelo(preguntas);
        setFormasPagoModelo(formasPago);
        setCondicionesPagoModelo(condicionesPago);
        setEstadosModelo(estados);
        setMunicipiosModelo(municipios);
        setParroquiasModelo(parroquias);
        setCiudadesModelo(ciudades);

        // Buscar el cliente por ID (intentar tanto string como número)
        const cliente = clientes.find(c => 
          c.idCliente === idCliente || 
          c.idCliente === parseInt(idCliente) ||
          String(c.idCliente) === String(idCliente)
        );
        
        console.log('ID Cliente buscado:', idCliente);
        console.log('Clientes disponibles:', clientes.map(c => ({ id: c.idCliente, nombre: c.nombre })));
        console.log('Cliente encontrado:', cliente);
        
        setClienteData(cliente);

        const respuestas = respuestasCompletas[idCliente] || {};
        setRespuestasData(respuestas);
        console.log(respuestasCompletas);

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setLoading(false);
      }
    };

    cargarDatos();
  }, [idCliente]);

  const renderClienteData = () => {
    if (!clienteData) return null;

    // Función auxiliar para obtener nombres geográficos a partir de objetos o IDs
    const obtenerNombreGeografico = (valor, tipo) => {
      if (valor === undefined || valor === null || valor === '') return '';

      // Extraer ID según el tipo y el formato del valor almacenado
      const extraerId = (v) => {
        if (typeof v === 'object') {
          // Valor en nuevo formato { idEstado: n }, { idMunicipio: n }, etc.
          if (tipo === 'estado') return v.idEstado ?? v.id_estado ?? v.id;
          if (tipo === 'municipio') return v.idMunicipio ?? v.id_municipio ?? v.id;
          if (tipo === 'parroquia') return v.idParroquia ?? v.id_parroquia ?? v.id;
          if (tipo === 'ciudad') return v.idCiudad ?? v.id_ciudad ?? v.id;
        }
        // Formatos antiguos: número o string con el id
        return v;
      };

      const id = extraerId(valor);
      if (id === undefined || id === null || id === '') return '';

      let datos = [];
      let campo = '';

      switch (tipo) {
        case 'estado':
          datos = estadosModelo;
          campo = 'idEstado';
          break;
        case 'municipio':
          datos = municipiosModelo;
          campo = 'idMunicipio';
          break;
        case 'parroquia':
          datos = parroquiasModelo;
          campo = 'idParroquia';
          break;
        case 'ciudad':
          datos = ciudadesModelo;
          campo = 'idCiudad';
          break;
        default:
          return String(id);
      }

      const idNum = parseInt(id);
      const item = datos.find(d => d[campo] === idNum || String(d[campo]) === String(id));
      return item ? item.nombre : String(id);
    };

    // Mapeo de campos con etiquetas más amigables
    const fieldLabels = {
      nombre: "Nombre",
      razonSocial: "Razón Social",
      rif: "RIF",
      contacto: "Contacto Principal",
      correo: "Correo Electrónico",
      telefono: "Teléfono",
      contacto2: "Contacto Secundario",
      correo2: "Correo Electrónico 2",
      telefono2: "Teléfono 2",
      direccion: "Dirección",
      ubicacionMap: "Ubicación en Mapa",
      local: "Local",
      puntoReferencia: "Punto de Referencia",
      diaRecepcion: "Día de Recepción",
      tipoComercio: "Tipo de Comercio",
      estado: "Estado",
      municipio: "Municipio",
      parroquia: "Parroquia",
      ciudad: "Ciudad",
      facebook: "Facebook",
      instagram: "Instagram",
      tiktok: "TikTok",
      paginaWeb: "Página Web",
      fechaSincronizacion: "Fecha de Sincronización"
    };

    return (
      <View>
        <Divider text="Datos del Cliente" containerStyle={{ marginVertical: 10 }} />
        {Object.entries(clienteData).map(([key, value]) => {
          // Excluir campos específicos
          if (key === 'idCliente' || key === 'fechaCreacion') {
            return null;
          }
          
          let displayValue = '';
          
          // Manejar campos geográficos especiales
          if (key === 'estado') {
            displayValue = obtenerNombreGeografico(value, 'estado');
          } else if (key === 'municipio') {
            displayValue = obtenerNombreGeografico(value, 'municipio');
          } else if (key === 'parroquia') {
            displayValue = obtenerNombreGeografico(value, 'parroquia');
          } else if (key === 'ciudad') {
            displayValue = obtenerNombreGeografico(value, 'ciudad');
          } else {
            displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
          }
          
          const label = fieldLabels[key] || key;
          
          // No mostrar campos vacíos o con valores por defecto
          if (!displayValue || displayValue === '' || displayValue === 'null' || displayValue === 'undefined') {
            return null;
          }
          
          return (
            <StaticText
              key={key}
              labelTitle={label}
              value={displayValue}
              labelPosition="top"
            />
          );
        })}
      </View>
    );
  };

  const renderCategorias = () => {
    if (!respuestasData?.categorias) return null;

    return (
      <View>
        <Divider text="Número de Cajas" containerStyle={{ marginVertical: 10 }} />
        {categoriasModelo.map(categoria => {
          const item = respuestasData.categorias.find(c => c.idCategoria === categoria.idCategoria);
          if (!item) return null;
          return (
            <StaticText
              key={categoria.idCategoria}
              labelTitle={`${categoria.nombre} (${categoria.descripcion})`}
              value={item.cantidad}
              labelPosition="left"
            />
          );
        })}
      </View>
    );
  };

  const renderPreguntas = () => {
    if (!respuestasData?.preguntas) return null;

    // Ordenar preguntas por idPregunta
    const preguntasOrdenadas = preguntasModelo.sort((a, b) => a.idPregunta - b.idPregunta);
    
    // Preguntas que requieren respuesta Sí/No (1=Sí, 2=No)
    const preguntasSiNo = [
      "¿Paga flete?",
      "¿Estaria dispuesto a darnos la oportunidad de ser su proveedor de huevos?"
    ];

    return (
      <View>
        <Divider text="Preguntas sobre el pedido" containerStyle={{ marginVertical: 10 }} />
        {preguntasOrdenadas.map(pregunta => {
          const item = respuestasData.preguntas.find(p => p.idPregunta === pregunta.idPregunta);
          if (!item) return null;
          
          // Determinar si la pregunta requiere formato Sí/No
          const esPreguntaSiNo = preguntasSiNo.some(p => 
            pregunta.descripcion && pregunta.descripcion.toLowerCase().includes(p.toLowerCase().substring(1, p.length - 1))
          );
          
          // Determinar si es la pregunta de búsqueda de huevos
          const esPreguntaBusquedaHuevos = pregunta.descripcion && 
            pregunta.descripcion.toLowerCase().includes('usted busca los huevos');
          
          let valorMostrado = item.respuesta;
          
          // Convertir 1/2 a Sí/No para preguntas específicas
          if (esPreguntaSiNo && (item.respuesta === 1 || item.respuesta === 2)) {
            valorMostrado = item.respuesta === 1 ? "Sí" : "No";
          }
          
          // Convertir 1/2 para pregunta de búsqueda de huevos
          if (esPreguntaBusquedaHuevos && (item.respuesta === 1 || item.respuesta === 2)) {
            valorMostrado = item.respuesta === 1 ? "Me los traen" : "Los busco";
          }
          
          return (
            <StaticText
              key={pregunta.idPregunta}
              labelTitle={pregunta.descripcion}
              value={String(valorMostrado)}
              labelPosition="top"
            />
          );
        })}
      </View>
    );
  };

  const renderFormasPago = () => {
    if (!respuestasData?.['forma-pago']) return null;

    return (
      <View>
        <Divider text="Formas de pago" containerStyle={{ marginVertical: 10 }} />
        {formasPagoModelo.map(forma => {
          const formaPago = respuestasData['forma-pago'].find(f => f.idFormaPago === forma.idFormaPago);
          if (!formaPago) return null;
          
          // Convertir 1/2 a Sí/No
          const valor = formaPago.respuesta === 1 ? "Sí" : formaPago.respuesta === 2 ? "No" : String(formaPago.respuesta);
          
          return (
            <StaticText
              key={forma.idFormaPago}
              labelTitle={forma.descripcion}
              value={valor}
              labelPosition="left"
            />
          );
        })}
      </View>
    );
  };

  const renderCondicionesPago = () => {
    const condicion = respuestasData?.['condicion-pago'];
    if (!condicion) return null;

    // Determinar el tipo de condición basado en el ID
    let tipoCondicion = "";
    let mostrarDiasCredito = false;
    
    if (condicion.idCondicionPago === 1) {
      tipoCondicion = "Contado";
    } else if (condicion.idCondicionPago === 2) {
      tipoCondicion = "Crédito";
      mostrarDiasCredito = true;
    } else {
      // Fallback: buscar en el modelo
      const condicionModelo = condicionesPagoModelo.find(
        c => c.idCondicionPago === condicion.idCondicionPago
      );
      tipoCondicion = condicionModelo?.descripcion || `ID ${condicion.idCondicionPago}`;
      
      // Determinar si mostrar días de crédito basado en la descripción
      mostrarDiasCredito = tipoCondicion.toLowerCase().includes('credito') || 
                          tipoCondicion.toLowerCase().includes('crédito') ||
                          'diaCredito' in condicion;
    }

    return (
      <View>
        <Divider text="Condiciones de pago" containerStyle={{ marginVertical: 10 }} />
        <StaticText
          labelTitle="Condición de Pago"
          value={tipoCondicion}
          labelPosition="top"
        />
        
        {/* Mostrar días de crédito si es crédito */}
        {mostrarDiasCredito && (
          <StaticText
            labelTitle="Días de Crédito"
            value={condicion.diaCredito || '0'}
            labelPosition="top"
          />
        )}
        
        {/* Mostrar días contado solo si existe en los datos */}
        {'diaContado' in condicion && (
          <StaticText
            labelTitle="Días Contado"
            value={condicion.diaContado || '0'}
            labelPosition="top"
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {renderClienteData()}
        {renderCategorias()}
        {renderPreguntas()}
        {renderFormasPago()}
        {renderCondicionesPago()}

        <StatusBar style="auto" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
