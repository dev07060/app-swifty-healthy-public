import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheet } from './BottomSheet';

interface ExerciseRequirementsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export function ExerciseRequirementsBottomSheet({
  visible,
  onClose,
  onProceed,
}: ExerciseRequirementsBottomSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>운동 인증 요구사항</Text>
          <Text style={styles.subtitle}>
            이미지에 아래 사항들이 포함되어 있는지 확인해주세요.
          </Text>
        </View>

        <View style={styles.requirementsSection}>
          <View style={styles.cardsContainer}>
            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>운동 앱 화면 캡쳐 시</Text>
              </View>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.requirementText}>날짜</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.requirementText}>운동 시간</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.requirementText}>소모 칼로리</Text>
                </View>
              </View>
            </View>

            <View style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>워치 화면 촬영시</Text>
              </View>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.requirementText}>운동 시간</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={styles.bulletIcon}>•</Text>
                  <Text style={styles.requirementText}>운동 정보(선택)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>주의사항</Text>
            <Text style={styles.warningText}>
              위 요구사항이 충족되지 않은 이미지는 분석에 실패할 수 있습니다.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, styles.cancelButtonText]}>
              취소
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.proceedButton]}
            onPress={onProceed}
          >
            <Text style={[styles.buttonText, styles.proceedButtonText]}>
              분석 시작
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 20,
  },
  requirementsSection: {
    marginBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletIcon: {
    fontSize: 18,
    color: '#4A5568',
    marginRight: 8,
    marginTop: 2,
  },
  requirementText: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#1A202C',
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
    flexDirection: 'row',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedButton: {
    backgroundColor: '#3182F6',
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  proceedButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    color: '#1A202C',
  },
});
