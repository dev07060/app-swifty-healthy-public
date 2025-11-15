import { createRoute, useNavigation } from "@granite-js/react-native";
import { Result } from "@toss/tds-react-native";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { InlineError } from "../components/feedback";
import { useHealthTrackerStore } from "../store/healthTracker";
import type { AuthenticationEntry } from "../types";
import { ErrorHandlingUtils, type AppError } from "../utils/errorHandling";

export const Route = createRoute("/", {
  component: MainUploadScreen,
});

// Helper component for displaying recent entries
function RecentEntryItem({
  entry,
  isLast = false,
}: {
  entry: AuthenticationEntry;
  isLast?: boolean;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    console.debug("Formatted date:", date);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEntryIcon = (entry: AuthenticationEntry) => {
    return entry.type === "exercise" ? "💪" : "🍎";
  };

  const getEntryTitle = (entry: AuthenticationEntry) => {
    if (entry.type === "exercise") {
      return entry.exerciseType || "운동";
    } else {
      return entry.mealType || "식사";
    }
  };

  const getEntryDetails = (entry: AuthenticationEntry) => {
    if (entry.type === "exercise") {
      return `${entry.duration}분 • ${entry.calories}kcal 소모`;
    } else {
      const healthStatus = entry.isHealthy ? "건강함" : "주의 필요";
      const mainIngredients = entry.mainIngredients && entry.mainIngredients.length > 0
        ? ` • ${entry.mainIngredients.join(", ")}`
        : "";
      return `${entry.estimatedCalories}kcal • ${healthStatus}${mainIngredients}`;
    }
  };

  return (
    <View
      style={[styles.recentEntryItem, isLast && styles.recentEntryItemLast]}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.recentEntryIcon}>{getEntryIcon(entry)}</Text>
        <View style={styles.recentEntryContent}>
          <Text style={styles.recentEntryTitle}>{getEntryTitle(entry)}</Text>
          <Text style={styles.recentEntrySubtitle}>
            {getEntryDetails(entry)}
          </Text>
        </View>
        <Text style={styles.recentEntryDate}>{formatDate(entry.createdAt)}</Text>
      </View>
    </View>
  );
}

function MainUploadScreen() {
  const {
    entries,
    // getEntriesByDateRange,
    error: storeError,
    clearError,
    fetchTodayExerciseLogs,
    fetchTodayFoodLogs,
    isLoading,
  } = useHealthTrackerStore();
  const [navigationError, setNavigationError] = useState<AppError | null>(null);

  const userKey = '9af9778d-cf8f-4ebd-807c-f6d4873b5fcc';

  // 화면이 포커스될 때마다 당일 운동 및 식단 기록 불러오기
  useFocusEffect(
    useCallback(() => {
      fetchTodayExerciseLogs(userKey);
      fetchTodayFoodLogs(userKey);
    }, [fetchTodayExerciseLogs, fetchTodayFoodLogs, userKey])
  );

  // Get today's date in YYYY-MM-DD format (for future use)
  // const today = useMemo(() => {
  //   const dateStr = new Date().toISOString().split("T")[0];
  //   return dateStr || "";
  // }, []);

  // Get this week's start date (Monday) (for future use)
  // const thisWeekStart = useMemo(() => {
  //   const now = new Date();
  //   const dayOfWeek = now.getDay();
  //   const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
  //   const monday = new Date(now);
  //   monday.setDate(now.getDate() - daysToMonday);
  //   const dateStr = monday.toISOString().split("T")[0];
  //   return dateStr || "";
  // }, []);

  // Get this week's end date (Sunday) (for future use)
  // const thisWeekEnd = useMemo(() => {
  //   if (!thisWeekStart) return "";
  //   const start = new Date(thisWeekStart);
  //   const end = new Date(start);
  //   end.setDate(start.getDate() + 6);
  //   const dateStr = end.toISOString().split("T")[0];
  //   return dateStr || "";
  // }, [thisWeekStart]);

  // Calculate stats (for future use)
  // const todayEntries = useMemo(() => {
  //   return entries.filter((entry: AuthenticationEntry) => entry.date === today);
  // }, [entries, today]);

  // const thisWeekEntries = useMemo(() => {
  //   return getEntriesByDateRange(thisWeekStart, thisWeekEnd);
  // }, [getEntriesByDateRange, thisWeekStart, thisWeekEnd]);

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

  // const navigateToReports = () => {
  //   try {
  //     setNavigationError(null);
  //     navigation.push("/reports" as any);
  //   } catch (error) {
  //     const appError = ErrorHandlingUtils.handleProcessingError(
  //       error instanceof Error ? error : new Error("Navigation failed"),
  //       "Navigate to Reports"
  //     );
  //     ErrorHandlingUtils.logError(appError, "navigateToReports", error);
  //     setNavigationError(appError);
  //   }
  // };

  // const navigateToGraphTest = () => {
  //   try {
  //     setNavigationError(null);
  //     navigation.push("/graph-test" as any);
  //   } catch (error) {
  //     const appError = ErrorHandlingUtils.handleProcessingError(
  //       error instanceof Error ? error : new Error("Navigation failed"),
  //       "Navigate to Graph Test"
  //     );
  //     ErrorHandlingUtils.logError(appError, "navigateToGraphTest", error);
  //     setNavigationError(appError);
  //   }
  // };

  const retryNavigation = () => {
    setNavigationError(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>건강 트래커</Text>
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
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToFoodUpload}
        >
          <Text style={styles.actionButtonText}>식단 인증</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToReports}
        >
          <Text style={styles.actionButtonText}>📊 주간 리포트</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToGraphTest}
        >
          <Text style={styles.actionButtonText}>🎨 그래프 테스트</Text>
        </TouchableOpacity> */}
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
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Result
              style={{ backgroundColor: 'white' }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A202C",
  },
  actionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
  },
  recentEntriesSection: {
    marginBottom: 24,
  },
  recentEntriesContainer: {
    backgroundColor: "white",
    borderRadius: 8,
  },
  recentEntryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  recentEntryItemLast: {
    borderBottomWidth: 0,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentEntryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recentEntryContent: {
    flex: 1,
  },
  recentEntryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 4,
  },
  recentEntrySubtitle: {
    fontSize: 14,
    color: "#4A5568",
    lineHeight: 20,
  },
  recentEntryDate: {
    fontSize: 12,
    color: "#718096",
    textAlign: "right",
  },
  emptyState: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 32,
    alignItems: "center",
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2D3748",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "center",
  },
});
