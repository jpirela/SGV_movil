import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import CheckBox from '../components/Input/CheckBox';
import InputText from '../components/Input/InputText';

const cortes = [
  'Pernil',
  'Paleta',
  'Panceta',
  'Cuero Tapa o Barriga',
  'Riñonada',
  'Paticas Ahumadas',
  'Chorizos Ahumados',
  'Morcillas',
  'R#1 70% Carne 30% Grasa',
];

export default function FichaCerdos() {
  const [formState, setFormState] = useState({});

  const toggleSwitch = (corte, campo) => {
    setFormState(prev => ({
      ...prev,
      [corte]: {
        ...prev[corte],
        [campo]: !prev?.[corte]?.[campo],
      },
    }));
  };

  const updateField = (corte, campo, value) => {
    setFormState(prev => ({
      ...prev,
      [corte]: {
        ...prev[corte],
        [campo]: value,
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      {cortes.map(corte => (
        <View key={corte} style={styles.card}>
          <Text style={styles.title}>{corte}</Text>

          <View style={styles.switchRow}>
            <CheckBox
              labelTitle="Con piel"
              value={formState?.[corte]?.conPiel || false}
              onChange={() => toggleSwitch(corte, 'conPiel')}
            />
            <CheckBox
              labelTitle="Sin piel"
              value={formState?.[corte]?.sinPiel || false}
              onChange={() => toggleSwitch(corte, 'sinPiel')}
            />
          </View>

          <View style={styles.switchRow}>
            <CheckBox
              labelTitle="Rebanado"
              value={formState?.[corte]?.rebanado || false}
              onChange={() => toggleSwitch(corte, 'rebanado')}
            />
            <CheckBox
              labelTitle="Sí"
              value={formState?.[corte]?.si || false}
              onChange={() => toggleSwitch(corte, 'si')}
            />
            <CheckBox
              labelTitle="No"
              value={formState?.[corte]?.no || false}
              onChange={() => toggleSwitch(corte, 'no')}
            />
          </View>

          <InputText
            labelTitle="Cantidad de Kg por corte"
            value={formState?.[corte]?.cantidad || ''}
            placeholder="Ej. 10"
            onChange={value => updateField(corte, 'cantidad', value)}
          />

          <InputText
            labelTitle="Frecuencia de compra"
            value={formState?.[corte]?.frecuencia || ''}
            placeholder="Ej. semanal"
            onChange={value => updateField(corte, 'frecuencia', value)}
          />

          <InputText
            labelTitle="Precio referencia de compra"
            value={formState?.[corte]?.precio || ''}
            placeholder="Ej. 1500 Bs"
            onChange={value => updateField(corte, 'precio', value)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
});
