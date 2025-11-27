import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface EditableTextOverlayProps {
  visible: boolean;
  initialValue: string;
  fieldType: 'text' | 'number' | 'multiselect';
  fieldLabel: string;
  fieldKey?: string; // Add field key to identify calorie fields
  unit?: string; // Add unit prop
  options?: string[]; // For multiselect type
  onSave: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export function EditableTextOverlay({
  visible,
  initialValue,
  fieldType,
  fieldLabel,
  fieldKey,
  unit,
  options = [],
  onSave,
  onCancel,
  placeholder,
}: EditableTextOverlayProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedOption, setSelectedOption] = useState(initialValue);

  // Extract numeric value from string with unit
  const getNumericValue = useCallback(
    (value: string): string => {
      if (unit) {
        const cleanedValue = value.replace(unit, '').trim();
        const match = cleanedValue.match(/(\d+(\.\d+)?)/); // Allow for decimal numbers
        return match?.[1] ? match[1] : '';
      }
      return value;
    },
    [unit],
  );

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Reset input value when modal becomes visible
  useEffect(() => {
    if (visible) {
      setInputValue(
        unit ? getNumericValue(initialValue) : initialValue,
      );
      setSelectedOption(initialValue);

      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(50);
    }
  }, [
    visible,
    initialValue,
    fadeAnim,
    scaleAnim,
    slideAnim,
    unit,
    getNumericValue,
  ]);

  const handleSave = () => {
    let valueToSave = fieldType === 'multiselect' ? selectedOption : inputValue;

    // Basic validation
    if (fieldType === 'number' && valueToSave) {
      const numericValue = unit
        ? getNumericValue(valueToSave)
        : valueToSave;
      if (Number.isNaN(Number(numericValue))) {
        return; // Don't save invalid numbers
      }
      // For fields with units, save the numeric value directly
      if (unit) {
        valueToSave = numericValue;
      }
    }

    onSave(valueToSave);
  };

  const handleCancel = () => {
    // Reset to initial values
    setInputValue(
      unit ? getNumericValue(initialValue) : initialValue,
    );
    setSelectedOption(initialValue);
    onCancel();
  };

  const renderTextInput = () => {
    if (unit) {
      return (
        <View style={styles.inputWithUnitContainer}>
          <TextInput
            style={styles.numericInput}
            value={inputValue}
            onChangeText={(text) => {
              // Only allow numeric input for fields with units
              const numericText = text.replace(/[^0-9.]/g, ''); // Allow decimal numbers
              setInputValue(numericText);
            }}
            placeholder="0"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
            autoFocus={true}
            selectTextOnFocus={true}
          />
          <Text style={styles.unitText}>{unit}</Text>
        </View>
      );
    }

    return (
      <TextInput
        style={styles.textInput}
        value={inputValue}
        onChangeText={setInputValue}
        placeholder={placeholder || `${fieldLabel} 입력`}
        placeholderTextColor="#A0AEC0"
        keyboardType={fieldType === 'number' ? 'numeric' : 'default'}
        autoFocus={true}
        selectTextOnFocus={true}
        multiline={fieldType === 'text' && inputValue.length > 30}
        numberOfLines={fieldType === 'text' ? undefined : 1}
      />
    );
  };

  const renderMultiSelect = () => (
    <ScrollView
      style={styles.optionsContainer}
      showsVerticalScrollIndicator={false}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionItem,
            selectedOption === option && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption(option)}
        >
          <Text
            style={[
              styles.optionText,
              selectedOption === option && styles.selectedOptionText,
            ]}
          >
            {option}
          </Text>
          {selectedOption === option && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={handleCancel}
            activeOpacity={1}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{fieldLabel} 수정</Text>
              <Text style={styles.modalSubtitle}>
                {fieldType === 'multiselect'
                  ? '옵션을 선택하세요'
                  : '새로운 값을 입력하세요'}
              </Text>
            </View>

            <View style={styles.modalContent}>
              {fieldType === 'multiselect'
                ? renderMultiSelect()
                : renderTextInput()}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: Math.min(screenWidth - 40, 400),
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
  },
  modalContent: {
    padding: 20,
    maxHeight: 300,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    backgroundColor: '#F7FAFC',
    minHeight: 48,
  },
  optionsContainer: {
    maxHeight: 250,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedOption: {
    backgroundColor: '#EBF8FF',
    borderColor: '#3182F6',
  },
  optionText: {
    fontSize: 16,
    color: '#1A202C',
    flex: 1,
  },
  selectedOptionText: {
    color: '#3182F6',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#3182F6',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#3182F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#718096',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  inputWithUnitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    minHeight: 48,
  },
  numericInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    textAlign: 'right',
  },
  unitText: {
    paddingRight: 12,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
});
