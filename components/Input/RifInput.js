import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Text, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import InputText from './InputText';

const RifInput = forwardRef(({ 
  id, 
  value = '', 
  onChange, 
  hasError = false, 
  disabled = false 
}, ref) => {
  
  // Opciones de prefijos
  const prefixOptions = [
    { value: 'V', label: 'V' },
    { value: 'E', label: 'E' },
    { value: 'C', label: 'C' },
    { value: 'J', label: 'J' },
    { value: 'G', label: 'G' },
    { value: 'R', label: 'R' }
  ];
  
  const [prefix, setPrefix] = useState('V');
  const [number, setNumber] = useState('');
  const [verifier, setVerifier] = useState('');
  
  // Prefijos que muestran el campo verificador
  const requiresVerifier = ['C', 'J', 'G', 'R'];
  const showVerifier = requiresVerifier.includes(prefix);
  
  // Parsear valor inicial cuando se carga
  useEffect(() => {
    if (value && typeof value === 'string') {
      // Intentar parsear formato: PREFIJO + NUMERO + (-VERIFICADOR opcional)
      const match = value.match(/^([VEJCGR])(\d+)(?:-(\d))?$/);
      if (match) {
        setPrefix(match[1]);
        setNumber(match[2]);
        setVerifier(match[3] || '');
      } else {
        // Si no coincide con el formato esperado, limpiar
        setPrefix('V');
        setNumber('');
        setVerifier('');
      }
    } else if (!value) {
      // Si valor está vacío, usar valores por defecto
      setPrefix('V');
      setNumber('');
      setVerifier('');
    }
  }, [value]);
  
  // Construir valor final cuando cambie algún componente
  const buildFinalValue = (currentPrefix, currentNumber, currentVerifier) => {
    if (!currentNumber.trim()) {
      return ''; // Si no hay número, retornar vacío
    }
    
    let finalValue = currentPrefix + currentNumber;
    
    // Solo agregar "-" + verificador si el verificador NO está vacío
    if (currentVerifier.trim() !== '') {
      finalValue += '-' + currentVerifier;
    }
    
    return finalValue;
  };
  
  // Actualizar valor cuando cambien los componentes
  const updateValue = (newPrefix = prefix, newNumber = number, newVerifier = verifier) => {
    const finalValue = buildFinalValue(newPrefix, newNumber, newVerifier);
    
    if (onChange && finalValue !== value) {
      onChange(id, finalValue);
    }
  };
  
  // Validar solo números en el campo principal
  const handleNumberChange = (inputId, inputValue) => {
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    setNumber(numericValue);
    updateValue(prefix, numericValue, verifier);
  };
  
  // Validar solo números en el campo verificador (máximo 1 dígito)
  const handleVerifierChange = (inputId, inputValue) => {
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    const singleDigit = numericValue.length > 0 ? numericValue.charAt(0) : '';
    setVerifier(singleDigit);
    updateValue(prefix, number, singleDigit);
  };
  
  // Cambiar prefijo y limpiar verificador si no lo requiere
  const handlePrefixChange = (newPrefix) => {
    setPrefix(newPrefix);
    
    // Si el nuevo prefijo no requiere verificador, limpiar el campo
    const newVerifier = requiresVerifier.includes(newPrefix) ? verifier : '';
    if (!requiresVerifier.includes(newPrefix)) {
      setVerifier('');
    }
    
    updateValue(newPrefix, number, newVerifier);
  };
  
  // Exponer métodos para validación externa
  useImperativeHandle(ref, () => ({
    focus: () => {
      // El foco se puede manejar si necesario
    },
    getValue: () => {
      return buildFinalValue(prefix, number, verifier);
    },
    isValid: () => {
      return number.trim() !== '';
    },
    clear: () => {
      setPrefix('V');
      setNumber('');
      setVerifier('');
      if (onChange) {
        onChange(id, '');
      }
    }
  }));
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>RIF / Cédula</Text>
      <View style={styles.rowContainer}>
        
        {/* Picker de prefijos */}
        <View style={[styles.pickerContainer, hasError && styles.errorBorder]}>
          <Picker
            selectedValue={prefix}
            onValueChange={handlePrefixChange}
            enabled={!disabled}
            style={styles.picker}
            mode="dropdown"
          >
            {prefixOptions.map(option => (
              <Picker.Item 
                key={option.value} 
                label={option.value} 
                value={option.value}
              />
            ))}
          </Picker>
        </View>
        
        {/* Campo de número principal */}
        <View style={[styles.numberContainer, hasError && styles.errorBorder]}>
          <TextInput
            value={number}
            placeholder="12345678"
            keyboardType="numeric"
            onChangeText={(text) => handleNumberChange(`${id}_number`, text)}
            style={styles.numberInput}
            maxLength={12}
            editable={!disabled}
          />
        </View>
        
        {/* Campo de dígito verificador (solo para C, J, G, R) */}
        {showVerifier && (
          <View style={[styles.verifierContainer, hasError && styles.errorBorder]}>
            <TextInput
              value={verifier}
              placeholder="0"
              keyboardType="numeric"
              onChangeText={(text) => handleVerifierChange(`${id}_verifier`, text)}
              style={styles.verifierInput}
              maxLength={1}
              editable={!disabled}
            />
          </View>
        )}
      </View>
      
      {/* Mostrar valor final para debug/preview */}
      {(number || verifier) && (
        <Text style={styles.preview}>
          Valor final: {buildFinalValue(prefix, number, verifier)}
        </Text>
      )}
      
      {hasError && (
        <Text style={styles.errorText}>
          RIF/Cédula requerido
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  errorBorder: {
    borderColor: '#ff0000',
    borderWidth: 2,
  },
  pickerContainer: {
    flex: 0,
    width: 80,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  picker: {
    height: 50,
    width: '100%',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  numberContainer: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginRight: 8,
  },
  numberInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  verifierContainer: {
    flex: 0,
    width: 60,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  verifierInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  preview: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
});

RifInput.displayName = 'RifInput';

export default RifInput;