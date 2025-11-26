import { useNavigation } from "@granite-js/react-native";
import { Result } from "@toss/tds-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { InlineError } from "../../components/feedback";
import { useHealthTrackerStore } from "../../store/healthTracker";
import type { AuthenticationEntry } from "../../types";
import { ErrorHandlingUtils, type AppError } from "../../utils/errorHandling";
import { RecentEntryItem } from "./RecentEntryItem";
import { styles } from "./styles";

export function MainUploadScreen() {
  const {
    entries,
    error: storeError,
    clearError,
    fetchTodayExerciseLogs,
    fetchTodayFoodLogs,
  } = useHealthTrackerStore();
  const [navigationError, setNavigationError] = useState<AppError | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const userKey = "9af9778d-cf8f-4ebd-807c-f6d4873b5fcc";

  // 화면이 포커스될 때마다 당일 운동 및 식단 기록 불러오기
  useFocusEffect(
    useCallback(() => {
      fetchTodayExerciseLogs(userKey);
      fetchTodayFoodLogs(userKey);
    }, [fetchTodayExerciseLogs, fetchTodayFoodLogs, userKey])
  );

  // Get recent entries (last 5)
  const recentEntries = useMemo(() => {
    return [...entries]
      .sort(
        (a: AuthenticationEntry, b: AuthenticationEntry) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [entries]);

  const navigation = useNavigation();

  const navigateToExerciseUpload = () => {
    try {
      setNavigationError(null);
      navigation.push("/exercise-upload" as any);
    } catch (error) {
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error("Navigation failed"),
        "Navigate to Exercise Upload"
      );
      ErrorHandlingUtils.logError(appError, "navigateToExerciseUpload", error);
      setNavigationError(appError);
    }
  };

  const navigateToFoodUpload = () => {
    try {
      setNavigationError(null);
      navigation.push("/food-upload" as any);
    } catch (error) {
      const appError = ErrorHandlingUtils.handleProcessingError(
        error instanceof Error ? error : new Error("Navigation failed"),
        "Navigate to Food Upload"
      );
      ErrorHandlingUtils.logError(appError, "navigateToFoodUpload", error);
      setNavigationError(appError);
    }
  };

  const retryNavigation = () => {
    setNavigationError(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>00님,</Text>
        <Text style={styles.title}>오늘의 인증을 작성해볼까요?</Text>
      </View>

      {navigationError && (
        <InlineError error={navigationError} onRetry={retryNavigation} />
      )}

      {storeError && <InlineError error={storeError} onRetry={clearError} />}

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToExerciseUpload}
        >
          <Text style={styles.actionButtonText}>운동 인증</Text>
          <Text style={styles.actionButtonSubText}>오늘 했던 나의 운동을 캡쳐해서 인증하기</Text>
          <Text style={styles.actionButtonEmoji}>🏃‍♂️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToFoodUpload}
        >
          <Text style={styles.actionButtonText}>식단 인증</Text>
                    <Text style={styles.actionButtonSubText}>오늘 먹은 음식을 업로드해서 기록해보세요</Text>
          <Text style={styles.actionButtonEmoji}>🥗</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentEntriesSection}>
        <Text style={styles.sectionTitle}>최근 기록</Text>
        {recentEntries.length > 0 ? (
          <View style={styles.recentEntriesContainer}>
            {recentEntries.map((entry: AuthenticationEntry, index: number) => (
              <RecentEntryItem
                key={`${entry.id}-${index}`}
                entry={entry}
                isLast={index === recentEntries.length - 1}
                isExpanded={expandedEntryId === entry.id}
                onToggle={() => setExpandedEntryId(expandedEntryId === entry.id ? null : entry.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Result
              style={{ backgroundColor: "white" }}
              figure={<Text style={styles.emptyStateIcon}>📝</Text>}
              title="오늘자 인증 기록이 없어요"
              description="운동 인증이나 식단 인증을 추가해주세요."
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
