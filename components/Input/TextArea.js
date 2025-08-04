import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const TextArea = forwardRef(({
  id,
  labelTitle,
  value,
  placeholder,
  onChange,
  labelPosition = 'top',
  hasError = false,
}, ref) => {
  const [focused, setFocused] = useState(false);

  const isLeft = labelPosition === 'left';

  return (
    <View style={[styles.container, isLeft ? styles.leftAlign : styles.topAlign]}>
      {labelTitle ? (
        <Text style={[styles.label, isLeft ? styles.labelLeft : styles.labelTop, hasError && styles.errorText]}>
          {labelTitle}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        multiline
        numberOfLines={4}
        style={[
          styles.textarea,
          isLeft ? styles.textareaLeft : styles.textareaTop,
          hasError && styles.errorBorder,
          focused && styles.focusedBorder,
        ]}
        value={value}
        placeholder={placeholder}
        onChangeText={(text) => onChange(id, text)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
});

export default TextArea;

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
    alignItems: 'flex-start',
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
    marginTop: 6,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 4,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  textareaTop: {
    width: '100%',
  },
  textareaLeft: {
    width: '60%',
  },
  errorText: {
    color: 'red',
  },
  errorBorder: {
    borderColor: 'red',
  },
  focusedBorder: {
    borderColor: '#007AFF',
  },
});
