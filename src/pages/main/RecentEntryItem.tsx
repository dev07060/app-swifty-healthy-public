import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { AuthenticationEntry } from "../../types";
import { styles } from "./styles";

interface RecentEntryItemProps {
  entry: AuthenticationEntry;
  isLast?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RecentEntryItem({ entry, isLast = false, isExpanded, onToggle }: RecentEntryItemProps) {

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

  const getEntrySummary = (entry: AuthenticationEntry) => {
    if (entry.type === "exercise") {
      return `${entry.duration}분 • ${entry.calories}kcal 소모`;
    } else {
      return `${entry.estimatedCalories}kcal • ${entry.isHealthy ? "건강함" : "주의 필요"}`;
    }
  };

  const getEntryDetails = (entry: AuthenticationEntry) => {
    if (entry.type === "exercise") {
      return (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>
            운동 시간: <Text style={styles.detailValue}>{entry.duration}분</Text>
          </Text>
          <Text style={styles.detailLabel}>
            소모 칼로리: <Text style={styles.detailValue}>{entry.calories}kcal</Text>
          </Text>
          {entry.distance && (
            <Text style={styles.detailLabel}>
              거리: <Text style={styles.detailValue}>{entry.distance}km</Text>
            </Text>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailLabel}>
            칼로리: <Text style={styles.detailValue}>{entry.estimatedCalories}kcal</Text>
          </Text>
          <Text style={styles.detailLabel}>
            건강도:{" "}
            <Text style={styles.detailValue}>
              {entry.isHealthy ? "건강함 ✅" : "주의 필요 ⚠️"}
            </Text>
          </Text>
          {entry.mainIngredients && entry.mainIngredients.length > 0 && (
            <Text style={styles.detailLabel}>
              주요 재료:{" "}
              <Text style={styles.detailValue}>
                {entry.mainIngredients.join(", ")}
              </Text>
            </Text>
          )}
        </View>
      );
    }
  };

  return (
    <View style={[styles.recentEntryItem, isLast && styles.recentEntryItemLast]}>
      <TouchableOpacity
        style={styles.entryHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.recentEntryIcon}>{getEntryIcon(entry)}</Text>
        <View style={styles.recentEntryContent}>
          <Text style={styles.recentEntryTitle}>{getEntryTitle(entry)}</Text>
          <Text style={styles.recentEntrySubtitle}>{getEntrySummary(entry)}</Text>
        </View>
        <View style={styles.entryRightSection}>
          <Text style={styles.recentEntryDate}>{formatDate(entry.createdAt)}</Text>
        </View>
        <Text style={styles.toggleIndicator}>{isExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {isExpanded && getEntryDetails(entry)}
    </View>
  );
}
