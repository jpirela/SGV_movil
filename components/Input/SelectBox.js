import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
} from 'react-native';

const SelectBox = forwardRef(({
  id,
  labelTitle,
  value,
  options,
  onChange,
  labelPosition = 'top',
  hasError = false,
  enabled = true,
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (enabled) {
        setModalVisible(true);
        setFocused(true);
      }
    },
  }));

  const dataArray = Array.isArray(options)
    ? options
    : options && typeof options === 'object'
      ? Object.values(options)
      : [];

  const isLeft = labelPosition === 'left';

  const selectedItem = dataArray.find(
    (o) =>
      (o.realId || o.id || o.id_estado || o.value || '').toString() ===
      (value || '').toString()
  );
  const selectedLabel = selectedItem?.texto || selectedItem?.nombre || selectedItem?.label || '';

  const filteredOptions = dataArray.filter((o) => {
    const label = o.texto || o.nombre || o.label || '';
    return label.toLowerCase().includes(query.toLowerCase());
  });

  const handleSelect = (itemValue, itemLabel) => {
    setModalVisible(false);
    setFocused(false);
    setQuery('');
    if (onChange) {
      onChange(id, itemValue);
    }
  };

  return (
    <View style={[styles.container, isLeft ? styles.leftAlign : styles.topAlign]}>
      {labelTitle ? (
        <Text style={[styles.label, isLeft ? styles.labelLeft : styles.labelTop, hasError && styles.errorText]}>
          {labelTitle}
        </Text>
      ) : null}

      <TouchableWithoutFeedback
        onPress={() => {
          if (enabled) {
            setModalVisible(true);
            setFocused(true);
          }
        }}
      >
        <View
          style={[
            styles.pickerWrapper,
            isLeft ? styles.pickerLeft : styles.pickerTop,
            hasError && styles.errorBorder,
            focused && styles.focusedBorder,
          ]}
        >
          <Text style={selectedLabel ? styles.textValue : styles.placeholder}>
            {selectedLabel || 'Seleccionar opción'}
          </Text>
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TextInput
              placeholder="Buscar..."
              value={query}
              onChangeText={setQuery}
              autoFocus
              style={styles.searchInput}
            />
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) =>
                `${labelTitle || 'select'}-${item.id || item.realId || index}`
              }
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => {
                const itemValue = (item.realId || item.id || item.id_estado || item.value || index).toString();
                const itemLabel = item.texto || item.nombre || item.label || `Item ${index + 1}`;
                return (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleSelect(itemValue, itemLabel)}
                  >
                    <Text>{itemLabel}</Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setFocused(false);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default SelectBox;

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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pickerTop: {
    width: '100%',
  },
  pickerLeft: {
    width: '60%',
  },
  textValue: {
    color: '#000',
  },
  placeholder: {
    color: '#aaa',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: '80%',
    padding: 20,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  optionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
