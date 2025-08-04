import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StaticText = ({
  id,
  labelTitle,
  value = '',
  labelPosition = 'top',
}) => {
  const isLeft = labelPosition === 'left';

  return (
    <View style={[styles.container, isLeft ? styles.leftAlign : styles.topAlign]}>
      {labelTitle ? (
        <Text style={[styles.label, isLeft ? styles.labelLeft : styles.labelTop]}>
          {labelTitle}
        </Text>
      ) : null}
      
      <View style={[styles.textWrapper, isLeft ? styles.textLeft : styles.textTop]}>
        <Text style={styles.textValue}>
          {value || 'Sin información'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  topAlign: {
    flexDirection: 'column',
  },
  leftAlign: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  labelTop: {
    marginBottom: 4,
    width: '100%',
  },
  labelLeft: {
    width: '40%',
    marginRight: 8,
  },
  textWrapper: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    backgroundColor: '#f9f9f9',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  textTop: {
    width: '100%',
  },
  textLeft: {
    width: '60%',
  },
  textValue: {
    color: '#333',
    fontSize: 16,
  },
});

export default StaticText;
