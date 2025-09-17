import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRoute, useNavigation } from '@react-navigation/native';

import InputText from '../components/Input/InputText';
import Divider from '../components/Input/Divider';

import { leerClientesLocales, guardarClientesLocales, guardarRespuestas } from '../utils/syncDataFS';
import { onDataReady, getMasterData, isDataLoaded } from '../utils/dataCache';
import * as FileSystem from 'expo-file-system/legacy';

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
  const navigation = useNavigation();
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
        // Usar cache para datos maestros, solo leer clientes desde archivo
        const cache = getMasterData();
        const clientesData = await leerClientesLocales();
        
        // Leer respuestas.json directamente
        const respuestasCompletas = await leerRespuestasDirecto();

        const categorias = cache.categorias || [];
        const preguntas = cache.preguntas || [];
        const formasPago = cache.formasPago || [];
        const condicionesPago = cache.condicionesPago || [];
        const clientes = Array.isArray(clientesData) ? clientesData : [];
        const estados = cache.estados || [];
        const municipios = cache.municipios || [];
        const parroquias = cache.parroquias || [];
        const ciudades = cache.ciudades || [];

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

    if (isDataLoaded()) {
      cargarDatos();
    } else {
      const unsubscribe = onDataReady(() => {
        cargarDatos();
      });
      return unsubscribe;
    }
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
      paginaWeb: "Página Web"
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
            <InputText
              key={key}
              id={key}
              labelTitle={label}
              value={displayValue}
              placeholder={label}
              onChange={(id, text) => setClienteData(prev => ({ ...prev, [key]: text }))}
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
            <InputText
              key={categoria.idCategoria}
              id={`cat_${categoria.idCategoria}`}
              labelTitle={`${categoria.nombre} (${categoria.descripcion})`}
              value={String(item.cantidad ?? '')}
              placeholder={`${categoria.nombre}`}
              onChange={(id, text) => setRespuestasData(prev => ({
                ...prev,
                categorias: (prev?.categorias || []).map(c => c.idCategoria === categoria.idCategoria ? { ...c, cantidad: text } : c)
              }))}
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
            <InputText
              key={pregunta.idPregunta}
              id={`preg_${pregunta.idPregunta}`}
              labelTitle={pregunta.descripcion}
              value={String(valorMostrado ?? '')}
              placeholder={pregunta.descripcion}
              onChange={(id, text) => setRespuestasData(prev => ({
                ...prev,
                preguntas: (prev?.preguntas || []).map(p => p.idPregunta === pregunta.idPregunta ? { ...p, respuesta: text } : p)
              }))}
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
            <InputText
              key={forma.idFormaPago}
              id={`forma_${forma.idFormaPago}`}
              labelTitle={forma.descripcion}
              value={String(valor ?? '')}
              placeholder={forma.descripcion}
              onChange={(id, text) => setRespuestasData(prev => ({
                ...prev,
                ['forma-pago']: (prev?.['forma-pago'] || []).map(f => f.idFormaPago === forma.idFormaPago ? { ...f, respuesta: text } : f)
              }))}
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
        <InputText
          id={'condicion_pago_texto'}
          labelTitle="Condición de Pago"
          value={String(tipoCondicion ?? '')}
          placeholder="Condición de Pago"
          onChange={(id, text) => {
            // Guardar como descripción libre sin alterar el id original
            const nueva = { ...(respuestasData?.['condicion-pago'] || {}), descripcion: text };
            setRespuestasData(prev => ({ ...prev, ['condicion-pago']: nueva }));
          }}
          labelPosition="top"
        />
        
        {/* Mostrar días de crédito si es crédito */}
        {mostrarDiasCredito && (
          <InputText
            id={'condicion_pago_dia_credito'}
            labelTitle="Días de Crédito"
            value={String(condicion.diaCredito ?? '0')}
            placeholder="Días de Crédito"
            onChange={(id, text) => {
              setRespuestasData(prev => ({ ...prev, ['condicion-pago']: { ...(prev?.['condicion-pago'] || {}), diaCredito: text } }));
            }}
            type="number"
            labelPosition="top"
          />
        )}
        
        {/* Mostrar días contado solo si existe en los datos */}
        {'diaContado' in condicion && (
          <InputText
            id={'condicion_pago_dia_contado'}
            labelTitle="Días Contado"
            value={String(condicion.diaContado ?? '0')}
            placeholder="Días Contado"
            onChange={(id, text) => {
              setRespuestasData(prev => ({ ...prev, ['condicion-pago']: { ...(prev?.['condicion-pago'] || {}), diaContado: text } }));
            }}
            type="number"
            labelPosition="top"
          />
        )}
      </View>
    );
  };

  const handleCancelar = () => {
    navigation.goBack();
  };

  const toIntSafe = (val) => {
    const n = Number(String(val ?? '').toString().replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };

  const validateBeforeSave = () => {
    const errors = [];
    const normalized = { respuestas: { ...(respuestasData || {}) } };

    // 1) Validar categorías: cantidades enteras no negativas
    try {
      if (Array.isArray(categoriasModelo) && Array.isArray(respuestasData?.categorias)) {
        const nuevasCategorias = respuestasData.categorias.map((c) => ({ ...c }));
        for (const cat of categoriasModelo) {
          const item = nuevasCategorias.find((x) => x.idCategoria === cat.idCategoria);
          if (!item) continue;
          const n = toIntSafe(item.cantidad);
          if (!Number.isFinite(n) || n < 0) {
            const label = `${cat.nombre} (${cat.descripcion})`;
            errors.push(`Cantidad inválida en categoría: ${label}`);
          } else {
            item.cantidad = n; // normalizar
          }
        }
        normalized.respuestas.categorias = nuevasCategorias;
      }
    } catch (_) {}

    // 2) Validar condiciones de pago
    try {
      const cond = { ...(respuestasData?.['condicion-pago'] || {}) };
      if (cond && typeof cond === 'object') {
        if (cond.idCondicionPago === 2) {
          const n = toIntSafe(cond.diaCredito);
          if (!Number.isFinite(n) || n < 0) {
            errors.push('Días de Crédito inválido');
          } else {
            cond.diaCredito = n;
          }
        }
        if ('diaContado' in cond) {
          const n2 = toIntSafe(cond.diaContado);
          if (!Number.isFinite(n2) || n2 < 0) {
            errors.push('Días Contado inválido');
          } else {
            cond.diaContado = n2;
          }
        }
      }
      normalized.respuestas['condicion-pago'] = cond;
    } catch (_) {}

    // 3) Validar ciertas preguntas (no vacías)
    try {
      const preguntasSiNo = [
        '¿Paga flete?',
        '¿Estaria dispuesto a darnos la oportunidad de ser su proveedor de huevos?',
      ];
      const regexTransporte = /Usted\s+(busca|trae)\s+los\s+huevos\s+o\s+se\s+los\s+traen\?/i;
      if (Array.isArray(preguntasModelo) && Array.isArray(respuestasData?.preguntas)) {
        const nuevasPreguntas = respuestasData.preguntas.map((p) => ({ ...p }));
        for (const pm of preguntasModelo) {
          const resp = nuevasPreguntas.find((x) => x.idPregunta === pm.idPregunta);
          if (!resp) continue;
          const valStr = (resp.respuesta ?? '').toString().trim();
          const esSN = preguntasSiNo.some((t) => pm.descripcion?.toLowerCase().includes(t.toLowerCase().replace(/[¿?]/g, '')));
          const esTrans = regexTransporte.test(pm.descripcion || '');
          if (esSN || esTrans) {
            if (!valStr) {
              errors.push(`Responder: ${pm.descripcion}`);
            }
          }
        }
        normalized.respuestas.preguntas = nuevasPreguntas;
      }
    } catch (_) {}

    return { ok: errors.length === 0, errors, normalized };
  };

  const handleGuardar = async () => {
    try {
      if (!clienteData) throw new Error('Datos de cliente no cargados');

      // Validar datos
      const { ok, errors, normalized } = validateBeforeSave();
      if (!ok) {
        Alert.alert('Validación', errors.join('\n'));
        return;
      }

      // Actualizar clientes.json
      const clientes = await leerClientesLocales();
      const idx = (Array.isArray(clientes) ? clientes : []).findIndex(c => String(c.idCliente) === String(idCliente));
      let nuevosClientes = Array.isArray(clientes) ? [...clientes] : [];
      if (idx >= 0) {
        // Preservar campos clave si faltan en clienteData
        const existente = nuevosClientes[idx] || {};
        nuevosClientes[idx] = { ...existente, ...clienteData, idCliente: String(idCliente) };
      } else {
        nuevosClientes.push({ ...clienteData, idCliente: String(idCliente) });
      }
      await guardarClientesLocales(nuevosClientes);

      // Actualizar Respuestas.json
      if (respuestasData) {
        // Usar los valores normalizados
        await guardarRespuestas(String(idCliente), normalized.respuestas);
      }

      Alert.alert('Éxito', 'Datos guardados correctamente');
      navigation.goBack();
    } catch (e) {
      console.warn('Error al guardar cambios:', e);
      Alert.alert('Error', e?.message || 'No se pudieron guardar los cambios');
    }
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

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handleCancelar}>
            <Text style={[styles.btnText, styles.btnCancelText]}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleGuardar}>
            <Text style={[styles.btnText, styles.btnSaveText]}>Guardar</Text>
          </TouchableOpacity>
        </View>

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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnCancel: {
    borderColor: '#6c757d',
    backgroundColor: '#f8f9fa',
  },
  btnSave: {
    borderColor: '#198754',
    backgroundColor: '#e8f5e9',
  },
  btnText: {
    fontWeight: 'bold',
  },
  btnCancelText: {
    color: '#6c757d',
  },
  btnSaveText: {
    color: '#198754',
  },
});
