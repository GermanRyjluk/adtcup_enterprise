import { StyleSheet } from "react-native";
import { theme } from "../theme/theme";

export const adminStyles = StyleSheet.create({
  // --- Contenitori e Modali Admin ---
  adminContainer: {
    flex: 1,
    padding: theme.spacing.sm,
  },
  adminModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.backgroundEnd,
    marginTop: 50,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  adminModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBackground,
  },
  adminModalTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  adminModalContent: {
    padding: theme.spacing.lg,
  },

  // --- Stili per le Liste Admin (Teams, Riddles, etc.) ---
  adminListContainer: {
    paddingBottom: 120, // Aumenta lo spazio per evitare sovrapposizioni
    paddingHorizontal: theme.spacing.lg,
  },
  leaderboardRow: {
    flexDirection: "column",
  },
  adminListItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leaderboardTopRow: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },
  leaderboardBottomRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaderboardScoreSection: {
    alignItems: "center",
  },
  leaderboardQuizSection: {
    alignItems: "center",
    flex: 1, // Occupa lo spazio rimanente
  },
  leaderboardSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  leaderboardScoreText: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 28,
    color: theme.colors.accentPrimary,
  },
  leaderboardRiddleControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  leaderboardRiddleTextInput: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.sm,
    flex: 1, // Permette al campo di testo di espandersi
  },
  leaderboardRiddleText: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    marginHorizontal: theme.spacing.lg,
  },
  adminListItemContent: {
    flex: 1, // Permette al testo di usare lo spazio disponibile
    marginRight: theme.spacing.sm, // Aggiunge spazio prima degli elementi a destra
  },
  adminListItemTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginBottom: 3, // Leggero spazio tra titolo e sottotitolo
  },
  adminListItemSubtitle: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  adminListItemActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  // --- Stili Specifici per le Schermate ---

  // Dashboard
  adminSectionTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    // paddingHorizontal: theme.spacing.md,
  },
  statCardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    width: "48%",
  },
  statCardValue: {
    fontFamily: theme.fonts.primary.extraBold,
    fontSize: 28,
    color: theme.colors.textPrimary,
    marginVertical: theme.spacing.xs,
  },
  statCardLabel: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  teamProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBackground,
  },
  teamProgressName: {
    fontFamily: theme.fonts.primary.medium,
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  teamProgressInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamProgressText: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Riddles & Quiz Creator
  adminSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  adminLabel: {
    fontFamily: theme.fonts.primary.medium,
    fontSize: 12,
    color: theme.colors.textSecondary,
    width: 110,
  },
  adminInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  adminSmallInput: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    fontSize: 14,
  },
  adminSubSection: {
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.inputBackground,
    paddingTop: theme.spacing.md,
  },
  adminSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  adminSubTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  removeButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  deleteButton: {
    marginVertical: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  modalActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.lg,
    width: "100%",
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.full,
    marginHorizontal: theme.spacing.sm,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: theme.colors.inputBackground,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.accentPrimary,
  },
  modalDestructiveButton: {
    backgroundColor: theme.colors.error,
  },
  modalActionButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
  },
  pointsInput: {
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.spacing.sm,
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
    minWidth: 80,
  },
  fixedBottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundEnd,
  },
  leaderboardPosition: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.textSecondary,
    minWidth: 40, // Larghezza minima per allineare i numeri
    textAlign: "center",
    marginRight: theme.spacing.md,
  },

  // Stili per la leaderboard admin
  leaderboardTeamControls: {
    flex: 2, // Dà più spazio al nome del team
    justifyContent: "center",
    paddingRight: theme.spacing.sm,
  },
  leaderboardScoreContainer: {
    alignItems: "flex-start",
    marginTop: theme.spacing.xs,
  },
  leaderboardRiddleContainer: {
    flex: 3, // Dà più spazio ai controlli del quiz
    alignItems: "center",
    justifyContent: "center",
  },
});
