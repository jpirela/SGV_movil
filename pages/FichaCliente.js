import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

import InputText from '../components/Input/InputText';
import TextArea from '../components/Input/TextArea';
import SelectBox from '../components/Input/SelectBox';
import RifInput from '../components/Input/RifInput';

import { onDataReady, getMasterData, isDataLoaded } from '../utils/dataCache';

const Cliente = forwardRef((props, ref) => {
  const INITIAL_OBJECT = {
    nombre: "",
    razonSocial: "",
    rif: "",
    contacto: "",
    correo: "",
    telefono: "",
    contacto2: "",
    correo2: "",
    telefono2: "",
    direccion: "",
    ubicacionMap: "",
    local: "",
    puntoReferencia: "",
    diaRecepcion: "",
    tipoComercio: "",
    estado: "",
    municipio: "",
    parroquia: "",
    ciudad: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    paginaWeb: "",
  };

  const [object, setObject] = useState(INITIAL_OBJECT);
  
  const [modeloEstados, setModeloEstados] = useState([]);
  const [modeloCiudades, setModeloCiudades] = useState([]);
  
  const [estados, setEstados] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [parroquias, setParroquias] = useState([]);

  const [enabledCiudad, setEnabledCiudad] = useState(false);
  const [enabledMunicipio, setEnabledMunicipio] = useState(false);
  const [enabledParroquia, setEnabledParroquia] = useState(false);

  const [camposConError, setCamposConError] = useState({});

  // Estados para inputs dinámicos de redes sociales
  const [redesSocialesActivas, setRedesSocialesActivas] = useState([]);
  const [redesSocialesSeleccionada, setRedesSocialesSeleccionada] = useState('');

  // *** Definimos ref para inputs ***
  const fieldRefs = useRef({});

  useImperativeHandle(ref, () => ({
    getData: () => object,
    validateData: () => {
      const requiredFields = ['nombre', 'razonSocial', 'rif', 'contacto', 'correo', 'telefono', 'direccion', 'estado', 'municipio', 'parroquia', 'ciudad'];
      const errores = {};
      requiredFields.forEach(field => {
        if (!object[field] || object[field].trim() === '') {
          errores[field] = true;
        }
      });
      setCamposConError(errores);
      
      // Enfocar el primer campo con error
      if (Object.keys(errores).length > 0) {
        const primerCampoConError = Object.keys(errores)[0];
        const fieldRef = fieldRefs.current[primerCampoConError];
        if (fieldRef && fieldRef.focus) {
          setTimeout(() => {
            fieldRef.focus();
          }, 100);
        }
      }
      
      return Object.keys(errores).length === 0;
    },
    clearErrors: () => setCamposConError({}),
    getErrores: () => {
      const requiredFields = ['nombre', 'razonSocial', 'rif', 'contacto', 'correo', 'telefono', 'direccion', 'estado', 'municipio', 'parroquia', 'ciudad'];
      const camposFaltantes = [];
      requiredFields.forEach(field => {
        if (!object[field] || object[field].trim() === '') {
          camposFaltantes.push(field);
        }
      });
      return camposFaltantes;
    }
  }));

  useEffect(() => {
    const cargarDatos = () => {
      const cache = getMasterData();
      
      const dataEstados = cache.estados || [];
      const dataCiudades = cache.ciudades || [];
      
      setModeloEstados(dataEstados);
      setModeloCiudades(dataCiudades);
      
      const estadosSimplificados = dataEstados.map(estado => ({
        idEstado: estado.idEstado,
        nombre: estado.nombre
      }));
      setEstados(estadosSimplificados);
      
      setCiudades([]);
      setMunicipios([]);
      setParroquias([]);
    };

    if (isDataLoaded()) {
      cargarDatos();
    } else {
      const unsubscribe = onDataReady(() => {
        cargarDatos();
      });
      return unsubscribe;
    }
  }, []);

  const updateFormValue = (id, value) => {
    setObject((prev) => ({ ...prev, [id]: value }));
  };

  const handleEstadoSelect = (id, idEstado) => {
    updateFormValue('estado', idEstado);

    setMunicipios([]);
    setParroquias([]);
    setCiudades([]);
    setEnabledMunicipio(false);
    setEnabledParroquia(false);
    setEnabledCiudad(false);
    updateFormValue('municipio', '');
    updateFormValue('parroquia', '');
    updateFormValue('ciudad', '');

    if (idEstado && idEstado !== '') {
      const idEstadoNum = parseInt(idEstado, 10);
      const estadoCompleto = modeloEstados.find((e) => e.idEstado === idEstado || e.idEstado === idEstadoNum);
      
      if (estadoCompleto) {
        const municipiosDelEstado = estadoCompleto.municipios || [];
        setMunicipios(municipiosDelEstado);
        setEnabledMunicipio(true);
        const ciudadesDelEstado = modeloCiudades.filter(ciudad => ciudad.idEstado === idEstado || ciudad.idEstado === idEstadoNum);
        setCiudades(ciudadesDelEstado);
        setEnabledCiudad(true);
      }
    }
  };

  const handleMunicipioSelect = (id, idMunicipio) => {
    updateFormValue('municipio', idMunicipio);

    setParroquias([]);
    setEnabledParroquia(false);
    updateFormValue('parroquia', '');

    if (idMunicipio && idMunicipio !== '') {
      const idMunicipioNum = parseInt(idMunicipio, 10);
      const municipio = municipios.find((m) => m.idMunicipio === idMunicipio || m.idMunicipio === idMunicipioNum);
      
      if (municipio) {
        const parroquiasDelMunicipio = municipio.parroquias || [];
        setParroquias(parroquiasDelMunicipio);
        setEnabledParroquia(true);
      }
    }
  };

  const handleParroquiaSelect = (id, idParroquia) => {
    updateFormValue('parroquia', idParroquia);
  };

  const getCurrentLocationUrl = async () => {
    try {
      // Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Si no se otorgan permisos, usar la función anterior como fallback
        autoGenerateGoogleMapsUrlFromData();
        return;
      }

      // Obtener la ubicación actual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      
      // Crear URL de Google Maps con las coordenadas
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      
      // Actualizar el campo ubicacionMap
      updateFormValue('ubicacionMap', googleMapsUrl);
      
    } catch (error) {
      console.log('Error obteniendo ubicación:', error);
      // En caso de error, usar la función de fallback
      autoGenerateGoogleMapsUrlFromData();
    }
  };

  const autoGenerateGoogleMapsUrlFromData = () => {
    const { nombre, direccion, local, puntoReferencia } = object;
    
    // Construir la dirección de búsqueda
    let searchQuery = '';
    
    if (nombre) {
      searchQuery += nombre;
    }
    
    if (direccion) {
      if (searchQuery) searchQuery += ', ';
      searchQuery += direccion;
    }
    
    if (local) {
      if (searchQuery) searchQuery += ', ';
      searchQuery += local;
    }
    
    if (puntoReferencia) {
      if (searchQuery) searchQuery += ', ';
      searchQuery += puntoReferencia;
    }
    
    // Si no hay información suficiente, usar un placeholder
    if (!searchQuery.trim()) {
      searchQuery = 'Mi ubicación';
    }
    
    // Codificar la URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
    
    // Actualizar el campo ubicacionMap
    updateFormValue('ubicacionMap', googleMapsUrl);
  };

  // Función para agregar un nuevo input de red social
  const agregarRedSocial = () => {
    // Verificar que se ha seleccionado una opción válida
    if (!redesSocialesSeleccionada) return;
    
    // Verificar que no exista ya en la lista de activas
    if (!redesSocialesActivas.includes(redesSocialesSeleccionada)) {
      setRedesSocialesActivas(prev => [...prev, redesSocialesSeleccionada]);
      // Limpiar la selección para permitir seleccionar otra opción
      setRedesSocialesSeleccionada('');
    }
  };
  
  // Función para eliminar un input de red social
  const eliminarRedSocial = (redSocial) => {
    setRedesSocialesActivas(prev => prev.filter(item => item !== redSocial));
    // Limpiar el valor del objeto para esa red social
    updateFormValue(redSocial, '');
  };
  
  // Función para manejar el cambio de la opción seleccionada
  const handleRedSocialSeleccionada = (value) => {
    setRedesSocialesSeleccionada(value);
  };
  
  // Función para obtener el placeholder basado en el tipo de red social
  const getPlaceholderForRedSocial = (redSocial) => {
    const placeholders = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      paginaWeb: 'Pagina Web'
    };
    return placeholders[redSocial] || redSocial;
  };
  
  // Función para renderizar los inputs de redes sociales activos
  const renderInputsRedesSociales = () => {
    return redesSocialesActivas.map((redSocial) => (
      <View key={redSocial} style={styles.inputWithDeleteContainer}>
        <View style={styles.inputContainer}>
          <InputText
            id={redSocial}
            value={object[redSocial]}
            placeholder={getPlaceholderForRedSocial(redSocial)}
            onChange={updateFormValue}
          />
        </View>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => eliminarRedSocial(redSocial)}
        >
          <MaterialCommunityIcons name="close" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 100}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View>
          {/* Inputs de texto */}
          <InputText
            ref={el => fieldRefs.current['nombre'] = el}
            id="nombre"
            value={object.nombre}
            placeholder="Nombre del negocio"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.nombre}
          />
          <InputText
            ref={el => fieldRefs.current['razonSocial'] = el}
            id="razonSocial"
            value={object.razonSocial}
            placeholder="Razón Social"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.razonSocial}
          />
          <RifInput
            ref={el => fieldRefs.current['rif'] = el}
            id="rif"
            value={object.rif}
            onChange={(id, value) => {
              updateFormValue(id, value);
            }}
            hasError={camposConError.rif}
          />
          <InputText
            ref={el => fieldRefs.current['contacto'] = el}
            id="contacto"
            value={object.contacto}
            placeholder="Persona de contacto"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.contacto}
          />
          <InputText
            ref={el => fieldRefs.current['correo'] = el}
            id="correo"
            value={object.correo}
            placeholder="Correo electrónico"
            type="email"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.correo}
          />
          <InputText
            ref={el => fieldRefs.current['telefono'] = el}
            id="telefono"
            value={object.telefono}
            placeholder="Teléfono"
            type="phone"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.telefono}
          />
          {/* Los que no quieres enfocar no necesitan el ref */}
          <InputText
            id="contacto2"
            value={object.contacto2}
            placeholder="Persona de contacto 2"
            onChange={updateFormValue}
          />
          <InputText
            id="correo2"
            value={object.correo2}
            placeholder="Correo electrónico 2"
            type="email"
            onChange={updateFormValue}
          />
          <InputText
            id="telefono2"
            value={object.telefono2}
            placeholder="Teléfono 2"
            type="phone"
            onChange={updateFormValue}
          />
          <TextArea
            ref={el => fieldRefs.current['direccion'] = el}
            id="direccion"
            value={object.direccion}
            placeholder="Dirección"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
            }}
            hasError={camposConError.direccion}
          />
          {/* Otros inputs sin foco */}
          <InputText id="local" value={object.local} placeholder="Local" onChange={updateFormValue} />
          
          {/* Contenedor para URL Google Maps con botón */}
          <View style={styles.inputWithButtonContainer}>
            <View style={styles.inputContainer}>
              <InputText 
                id="ubicacionMap" 
                value={object.ubicacionMap} 
                placeholder="URL Google Maps" 
                onChange={updateFormValue} 
              />
            </View>
            <TouchableOpacity 
              style={styles.mapButton} 
              onPress={getCurrentLocationUrl}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
          
          <InputText id="puntoReferencia" value={object.puntoReferencia} placeholder="Punto de referencia" onChange={updateFormValue} />
          <SelectBox
            id="diaRecepcion"
            value={object.diaRecepcion}
            labelTitle="Día de Recepción"
            onChange={updateFormValue}
            options={[
              { id: 'lunes', realId: 'Lunes', nombre: 'Lunes' },
              { id: 'martes', realId: 'Martes', nombre: 'Martes' },
              { id: 'miercoles', realId: 'Miércoles', nombre: 'Miércoles' },
              { id: 'jueves', realId: 'Jueves', nombre: 'Jueves' },
              { id: 'viernes', realId: 'Viernes', nombre: 'Viernes' },
              { id: 'sabado', realId: 'Sábado', nombre: 'Sábado' },
              { id: 'domingo', realId: 'Domingo', nombre: 'Domingo' },
              { id: 'lunes_a_viernes', realId: 'De Lunes a Viernes', nombre: 'De Lunes a Viernes' },
              { id: 'todos', realId: 'Todos los dias', nombre: 'Todos los dias' }
            ]}
            enabled={true}
          />
          <SelectBox
            id="tipoComercio"
            value={object.tipoComercio}
            labelTitle="Tipo de comercio"
            onChange={updateFormValue}
            options={[
              { id: 'quiosco', realId: 'Quiosco', nombre: 'Quiosco' },
              { id: 'panaderia', realId: 'Panaderia', nombre: 'Panaderia' },
              { id: 'bodega', realId: 'Bodega', nombre: 'Bodega' },
              { id: 'abasto', realId: 'Abasto', nombre: 'Abasto' },
              { id: 'supermercado', realId: 'Super mercado', nombre: 'Super mercado' },
              { id: 'licoreria', realId: 'Licorería', nombre: 'Licorería' },
              { id: 'bodegon', realId: 'Bodegon', nombre: 'Bodegon' },
            ]}
            enabled={true}
          />
          
          {/* Selector de Redes Sociales con botón agregar */}
          <View style={styles.socialMediaContainer}>
            <View style={styles.selectBoxContainer}>
              <SelectBox
                id="redSocialSelector"
                value={redesSocialesSeleccionada}
                labelTitle="Agregar Red Social"
                onChange={(id, value) => handleRedSocialSeleccionada(value)}
                options={[
                  { id: 'facebook', realId: 'facebook', nombre: 'Facebook' },
                  { id: 'instagram', realId: 'instagram', nombre: 'Instagram' },
                  { id: 'tiktok', realId: 'tiktok', nombre: 'TikTok' },
                  { id: 'paginaWeb', realId: 'paginaWeb', nombre: 'Pagina Web' },
                ].filter(option => !redesSocialesActivas.includes(option.realId))}
                enabled={true}
              />
            </View>
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={agregarRedSocial}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#007bff" />
            </TouchableOpacity>
          </View>
          
          {/* Renderizar inputs dinámicos de redes sociales */}
          {renderInputsRedesSociales()}

          <SelectBox
            id="estado"
            value={object.estado}
            labelTitle="Estado"
            onChange={handleEstadoSelect}
            options={estados.map((e) => ({
              id: `estado-${e.idEstado}`,
              realId: e.idEstado,
              nombre: e.nombre,
            }))}
            enabled={estados.length > 0}
            hasError={camposConError.estado}
          />
          
          <SelectBox
            id="ciudad"
            value={object.ciudad}
            labelTitle="Ciudad"
            onChange={updateFormValue}
            options={ciudades.map((c) => ({
              id: `ciudad-${c.idCiudad || c.id_ciudad}`,
              realId: c.idCiudad || c.id_ciudad,
              nombre: c.nombre,
            }))}
            enabled={enabledCiudad}
            hasError={camposConError.ciudad}
          />

          <SelectBox
            id="municipio"
            value={object.municipio}
            labelTitle="Municipio"
            onChange={handleMunicipioSelect}
            options={municipios.map((m) => ({
              id: `mun-${object.estado}-${m.idMunicipio}`,
              realId: m.idMunicipio,
              nombre: m.nombre,
            }))}
            enabled={enabledMunicipio}
            hasError={camposConError.municipio}
          />

          <SelectBox
            id="parroquia"
            value={object.parroquia}
            labelTitle="Parroquia"
            onChange={handleParroquiaSelect}
            options={parroquias.map((p) => ({
              id: `parr-${object.estado}-${object.municipio}-${p.idParroquia}`,
              realId: p.idParroquia,
              nombre: p.nombre,
            }))}
            enabled={enabledParroquia}
            hasError={camposConError.parroquia}
          />

          <StatusBar style="auto" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 80,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
  },
  inputWithButtonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  mapButton: {
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    height: 44,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 15,
  },
  selectBoxContainer: {
    flex: 1,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#e7f3ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#007bff',
    marginBottom: 15,
  },
  inputWithDeleteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
});

export default Cliente;
