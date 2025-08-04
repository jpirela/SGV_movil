import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

export default function CheckBox({
  id,
  labelTitle,
  value,
  onChange,
  labelPosition = 'left', // "top" o "left"
  hasError = false,
}) {
  const isLeft = labelPosition === 'left';
  const [isFocused, setIsFocused] = useState(false);

  const handleValueChange = (val) => {
    setIsFocused(true);
    onChange(id, val);
    setTimeout(() => setIsFocused(false), 1500); // Simula un efecto de "enfoque"
  };

  return (
    <View
      style={[
        styles.container,
        isLeft ? styles.leftAlign : styles.topAlign,
        isFocused && styles.focused,
        hasError && styles.errorBorder,
      ]}
    >
      {labelTitle ? (
        <Text
          style={[
            styles.label,
            isLeft ? styles.labelLeft : styles.labelTop,
            hasError && styles.errorText,
          ]}
        >
          {labelTitle}
        </Text>
      ) : null}

      <Switch
        value={value}
        onValueChange={handleValueChange}
        style={isLeft ? styles.switchLeft : styles.switchTop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
  },
  focused: {
    borderColor: '#007bff',
  },
  errorBorder: {
    borderColor: 'red',
  },
  topAlign: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  leftAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  labelTop: {
    marginBottom: 4,
  },
  labelLeft: {
    marginRight: 12,
  },
  switchTop: {
    alignSelf: 'flex-start',
  },
  switchLeft: {
    flex: 1,
  },
  errorText: {
    color: 'red',
  },
});
