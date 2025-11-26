import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    padding: 20,
  },
  header: {
    alignItems: "flex-start",
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
    flexDirection: "row",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: "white",
    padding: 18,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A202C",
    alignSelf: "flex-start",
  },
    actionButtonSubText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#444546FF",
    alignSelf: "flex-start",
  },
  actionButtonEmoji: {
    fontSize: 64,
    alignSelf: "flex-end",
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
  entryRightSection: {
    alignItems: "flex-end",
    flex: 0,
  },
  recentEntryDate: {
    fontSize: 12,
    color: "#718096",
    textAlign: "right",
  },
  toggleIndicator: {
    fontSize: 12,
    color: "#A0AEC0",
    marginLeft: 8,
  },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingLeft: 36,
  },
  detailLabel: {
    fontSize: 14,
    color: "#4A5568",
    marginBottom: 6,
  },
  detailValue: {
    fontWeight: "600",
    color: "#1A202C",
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
