import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SelectBox from './SelectBox';
import InputText from './InputText';

export const ADDRESS_DATA = [
  {
    id: 'vias_principales',
    title: 'Vías principales',
    items: [
      { id: 'calle', label: 'Calle' },
      { id: 'avenida', label: 'Avenida' },
      { id: 'boulevard', label: 'Boulevard' },
      { id: 'carretera', label: 'Carretera' },
      { id: 'ruta', label: 'Ruta' },
      { id: 'autopista', label: 'Autopista' },
      { id: 'camino', label: 'Camino' },
      { id: 'transversal', label: 'Transversal' },
      { id: 'carrera', label: 'Carrera' },
      { id: 'pasaje', label: 'Pasaje' },
      { id: 'callejon', label: 'Callejón' },
      { id: 'peatonal', label: 'Peatonal' },
    ],
  },
  {
    id: 'residencial_comercial',
    title: 'Residencial / Comercial',
    items: [
      { id: 'urbanizacion', label: 'Urbanización' },
      { id: 'conjunto', label: 'Conjunto' },
      { id: 'residencia', label: 'Residencia' },
      { id: 'sector', label: 'Sector' },
      { id: 'manzana', label: 'Manzana' },
      { id: 'parcela', label: 'Parcela' },
      { id: 'zona', label: 'Zona' },
      { id: 'vereda', label: 'Vereda' },
    ],
  },
  {
    id: 'edificios',
    title: 'Edificios y unidades',
    items: [
      { id: 'edificio', label: 'Edificio' },
      { id: 'torre', label: 'Torre' },
      { id: 'bloque', label: 'Bloque' },
      { id: 'escalera', label: 'Escalera' },
      { id: 'piso', label: 'Piso' },
      { id: 'apartamento', label: 'Apartamento' },
      { id: 'departamento', label: 'Departamento' },
      { id: 'local', label: 'Local' },
      { id: 'oficina', label: 'Oficina' },
    ],
  },
  {
    id: 'rural',
    title: 'Direcciones rurales',
    items: [
      { id: 'aldea', label: 'Aldea' },
      { id: 'caserio', label: 'Caserío' },
      { id: 'hato', label: 'Hato' },
      { id: 'finca', label: 'Finca' },
      { id: 'granja', label: 'Granja' },
      { id: 'hacienda', label: 'Hacienda' },
      { id: 'paraje', label: 'Paraje' },
      { id: 'poblado', label: 'Poblado' },
    ],
  },
];

// Convierte ADDRESS_DATA a una lista plana apta para SelectBox
// - Inserta un item de cabecera deshabilitado por cada grupo
// - Inserta items hijos con indent=1
const useFlattenedAddressOptions = (data, excludeIds = []) => {
  return useMemo(() => {
    const flat = [];
    (data || []).forEach(group => {
      const children = (group.items || []).filter(item => !excludeIds.includes(item.id));
      // Siempre agregamos header
      flat.push({ id: `header-${group.id}`, label: group.title, disabled: true });
      // Solo agregamos hijos disponibles
      children.forEach(item => {
        flat.push({ id: `${group.id}-${item.id}`, realId: item.id, label: item.label, indent: 1 });
      });
    });
    return flat;
  }, [data, excludeIds]);
};

// Fila de Input + botón eliminar
const AddressValueRow = ({ index, label, value, onChange, onRemove, inputRef }) => {
  return (
    <View style={styles.inputWithDeleteContainer}>
      <View style={styles.inputContainer}>
        <InputText
          ref={inputRef}
          id={`valor-${index}`}
          labelTitle={label}
          value={value}
          labelPosition="left"
          placeholder={label}
          onChange={(id, v) => onChange(index, v)}
          style={{ marginRight: 10 }}
        />
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => onRemove(index)}>
        <MaterialCommunityIcons name="close" size={20} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );
};

const SelectDirecciones = ({
  id = 'direccion_compuesta',
  labelTitle = 'Dirección',
  onChange = () => {},
  value = '',
  data = ADDRESS_DATA,
}) => {
  const [active, setActive] = useState([]); // [{ tipo: 'calle', label: 'Calle', valor: '' }]
  const [selectedTipo, setSelectedTipo] = useState('');
  const inputRefs = useRef({}); // mapa tipo -> ref de InputText

  const excludeIds = useMemo(() => active.map(a => a.tipo), [active]);
  const options = useFlattenedAddressOptions(data, excludeIds);

  const getLabelByTipo = (tipo) => {
    // Busca en data original para mayor confiabilidad
    for (const group of data || []) {
      const item = (group.items || []).find(it => it.id === tipo);
      if (item) return item.label;
    }
    // Fallback por si viene desde lista aplanada
    const opt = options.find(o => (o.realId || o.id) === tipo || o.realId === tipo);
    return opt?.label || tipo || '';
  };

  const composedText = useMemo(() => {
    const parts = active
      .map(s => ({ ...s, valor: (s.valor || '').trim() }))
      .filter(s => s.valor)
      .map(s => `${getLabelByTipo(s.tipo)} ${s.valor}`);
    return parts.join(', ');
  }, [active, data]);

  const handleAdd = () => {
    if (!selectedTipo) return;
    // Evitar duplicados
    if (active.some(s => s.tipo === selectedTipo)) return;

    const label = getLabelByTipo(selectedTipo);
    // Crear ref si no existe para este tipo
    if (!inputRefs.current[selectedTipo]) {
      inputRefs.current[selectedTipo] = React.createRef();
    }
    setActive(prev => [...prev, { tipo: selectedTipo, label, valor: '' }]);
    // Limpiar selección y enfocar el nuevo input
    const tipoParaFoco = selectedTipo;
    setSelectedTipo('');
    setTimeout(() => {
      const r = inputRefs.current[tipoParaFoco];
      if (r && r.current && typeof r.current.focus === 'function') {
        r.current.focus();
      }
    }, 0);
  };

  const handleChangeValor = (index, valor) => {
    setActive(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], valor };
      return copy;
    });
  };

  const handleRemove = (index) => {
    setActive(prev => {
      const tipo = prev[index]?.tipo;
      const next = prev.filter((_, i) => i !== index);
      if (tipo && inputRefs.current[tipo]) {
        delete inputRefs.current[tipo];
      }
      return next;
    });
  };

  // Comunicar hacia arriba el string compuesto cada vez que cambia
  useEffect(() => {
    onChange(id, composedText);
  }, [composedText]);

  return (
    <View style={styles.container}>
      <Text style={styles.mainLabel}>{labelTitle}</Text>

      {/* Fila selector + botón agregar, estilo similar a redes sociales */}
      <View style={styles.selectInputContainer}>
        <View style={styles.selectBoxContainer}>
          <SelectBox
            id="direccionSelector"
            value={selectedTipo}
            labelTitle=""
            onChange={(id, value) => setSelectedTipo(value)}
            options={options}
            enabled={true}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <MaterialCommunityIcons name="plus" size={20} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Inputs agregados dinámicamente */}
      {active.map((seg, index) => (
        <AddressValueRow
          key={`${seg.tipo}-${index}`}
          index={index}
          label={getLabelByTipo(seg.tipo)}
          value={seg.valor}
          onChange={handleChangeValor}
          onRemove={handleRemove}
          inputRef={inputRefs.current[seg.tipo]}
        />
      ))}
    </View>
  );
};

export default SelectDirecciones;

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  mainLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontSize: 16,
  },
  selectInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0
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
    minWidth: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#007bff',
    marginBottom: 15,
  },
  inputWithDeleteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#dc3545',
    marginBottom: 10,
  },
});
