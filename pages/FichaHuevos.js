import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import InputText from '../components/Input/InputText';
import SelectBox from '../components/Input/SelectBox';
import Divider from '../components/Input/Divider';

import { leerModeloFS } from '../utils/syncDataFS';

const FichaHuevos = forwardRef((props, ref) => {
  const [categoriasTransformadas, setCategoriasTransformadas] = useState([]);
  const [preguntasTransformadas, setPreguntasTransformadas] = useState([]);
  const [formaPagoTransformada, setFormaPagoTransformada] = useState([]);
  const [condicionPagoTransformada, setCondicionPagoTransformada] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cantidadProveedores, setCantidadProveedores] = useState('1');

  const [categorias, setCategorias] = useState({});
  const [preguntas, setPreguntas] = useState({});
  const [formaPago, setFormaPago] = useState({});
  const [condicionPago, setCondicionPago] = useState({});
  const [diasCredito, setDiasCredito] = useState('');

  const [camposConError, setCamposConError] = useState({});
  const fieldRefs = useRef({});

  const setFieldRef = (id, ref) => {
    fieldRefs.current[id] = ref;
  };
  
  useImperativeHandle(ref, () => ({
    getData: () => ({
      categorias,
      preguntas,
      formaPago,
      condicionPago,
      diasCredito,
      cantidadProveedores,
    }),
    validateData: () => {
      const errores = {};
      
      // Solo validar preguntas de proveedores que están activas
      const preguntasActivas = filtrarPreguntasProveedores(preguntasTransformadas);
      
      preguntasActivas.forEach(pregunta => {
        const key = pregunta.id_pregunta;
        const value = preguntas[key];
        if (!value || value.toString().trim() === '') {
          errores[key] = true;
        }
      });
      
      setCamposConError(errores);
      return Object.keys(errores).length === 0;
    },
    clearErrors: () => {
      setCamposConError({});
      setDiasCredito('');
    },
    getErrores: () => {
      const camposFaltantes = [];
      
      // Solo revisar preguntas de proveedores que están activas
      const preguntasActivas = filtrarPreguntasProveedores(preguntasTransformadas);
      
      preguntasActivas.forEach(pregunta => {
        const key = pregunta.id_pregunta;
        const value = preguntas[key];
        if (!value || value.toString().trim() === '') {
          camposFaltantes.push(`pregunta_${key}: ${pregunta.descripcion}`);
        }
      });
      
      // Revisar días de crédito si la condición de pago es 2
      const condicionSeleccionada = condicionPago['condicion_pago_select'];
      if (condicionSeleccionada === '2') {
        if (!diasCredito || diasCredito.toString().trim() === '') {
          camposFaltantes.push('dias_credito: Días de Crédito');
        }
      }
      
      return camposFaltantes;
    },
  }));

  useEffect(() => {
    const cargarModelos = async () => {
      const [
        preguntasData,
        categoriasData,
        formaPagoData,
        condicionPagoData,
      ] = await Promise.all([
        leerModeloFS('preguntas'),
        leerModeloFS('categorias'),
        leerModeloFS('formas-pago'),
        leerModeloFS('condiciones-pago'),
      ]);

      const categorias = Array.isArray(categoriasData) ? categoriasData : (categoriasData?.rows ?? []);
      const preguntas = Array.isArray(preguntasData) ? preguntasData : (preguntasData?.rows ?? []);
      const formasPago = Array.isArray(formaPagoData) ? formaPagoData : (formaPagoData?.rows ?? []);
      const condicionesPago = Array.isArray(condicionPagoData) ? condicionPagoData : (condicionPagoData?.rows ?? []);

      const catTransformadas = categorias
        .filter(c => c && c.idCategoria != null)
        .sort((a, b) => a.idCategoria - b.idCategoria)
        .map(c => ({
          id_pregunta: `cat_${c.idCategoria}`,
          tipo: 'text',
          descripcion: `${c.nombre || 'Sin nombre'} (${c.descripcion || 'Sin descripción'})`,
          labelPosition: 'left',
        }));

      const pregTransformadas = preguntas
        .filter(p => p && p.idPregunta != null)
        .sort((a, b) => a.idPregunta - b.idPregunta)
        .map(p => {
          const transformed = {
            id_pregunta: p.idPregunta,
            tipo: p.tipo || 'text',
            descripcion: p.descripcion || 'Sin descripción',
            options: p.options,
            labelPosition: /Proveedor\s+\d+/i.test(p.descripcion) ? 'left' : 'top',
          };

          if (p.descripcion?.includes('¿Cuantos proveedores de huevos tiene?')) {
            transformed.tipo = 'select';
            transformed.options = Array.from({ length: 5 }, (_, i) => ({ id: `${i + 1}`, nombre: `${i + 1}` }));
          }

          if (p.descripcion?.includes('¿Paga flete?')) {
            transformed.tipo = 'select';
            transformed.options = [
              { id: 1, nombre: 'Si' },
              { id: 2, nombre: 'No' },
            ];
          }

          if (p.descripcion?.includes('¿Usted busca los huevos o se los traen?')) {
            transformed.tipo = 'select';
            transformed.options = [
              { id: 1, nombre: 'Me los traen' },
              { id: 2, nombre: 'Los busco' },
            ];
          }

          if (p.descripcion?.includes('¿Estaria dispuesto a darnos la oportunidad de ser su proveedor de huevos?')) {
            transformed.tipo = 'select';
            transformed.options = [
              { id: 1, nombre: 'Si' },
              { id: 2, nombre: 'No' },
            ];
          }

          return transformed;
        });

      const formaPagoTransformada = formasPago
        .filter(i => i && i.idFormaPago != null)
        .sort((a, b) => a.idFormaPago - b.idFormaPago)
        .map(i => ({
          id_pregunta: `forma_${i.idFormaPago}`,
          tipo: 'select',
          descripcion: i.descripcion || 'Sin descripción',
          labelPosition: 'left',
          options: [
            { id: 1, nombre: 'Si' },
            { id: 2, nombre: 'No' },
          ],
        }));

      const condPagoTransformada = [{
        id_pregunta: 'condicion_pago_select',
        tipo: 'select',
        descripcion: '¿Cuál es su condición de pago?',
        labelPosition: 'top',
        options: condicionesPago
          .filter(i => i && i.idCondicionPago != null)
          .sort((a, b) => a.idCondicionPago - b.idCondicionPago)
          .map(i => ({
            id: `condpago_${i.idCondicionPago}`,
            realId: i.idCondicionPago,
            nombre: i.descripcion || 'Sin descripción'
          }))
      }];

      setCategoriasTransformadas(catTransformadas);
      setPreguntasTransformadas(pregTransformadas);
      setFormaPagoTransformada(formaPagoTransformada);
      setCondicionPagoTransformada(condPagoTransformada);

      setCategorias(catTransformadas.reduce((acc, i) => ({ ...acc, [i.id_pregunta]: '' }), {}));
      setPreguntas(pregTransformadas.reduce((acc, i) => ({ ...acc, [i.id_pregunta]: '' }), {}));
      setFormaPago(formaPagoTransformada.reduce((acc, i) => ({ ...acc, [i.id_pregunta]: '' }), {}));
      setCondicionPago(condPagoTransformada.reduce((acc, i) => ({ ...acc, [i.id_pregunta]: '' }), {}));

      setLoading(false);
    };

    cargarModelos();
  }, []);

  const filtrarPreguntasProveedores = (pregs) => {
    return pregs.filter(p => {
      if (!p.descripcion || !/Proveedor\s+\d+/i.test(p.descripcion)) return true;
      const match = p.descripcion.match(/Proveedor\s+(\d+)/i);
      const n = match ? parseInt(match[1]) : 0;
      return n <= parseInt(cantidadProveedores);
    });
  };

  const renderPregunta = (pregunta, formData, updateFn) => {
    const {
      id_pregunta: id,
      tipo: type,
      descripcion: labelTitle,
      options,
      labelPosition,
    } = pregunta;

    const handleChange = (id, value) => {
      updateFn(prev => ({ ...prev, [id]: value }));
      if (labelTitle?.includes('¿Cuantos proveedores de huevos tiene?')) {
        setCantidadProveedores(value);
      }
    };

    const resolvedOptions = Array.isArray(options) ? options : [];

    return type === 'select' ? (
      <SelectBox
        key={id}
        id={id}
        value={formData[id]}
        labelTitle={labelTitle}
        onChange={handleChange}
        options={resolvedOptions}
        labelPosition={labelPosition}
        hasError={camposConError[id]}
      />
    ) : (
      <InputText
        key={id}
        id={id}
        value={formData[id]}
        labelTitle={labelTitle}
        placeholder=""
        ref={ref => setFieldRef(id, ref)}
        onChange={handleChange}
        type={type}
        labelPosition={labelPosition}
        hasError={camposConError[id]}
      />
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
        <Divider text="¿Cuántas cajas compra a la semana?" containerStyle={{ marginVertical: 10 }} />
        {categoriasTransformadas.map(p => renderPregunta(p, categorias, setCategorias))}

        <Divider text="¿Cómo realiza su pedido?" containerStyle={{ marginVertical: 10 }} />
        {filtrarPreguntasProveedores(preguntasTransformadas).map(p => renderPregunta(p, preguntas, setPreguntas))}

        <Divider text="¿Cuál es su forma de pago?" containerStyle={{ marginVertical: 10 }} />
        {formaPagoTransformada.map(p => renderPregunta(p, formaPago, setFormaPago))}

        <Divider text="¿Cuál es su condición de pago?" containerStyle={{ marginVertical: 10 }} />
        {condicionPagoTransformada.map(p => renderPregunta(p, condicionPago, setCondicionPago))}
        
        {/* Campo de Días de Crédito - aparece solo si condición de pago es 2 */}
        {condicionPago['condicion_pago_select'] === '2' && (
          <InputText
            id="dias_credito"
            value={diasCredito}
            labelTitle="Días de Crédito"
            placeholder="Ingrese los días de crédito"
            onChange={(id, value) => setDiasCredito(value)}
            type="number"
            labelPosition="top"
            hasError={camposConError['dias_credito']}
          />
        )}

        <StatusBar style="auto" />
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
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FichaHuevos;