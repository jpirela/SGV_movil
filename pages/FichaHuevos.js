// src/pages/FichaHuevos.js
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

import { onDataReady, getMasterData, isDataLoaded } from '../utils/dataCache';

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

      preguntasActivas.forEach((pregunta) => {
        const key = pregunta.id_pregunta;
        const value = preguntas[key];
        // Omitir validación para preguntas de flete cuando estén ocultas por selección "Los busco"
        if (debeOmitirsePorTransporte(pregunta)) return;
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

      preguntasActivas.forEach((pregunta) => {
        const key = pregunta.id_pregunta;
        const value = preguntas[key];
        // Omitir reporte para preguntas de flete cuando estén ocultas por selección "Los busco"
        if (debeOmitirsePorTransporte(pregunta)) return;
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
    const cargarModelos = () => {
      const cache = getMasterData();
      
      const categorias = cache.categorias || [];
      const preguntas = cache.preguntas || [];
      const formasPago = cache.formasPago || [];
      const condicionesPago = cache.condicionesPago || [];

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

    if (isDataLoaded()) {
      // Si los datos ya están cargados, usarlos inmediatamente
      cargarModelos();
    } else {
      // Si no, esperar a que se carguen
      const unsubscribe = onDataReady(() => {
        cargarModelos();
      });
      return unsubscribe;
    }
  }, []);

  const filtrarPreguntasProveedores = (pregs) => {
    return pregs.filter((p) => {
      if (!p.descripcion || !/Proveedor\s+\d+/i.test(p.descripcion)) return true;
      const match = p.descripcion.match(/Proveedor\s+(\d+)/i);
      const n = match ? parseInt(match[1]) : 0;
      return n <= parseInt(cantidadProveedores);
    });
  };

  // Determina si una pregunta de flete debe omitirse (está oculta) según la respuesta de transporte
  const debeOmitirsePorTransporte = (pregunta) => {
    const esPreguntaPagaFlete = /¿?Paga\s+flete\?/i.test(pregunta.descripcion || '');
    const esPreguntaCuantoFlete = /¿?Cu[aá]nto\s+paga\s+de\s+flete\?/i.test(pregunta.descripcion || '');
    if (!esPreguntaPagaFlete && !esPreguntaCuantoFlete) return false;
    const transportePregunta = preguntasTransformadas.find((q) => /Usted\s+(busca|trae)\s+los\s+huevos\s+o\s+se\s+los\s+traen\?/i.test(q.descripcion || ''));
    const transporteValor = transportePregunta ? String(preguntas[transportePregunta.id_pregunta] || '') : '';
    // Si es '2' (Los busco), estas preguntas están ocultas y deben omitirse de validación
    return transporteValor === '2';
  };
  const renderPregunta = (pregunta, formData, updateFn, isPreguntas) => {
    const {
      id_pregunta: id,
      tipo: type,
      descripcion: labelTitle,
      options,
      labelPosition,
    } = pregunta;

    const handleChange = (id, value) => {
      // Actualiza el valor del campo editado
      updateFn((prev) => ({ ...prev, [id]: value }));

      // Si cambia la cantidad de proveedores, actualizamos el estado correspondiente
      if (labelTitle?.includes('¿Cuantos proveedores de huevos tiene?')) {
        setCantidadProveedores(value);
      }

      // Sincronizar "¿Cuál es su proveedor de confianza?" con "Proveedor 1" únicamente
      if (isPreguntas) {
        const esProveedor1 = /^Proveedor\s*1\s*$/i.test(labelTitle || '');
        if (esProveedor1) {
          const confianzaPregunta = preguntasTransformadas.find((q) => /proveedor de confianza/i.test(q.descripcion || ''));
          if (confianzaPregunta) {
            setPreguntas((prev) => ({ ...prev, [confianzaPregunta.id_pregunta]: value }));
          }
        }

        // Reglas para flete dependiendo de si los traen o los busca
        const esTransporte = /Usted\s+(busca|trae)\s+los\s+huevos\s+o\s+se\s+los\s+traen\?/i.test(labelTitle || '');
        if (esTransporte) {
          // En las opciones definidas arriba: 1 = Me los traen, 2 = Los busco
          const valor = String(value);
          const pagaFletePregunta = preguntasTransformadas.find((q) => /¿?Paga\s+flete\?/i.test(q.descripcion || ''));
          const cuantoFletePregunta = preguntasTransformadas.find((q) => /¿?Cu[aá]nto\s+paga\s+de\s+flete\?/i.test(q.descripcion || ''));

          if (valor === '2') { // Los busco
            if (pagaFletePregunta) {
              // 1 = Si, 2 = No
              setPreguntas((prev) => ({ ...prev, [pagaFletePregunta.id_pregunta]: '2' }));
            }
            if (cuantoFletePregunta) {
              setPreguntas((prev) => ({ ...prev, [cuantoFletePregunta.id_pregunta]: '0' }));
            }
          }
        }
      }
    };

    const resolvedOptions = Array.isArray(options) ? options : [];

    // Mostrar preguntas de flete solo cuando el transporte es "Me los traen" (valor === '1')
    if (isPreguntas) {
      const transportePregunta = preguntasTransformadas.find((q) => /Usted\s+(busca|trae)\s+los\s+huevos\s+o\s+se\s+los\s+traen\?/i.test(q.descripcion || ''));
      const transporteValor = transportePregunta ? String(preguntas[transportePregunta.id_pregunta] || '') : '';
      const mostrarFlete = transporteValor === '1'; // 1 = Me los traen, 2 = Los busco
      const esPreguntaPagaFlete = /¿?Paga\s+flete\?/i.test(labelTitle || '');
      const esPreguntaCuantoFlete = /¿?Cu[aá]nto\s+paga\s+de\s+flete\?/i.test(labelTitle || '');
      if ((esPreguntaPagaFlete || esPreguntaCuantoFlete) && !mostrarFlete) {
        return null;
      }
    }

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
        {categoriasTransformadas.map(p => renderPregunta(p, categorias, setCategorias, false))}

        <Divider text="¿Cómo realiza su pedido?" containerStyle={{ marginVertical: 10 }} />
        {filtrarPreguntasProveedores(preguntasTransformadas).map(p => renderPregunta(p, preguntas, setPreguntas, true))}

        <Divider text="¿Cuál es su forma de pago?" containerStyle={{ marginVertical: 10 }} />
        {formaPagoTransformada.map(p => renderPregunta(p, formaPago, setFormaPago, false))}

        <Divider text="¿Cuál es su condición de pago?" containerStyle={{ marginVertical: 10 }} />
        {condicionPagoTransformada.map(p => renderPregunta(p, condicionPago, setCondicionPago, false))}
        
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