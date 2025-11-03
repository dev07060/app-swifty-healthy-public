import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { EditableTextOverlay } from './EditableTextOverlay';
import type { GeminiFoodResponse, GeminiExerciseResponse } from '../types';
import {
  mapAnalysisToFloatingText,
  getEditableFields,
} from '../utils/analysisDataMapper';
import {
  validateEditedField,
  getFieldOptions,
  getFieldType,
  getFieldLabel,
} from '../utils/editValidation';

interface FloatingAnalysisResultsProps {
  analysisData: GeminiFoodResponse | GeminiExerciseResponse;
  entryType: 'food' | 'exercise';
  onItemEdit: (key: string, value: string) => void;
  isEditing: boolean;
  onValidationError?: (error: string) => void;
}

export function FloatingAnalysisResults({
  analysisData,
  entryType,
  onItemEdit,
  isEditing,
  onValidationError,
}: FloatingAnalysisResultsProps) {
  // State for edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<{
    key: string;
    value: string;
    label: string;
  } | null>(null);
  // Remove animation code
  // Convert analysis data to floating text items using the mapper
  const textItems = useMemo(() => {
    return mapAnalysisToFloatingText(analysisData, entryType);
  }, [analysisData, entryType]);

  // Get editable fields for this entry type
  const editableFields = useMemo(() => {
    return getEditableFields(entryType);
  }, [entryType]);

  // Remove unused code

  const handleItemPress = (key: string, currentValue: string) => {
    if (isEditing && editableFields.includes(key)) {
      // Open edit modal
      setEditingField({
        key,
        value: currentValue,
        label: getFieldLabel(key),
      });
      setIsEditModalVisible(true);
    }
  };

  const handleEditSave = (newValue: string) => {
    if (!editingField) return;

    // Validate the new value
    const validation = validateEditedField(editingField.key, newValue, entryType);
    
    if (!validation.isValid) {
      if (onValidationError && validation.error) {
        onValidationError(validation.error);
      }
      return;
    }

    // Use sanitized value if available
    const finalValue = validation.sanitizedValue || newValue;
    
    // Update the data
    onItemEdit(editingField.key, finalValue);
    
    // Close modal and reset editing state
    setIsEditModalVisible(false);
    setEditingField(null);
  };

  const handleEditCancel = () => {
    // Close modal and reset editing state without saving
    setIsEditModalVisible(false);
    setEditingField(null);
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.listContainer}>
          {textItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.resultItem}
              onPress={() => handleItemPress(item.key, item.value)}
              disabled={!isEditing || !editableFields.includes(item.key)}
              activeOpacity={1}
            >
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
              {isEditing && editableFields.includes(item.key) && (
                <View style={styles.editIndicator}>
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Edit Modal */}
      {editingField && (
        <EditableTextOverlay
          visible={isEditModalVisible}
          initialValue={editingField.value}
          fieldType={getFieldType(editingField.key)}
          fieldLabel={editingField.label}
          fieldKey={editingField.key}
          options={getFieldOptions(editingField.key, entryType)}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
          placeholder={`새로운 ${editingField.label} 입력`}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  listContainer: {
    width: '100%',
    gap: 16,
  },
  resultItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    minHeight: 70,
    maxHeight: 120, // 2줄 텍스트를 위한 최대 높이
    justifyContent: 'center',
    width: '100%',
  },
  // Removed editing visual effects
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CBD5E0',
    marginBottom: 4,
    textAlign: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 22,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  editIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3182F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 12,
  },
});