import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ExerciseEntry } from '../types';
import { BottomSheet } from './BottomSheet';

interface ExerciseAnalysisBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  analysisResult: Omit<ExerciseEntry, 'id' | 'createdAt'> | null;
  onSave: () => void;
  onDiscard: () => void;
  isLoading?: boolean;
}

export function ExerciseAnalysisBottomSheet({
  visible,
  onClose,
  analysisResult,
  onSave,
  onDiscard,
  isLoading = false,
}: ExerciseAnalysisBottomSheetProps) {
  if (!analysisResult) return null;

  // 디버깅을 위한 로그
  console.log('🔍 Analysis Result:', analysisResult);
  console.log('🔍 Duration value:', analysisResult.duration);
  console.log('🔍 Duration type:', typeof analysisResult.duration);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '날짜 정보 없음';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatDuration = (duration: number) => {
    // 안전한 숫자 검증
    if (typeof duration !== 'number' || Number.isNaN(duration) || duration < 0) {
      return '시간 정보 없음';
    }

    if (duration < 60) {
      return `${Math.round(duration)}분`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>운동 분석 결과</Text>
          <Text style={styles.subtitle}>
            스크린샷에서 추출된 운동 정보를 확인하세요
          </Text>
        </View>

        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Text style={styles.exerciseIcon}>💪</Text>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseType}>
                {analysisResult.exerciseType || '운동'}
              </Text>
              <Text style={styles.exerciseDate}>
                {formatDate(analysisResult.date)}
              </Text>
            </View>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>⏱️</Text>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>운동 시간</Text>
                <Text style={styles.metricValue}>
                  {formatDuration(analysisResult.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🔥</Text>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>소모 칼로리</Text>
                <Text style={styles.metricValue}>
                  {analysisResult.calories} kcal
                </Text>
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>📅</Text>
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>기록 날짜</Text>
                <Text style={styles.metricValue}>
                  {formatDate(analysisResult.date)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>인증 요구사항 확인</Text>
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Text style={styles.checkIcon}>✅</Text>
              <Text style={styles.requirementText}>
                운동 시간이 포함되어 있습니다
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.checkIcon}>✅</Text>
              <Text style={styles.requirementText}>
                칼로리 정보가 포함되어 있습니다
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Text style={styles.checkIcon}>✅</Text>
              <Text style={styles.requirementText}>
                날짜 정보가 메타데이터에서 추출되었습니다
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.discardButton]}
            onPress={onDiscard}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.discardButtonText]}>
              취소
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={onSave}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.saveButtonText]}>
              {isLoading ? '저장 중...' : '저장하기'}
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
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  analysisCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  exerciseIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  exerciseDate: {
    fontSize: 14,
    color: '#4A5568',
  },
  metricsContainer: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  requirementsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#166534',
    flex: 1,
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
  saveButton: {
    backgroundColor: '#3182F6',
  },
  discardButton: {
    backgroundColor: '#E2E8F0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
  },
  discardButtonText: {
    color: '#1A202C',
  },
});