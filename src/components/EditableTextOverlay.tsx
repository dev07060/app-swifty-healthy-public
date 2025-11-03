import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

interface EditableTextOverlayProps {
  visible: boolean;
  initialValue: string;
  fieldType: 'text' | 'number' | 'multiselect';
  fieldLabel: string;
  fieldKey?: string; // Add field key to identify calorie fields
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
  options = [],
  onSave,
  onCancel,
  placeholder,
}: EditableTextOverlayProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selectedOption, setSelectedOption] = useState(initialValue);
  
  // Check if this is a calorie field
  const isCalorieField = fieldKey === 'calories' || fieldKey === 'estimatedCalories';
  
  // Extract numeric value from calorie string (e.g., "250kcal" -> "250")
  const getNumericValue = (value: string): string => {
    if (isCalorieField) {
      const match = value.match(/(\d+)/);
      return match && match[1] ? match[1] : '';
    }
    return value;
  };
  

  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Reset input value when modal becomes visible
  useEffect(() => {
    if (visible) {
      setInputValue(isCalorieField ? getNumericValue(initialValue) : initialValue);
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
  }, [visible, initialValue, fadeAnim, scaleAnim, slideAnim]);

  const handleSave = () => {
    let valueToSave = fieldType === 'multiselect' ? selectedOption : inputValue;
    
    // Basic validation
    if (fieldType === 'number' && valueToSave) {
      const numericValue = isCalorieField ? getNumericValue(valueToSave) : valueToSave;
      if (isNaN(Number(numericValue))) {
        return; // Don't save invalid numbers
      }
      // For calorie fields, save the numeric value directly
      if (isCalorieField) {
        valueToSave = numericValue;
      }
    }
    
    onSave(valueToSave);
  };

  const handleCancel = () => {
    // Reset to initial values
    setInputValue(isCalorieField ? getNumericValue(initialValue) : initialValue);
    setSelectedOption(initialValue);
    onCancel();
  };

  const renderTextInput = () => {
    if (isCalorieField) {
      return (
        <View style={styles.calorieInputContainer}>
          <TextInput
            style={styles.calorieInput}
            value={inputValue}
            onChangeText={(text) => {
              // Only allow numeric input for calorie fields
              const numericText = text.replace(/\D/g, '');
              setInputValue(numericText);
            }}
            placeholder="0"
            placeholderTextColor="#A0AEC0"
            keyboardType="numeric"
            autoFocus={true}
            selectTextOnFocus={true}
          />
          <Text style={styles.calorieUnit}>kcal</Text>
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
    <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
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
          {selectedOption === option && (
            <Text style={styles.checkmark}>✓</Text>
          )}
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
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{fieldLabel} 수정</Text>
              <Text style={styles.modalSubtitle}>
                {fieldType === 'multiselect' 
                  ? '옵션을 선택하세요' 
                  : '새로운 값을 입력하세요'
                }
              </Text>
            </View>

            <View style={styles.modalContent}>
              {fieldType === 'multiselect' ? renderMultiSelect() : renderTextInput()}
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
  calorieInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    minHeight: 48,
  },
  calorieInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    textAlign: 'right',
  },
  calorieUnit: {
    paddingRight: 12,
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
});