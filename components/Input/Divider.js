// components/Divider.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Divider({
  type = 'horizontal', // 'horizontal' o 'vertical'
  text = '',
  containerStyle = {},
  lineColor = '#ccc',
  textStyle = {},
}) {
  const isHorizontal = type === 'horizontal';

  return (
    <View
      style={[
        styles.container,
        isHorizontal ? styles.horizontal : styles.vertical,
        containerStyle,
      ]}
    >
      {isHorizontal ? (
        <>
          <View style={[styles.line, { backgroundColor: lineColor }]} />
          {text !== '' && (
            <Text style={[styles.text, textStyle]}>{text}</Text>
          )}
          <View style={[styles.line, { backgroundColor: lineColor }]} />
        </>
      ) : (
        <View style={styles.verticalWrapper}>
          <View style={[styles.verticalLine, { backgroundColor: lineColor }]} />
          {text !== '' && (
            <Text style={[styles.verticalText, textStyle]}>{text}</Text>
          )}
          <View style={[styles.verticalLine, { backgroundColor: lineColor }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  text: {
    marginHorizontal: 8,
    fontSize: 14,
    color: '#555',
  },
  verticalWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: '#ccc',
    marginVertical: 4,
  },
  verticalText: {
    transform: [{ rotate: '90deg' }],
    marginVertical: 4,
    fontSize: 14,
    color: '#555',
  },
});
