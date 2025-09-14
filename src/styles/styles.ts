import { StyleSheet, Platform } from "react-native";
import { theme, SCREEN_WIDTH, SCREEN_HEIGHT } from "../theme/theme";

/**
 * @constant styles
 * Un StyleSheet centralizzato che contiene tutti gli stili riutilizzabili dell'applicazione.
 * Utilizza i "design tokens" definiti in theme.ts per garantire coerenza.
 */
export const styles = StyleSheet.create({
  // --- Contenitori Globali ---
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundEnd,
  },
  authContent: {
    width: "100%",
    maxWidth: 400,
  },
  standardScreenContainer: {
    flex: 1,
    // paddingHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  // --- Tipografia ---
  logoText: {
    fontFamily: theme.fonts.primary.extraBold,
    fontSize: 48,
    color: theme.colors.textPrimary,
    textAlign: "center",
    letterSpacing: -1,
  },
  logoTextSmall: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  authTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 32,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  sectionTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 22,
    color: theme.colors.textPrimary,
    // paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  bodyText: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },

  // --- Componenti Form (Auth) ---
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  socialButtonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.medium,
    fontSize: 16,
    marginLeft: theme.spacing.md,
  },
  separatorText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginVertical: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    padding: theme.spacing.md,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.regular,
    fontSize: 16,
    paddingVertical: theme.spacing.md,
    paddingRight: theme.spacing.md,
  },
  toggleAuthText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary.regular,
    textAlign: "center",
    fontSize: 14,
  },
  linkText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary.regular,
    textAlign: "right",
    fontSize: 14,
    marginBottom: theme.spacing.md,
    textDecorationLine: "underline",
  },
  textButton: {
    color: theme.colors.textSecondary,
    textDecorationLine: "underline",
    fontSize: 14,
  },

  // --- Bottoni ---
  primaryButtonContainer: {
    borderRadius: theme.radius.full,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    elevation: 0,
    shadowOpacity: 0,
  },
  footerButton: {
    width: "90%",
    paddingVertical: theme.spacing.sm,
  },
  primaryButtonGradient: {
    paddingVertical: theme.spacing.md + 4,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18, // Leggermente più grande
    textAlign: "center",
  },
  primaryButtonSubtitle: {
    color: "rgba(0,0,0,0.7)",
    fontFamily: theme.fonts.primary.regular,
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },

  // --- Modale Custom ---
  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContainer: {
    width: "80%",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  modalTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  modalMessage: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  modalCloseButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.accentPrimary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.full,
  },
  modalCloseButtonText: {
    color: "#000",
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
  },

  // --- Navigazione ---
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    elevation: 0,
    backgroundColor: theme.colors.backgroundEnd,
    borderTopStartRadius: theme.radius.md,
    borderTopEndRadius: theme.radius.md,
    height: 70,
    borderTopWidth: 0,
    paddingTop: 15,
  },
  scannerTabButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accentPrimary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: theme.colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  // --- Stili per la schermata Profilo ---
  deleteButton: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: theme.colors.error, // Testo rosso
    fontFamily: theme.fonts.primary.bold,
    fontSize: 16,
  },

  // --- Schermata Dettagli Evento ---
  detailsHeaderImage: {
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  detailsHeaderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === "ios" ? 20 : 20,
    position: "absolute",
    width: "100%",
    zIndex: 2,
  },
  detailsHeaderButton: {
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: theme.spacing.md,
    borderRadius: theme.radius.full,
  },
  detailsContentCard: {
    backgroundColor: theme.colors.backgroundEnd,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    // Rimosso 'marginTop', lo spazio è gestito dallo spaziatore nello ScrollView
  },
  detailsTitle: {
    fontFamily: theme.fonts.secondary.bold,
    fontSize: 38,
    color: theme.colors.accentPrimary,
    marginBottom: theme.spacing.md,
  },
  detailsInfoRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
  },
  detailsInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: theme.spacing.lg,
  },
  detailsInfoText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.fonts.primary.regular,
  },
  detailsSectionTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  detailsInfoSubtitle: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  detailsMap: {
    width: "100%",
    height: 150,
    borderRadius: theme.radius.md,
  },
  floatingFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  floatingFooterGradient: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsHeaderSolid: {
    height: SCREEN_HEIGHT * 0.25,
    backgroundColor: theme.colors.cardBackground,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  distanceIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
    width: "90%",
    alignSelf: "center",
  },
  distanceIndicatorReady: {
    backgroundColor: "rgba(46, 204, 113, 0.2)", // Sfondo verde semi-trasparente
  },
  distanceIndicatorNotReady: {
    backgroundColor: "rgba(231, 76, 60, 0.2)", // Sfondo rosso semi-trasparente
  },
  distanceIndicatorText: {
    fontFamily: theme.fonts.primary.medium,
    fontSize: 16,
    marginLeft: theme.spacing.sm,
  },

  // --- Stili Aggiornati e Corretti per CountdownScreen ---
  countdownContentContainer: {
    flex: 1, // Fondamentale: fa sì che il container occupi tutto lo schermo
    justifyContent: "space-between", // Distribuisce lo spazio verticalmente
  },
  welcomeContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  countdownWelcome: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 24, // Leggermente più grande
    color: theme.colors.textSecondary,
  },
  countdownWelcomeUser: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 40, // Molto più grande per riempire lo spazio
    color: theme.colors.textPrimary,
    lineHeight: 48,
  },
  countdownInfoCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg, // Aggiunto padding verticale
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  countdownCardText: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  countdownCardEventName: {
    fontFamily: theme.fonts.secondary.bold,
    fontSize: 32,
    color: theme.colors.accentPrimary,
    marginVertical: theme.spacing.xs,
    textAlign: "center",
  },
  countdownTimerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  countdownTimerBlock: {
    alignItems: "center",
    marginHorizontal: theme.spacing.sm,
  },
  countdownTimerValue: {
    fontFamily: theme.fonts.primary.extraBold,
    fontSize: 48,
    color: theme.colors.accentPrimary,
  },
  countdownTimerUnit: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  tipCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg, // Più padding
    width: SCREEN_WIDTH * 0.55, // Card più grandi
    marginRight: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120, // Altezza minima per un aspetto migliore
  },
  tipCardText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary.regular,
    fontSize: 15, // Testo leggermente più grande
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  // --- Schermata di Gioco ---
  gameContainer: {
    flex: 1,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 4,
    marginVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.accentPrimary,
    borderRadius: 4,
  },
  riddleCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  riddleImage: {
    width: "100%",
    borderRadius: theme.radius.sm,
    alignSelf: "center",
  },
  riddleText: {
    fontFamily: theme.fonts.secondary.bold,
    fontSize: 20,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    textAlign: "center",
  },
  clueCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginHorizontal: theme.spacing.md,
    marginBottom: 120,
  },
  clueTimerText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary.regular,
    marginBottom: theme.spacing.md,
  },
  // --- Schermata Team ---
  teamCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
  },
  teamIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  teamNameInput: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 24,
    color: theme.colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.textSecondary,
    paddingBottom: theme.spacing.sm,
    textAlign: "center",
    width: "80%",
  },
  captainOnlyText: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  teamMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  teamMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  teamMemberName: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.medium,
    fontSize: 16,
  },
  // --- Schermata Classifica ---
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  userLeaderboardRow: {
    borderWidth: 2,
    borderColor: theme.colors.accentPrimary,
    shadowColor: theme.colors.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  leaderboardPosition: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18,
    width: 25,
    textAlign: "center",
  },
  leaderboardIconContainer: {
    width: 24,
    marginHorizontal: theme.spacing.sm,
    alignItems: "center",
  },
  leaderboardTeamName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.primary.medium,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
  },
  leaderboardScore: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.primary.regular,
    fontSize: 14,
  },
  // --- Schermata Manuale ---
  manualCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    margin: theme.spacing.sm,
    width: SCREEN_WIDTH / 2 - theme.spacing.md * 2, // Calcola la larghezza per due colonne con margini
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1, // Mantiene la card quadrata
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  manualCardTitle: {
    fontFamily: theme.fonts.primary.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  manualCardDescription: {
    fontFamily: theme.fonts.primary.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  // --- Schermata Scanner Modale ---
  scannerContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerFocusBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: theme.colors.accentPrimary,
    // borderRadius: theme.radius.lg,
    backgroundColor: "transparent",
  },
  scannerMask: {
    flex: 1,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scannerInfoText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
    fontFamily: theme.fonts.primary.medium,
  },
  scannerPermissionText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: theme.fonts.primary.regular,
  },
  scannerCloseButton: {
    position: "absolute",
    bottom: 50,
  },
  scannerCloseButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontFamily: theme.fonts.primary.regular,
  },
  // --- Schermata Indizi (Clues) ---
  cluesContainer: {
    flex: 1,
  },
  clueItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
  },
  clueIcon: {
    marginRight: theme.spacing.md,
  },
});
