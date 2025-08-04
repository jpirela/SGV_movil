import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import InputText from '../components/Input/InputText';
import TextArea from '../components/Input/TextArea';
import SelectBox from '../components/Input/SelectBox';

import { leerModeloFS } from '../utils/syncDataFS';

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
    const cargarDatos = async () => {
      const [dataEstados, , dataCiudades] = await Promise.all([
        leerModeloFS('estados'),
        null,
        leerModeloFS('ciudades'),
      ]);
      
      setModeloEstados(dataEstados || []);
      setModeloCiudades(dataCiudades || []);
      
      const estadosSimplificados = (dataEstados || []).map(estado => ({
        idEstado: estado.idEstado,
        nombre: estado.nombre
      }));
      setEstados(estadosSimplificados);
      
      setCiudades([]);
      setMunicipios([]);
      setParroquias([]);
    };

    cargarDatos();
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
          <InputText
            ref={el => fieldRefs.current['rif'] = el}
            id="rif"
            value={object.rif}
            placeholder="RIF o CI"
            onChange={(id, value) => {
              updateFormValue(id, value);
              if(fieldRefs.current[id]?.focus) fieldRefs.current[id].focus();
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
          <InputText id="ubicacionMap" value={object.ubicacionMap} placeholder="URL Google Maps" onChange={updateFormValue} />
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
          <InputText id="tipoComercio" value={object.tipoComercio} placeholder="Tipo de comercio" onChange={updateFormValue} />
          <InputText id="facebook" value={object.facebook} placeholder="Facebook" onChange={updateFormValue} />
          <InputText id="instagram" value={object.instagram} placeholder="Instagram" onChange={updateFormValue} />
          <InputText id="tiktok" value={object.tiktok} placeholder="Tiktok" onChange={updateFormValue} />
          <InputText id="paginaWeb" value={object.paginaWeb} placeholder="Página web" onChange={updateFormValue} />

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
});

export default Cliente;
