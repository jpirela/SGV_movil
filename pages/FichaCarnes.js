import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import InputText from '../components/Input/InputText';
import CheckBox from '../components/Input/CheckBox';

const cortesCarnes = [
  'Res Ganso',
  'Solomo',
  'Chocozuela',
  'Pollo Entero',
  'Pechuga',
  'Muslo',
  'Molida Especial',
];

export default function FichaCarnes() {
  const [formState, setFormState] = useState({});

  const updateField = (seccion, campo, valor) => {
    setFormState(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor,
      },
    }));
  };

  const toggleSwitch = (campo) => {
    setFormState(prev => ({
      ...prev,
      formasPago: {
        ...prev.formasPago,
        [campo]: !prev?.formasPago?.[campo],
      },
    }));
  };

  return (
    <ScrollView style={styles.container}>
      {cortesCarnes.map(corte => (
        <View key={corte} style={styles.card}>
          <Text style={styles.title}>{corte}</Text>

          <InputText
            labelTitle="Cantidad de Kg por corte"
            value={formState?.[corte]?.cantidad || ''}
            placeholder="Ej. 20"
            onChange={(v) => updateField(corte, 'cantidad', v)}
          />
          <InputText
            labelTitle="Frecuencia de compra"
            value={formState?.[corte]?.frecuencia || ''}
            placeholder="Ej. semanal"
            onChange={(v) => updateField(corte, 'frecuencia', v)}
          />
          <InputText
            labelTitle="Precio referencia de compra"
            value={formState?.[corte]?.precio || ''}
            placeholder="Ej. 1200 Bs"
            onChange={(v) => updateField(corte, 'precio', v)}
          />
        </View>
      ))}

      <View style={styles.section}>
        <InputText
          labelTitle="Días de recepción de mercancía"
          value={formState?.recepcionDias || ''}
          placeholder="Ej. Lunes y Jueves"
          onChange={(v) => updateField('general', 'recepcionDias', v)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Formas de pago:</Text>
        {['efectivo', 'transferenciaBS', 'zelle', 'transferenciaInt'].map(metodo => (
          <CheckBox
            key={metodo}
            labelTitle={labelForMetodo(metodo)}
            value={formState?.formasPago?.[metodo] || false}
            onChange={() => toggleSwitch(metodo)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Condición de pago:</Text>
        <InputText
          labelTitle="Crédito"
          value={formState?.condicionPago?.credito || ''}
          placeholder="Ej. Sí o No"
          onChange={(v) => updateField('condicionPago', 'credito', v)}
        />
        <InputText
          labelTitle="Contado"
          value={formState?.condicionPago?.contado || ''}
          placeholder="Ej. Sí o No"
          onChange={(v) => updateField('condicionPago', 'contado', v)}
        />
        <InputText
          labelTitle="Días de crédito"
          value={formState?.condicionPago?.diasCredito || ''}
          placeholder="Ej. 15"
          onChange={(v) => updateField('condicionPago', 'diasCredito', v)}
        />
        <InputText
          labelTitle="Días de pago"
          value={formState?.condicionPago?.diasPago || ''}
          placeholder="Ej. Lunes"
          onChange={(v) => updateField('condicionPago', 'diasPago', v)}
        />
      </View>
    </ScrollView>
  );
}

function labelForMetodo(key) {
  switch (key) {
    case 'efectivo': return 'Efectivo';
    case 'transferenciaBS': return 'Bs. Transferencia (Banco)';
    case 'zelle': return 'Zelle';
    case 'transferenciaInt': return 'Transferencia Internacional (Banco)';
    default: return key;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
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
  section: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
  },
  subtitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
    color: '#444',
  },
});
