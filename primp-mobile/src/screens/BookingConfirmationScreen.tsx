import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { initializePayment, verifyPayment } from "../services/paystackService";
import PaystackCheckout from "../components/PaystackCheckout";
import { colors, fonts, spacing, borderRadius } from "../theme";

const PRIMP_FEE_RATE = 0.08;

export default function BookingConfirmationScreen({ navigation, route }: any) {
  const {
    professionalId,
    professionalName,
    specialty,
    serviceType,
    preferredDate,
    location,
    notes,
    formattedDate,
    formattedTime,
  } = route.params;

  const [loading, setLoading] = useState(false);

  // ── Payment state ──────────────────────────────────────────
  const [agreedPrice, setAgreedPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // ── Modal state ────────────────────────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
  "confirm" | "checkout" | "processing" | "success"
  >("confirm");
  const [checkoutData, setCheckoutData] = useState<{
    reference: string;
    accessCode: string;
    publicKey: string;
    amount: number;
    currency: string;
    email: string;
  } | null>(null);

  // ── Fee calculations ───────────────────────────────────────
  const parsedPrice = parseFloat(agreedPrice) || 0;
  const primpFee = parsedPrice * PRIMP_FEE_RATE;
  const total = parsedPrice + primpFee;

  const formatGHS = (amount: number) => `GH₵ ${amount.toFixed(2)}`;

  // ── Validation ─────────────────────────────────────────────
  const validatePayment = () => {
    let valid = true;

    if (!agreedPrice || parsedPrice <= 0) {
      setPriceError("Please enter the agreed service price");
      valid = false;
    } else {
      setPriceError("");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    return valid;
  };

  // ── Payment flow ───────────────────────────────────────────
  const handleProceedToPayment = async () => {
    if (!validatePayment()) return;
    setShowPaymentModal(true);
    setPaymentStep("confirm");
  };

  const handleStartCheckout = async () => {
    setLoading(true);
    try {
      const result = await initializePayment({
        professionalId,
        serviceType,
        preferredDate,
        location,
        notes,
        agreedPrice: parsedPrice,
        email: email.trim(),
      });
      setCheckoutData({
        reference: result.reference,
        accessCode: result.accessCode,
        publicKey: result.publicKey,
        amount: result.amount,
        currency: result.currency,
        email: result.email,
      });
      setPaymentStep("checkout");
    } catch (error) {
      setShowPaymentModal(false);
      Alert.alert("Error", "Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = async (reference: string) => {
    setPaymentStep("processing");
    try {
      await verifyPayment(reference);
      setPaymentStep("success");
    } catch (error) {
      setShowPaymentModal(false);
      Alert.alert(
          "Payment Verification Failed",
          "We couldn't confirm your payment. If you were charged, contact support with reference " + reference
      );
    }
  };

  const handleCheckoutClose = () => {
    if (paymentStep === "checkout") {
      setPaymentStep("confirm");
    }
  };

  const handleDone = () => {
    setShowPaymentModal(false);
    navigation.navigate("MainTabs");
  };

  return (
      <>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
              style={styles.container}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            {/* ── Gradient Header ── */}
            <LinearGradient
                colors={[colors.primaryDark, colors.primary, "#E91E8C"]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Edit Booking</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Confirm Booking</Text>
              <Text style={styles.subtitle}>
                Review your booking details before paying
              </Text>
            </LinearGradient>

            <View style={styles.content}>

              {/* ── Professional card ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Professional</Text>
                <View style={styles.proRow}>
                  <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.proAvatar}
                  >
                    <Text style={styles.proAvatarText}>
                      {professionalName?.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.proName}>{professionalName}</Text>
                    {specialty && (
                        <Text style={styles.proSpecialty}>💼 {specialty}</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* ── Booking details ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Booking Details</Text>
                {[
                  { label: "Service", value: serviceType },
                  { label: "Date", value: formattedDate },
                  { label: "Time", value: formattedTime },
                  { label: "Location", value: location },
                  ...(notes ? [{ label: "Notes", value: notes }] : []),
                ].map((item, index) => (
                    <View key={index} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{item.label}</Text>
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                ))}
              </View>

              {/* ── Price input ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Agreed Service Price</Text>
                <Text style={styles.cardHint}>
                  Enter the price you and the professional agreed on
                </Text>
                <View style={styles.priceInputRow}>
                  <View style={styles.currencyBadge}>
                    <Text style={styles.currencyText}>GH₵</Text>
                  </View>
                  <TextInput
                      style={[styles.priceInput, priceError ? styles.inputError : null]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textMuted}
                      value={agreedPrice}
                      onChangeText={(text) => {
                        setAgreedPrice(text.replace(/[^0-9.]/g, ""));
                        if (priceError) setPriceError("");
                      }}
                      keyboardType="decimal-pad"
                  />
                </View>
                {priceError ? (
                    <Text style={styles.errorText}>{priceError}</Text>
                ) : null}

                {/* Fee breakdown — shows once price is entered */}
                {parsedPrice > 0 && (
                    <View style={styles.feeBreakdown}>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Service Price</Text>
                        <Text style={styles.feeValue}>{formatGHS(parsedPrice)}</Text>
                      </View>
                      <View style={styles.feeRow}>
                        <View style={styles.feeLabelRow}>
                          <Text style={styles.feeLabel}>Primp Fee</Text>
                          <View style={styles.feePill}>
                            <Text style={styles.feePillText}>8%</Text>
                          </View>
                        </View>
                        <Text style={styles.feeValue}>{formatGHS(primpFee)}</Text>
                      </View>
                      <View style={styles.feeDivider} />
                      <View style={styles.feeRow}>
                        <Text style={styles.feeTotalLabel}>Total</Text>
                        <Text style={styles.feeTotalValue}>{formatGHS(total)}</Text>
                      </View>
                    </View>
                )}
              </View>

              {/* ── Payment email ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Payment Details</Text>
                <Text style={styles.cardHint}>
                  We'll send your receipt to this email. You'll choose card, Mobile Money,
                  or bank on the next screen.
                </Text>
                <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    placeholder="e.g. you@example.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) setEmailError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* ── What happens next ── */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>What happens next?</Text>
                {[
                  "Pay securely via Paystack (card, Mobile Money, or bank)",
                  `Your request is sent to ${professionalName}`,
                  "They confirm within 24 hours",
                  "You confirm completion once the service is done",
                ].map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                      <LinearGradient
                          colors={[colors.primary, colors.primaryDark]}
                          style={styles.stepNumber}
                      >
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </LinearGradient>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                ))}
              </View>

              {/* ── Actions ── */}
              <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.goBack()}
                >
                  <Text style={styles.editButtonText}>Edit Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.payButton}
                    onPress={handleProceedToPayment}
                    disabled={loading}
                >
                  <LinearGradient
                      colors={[colors.primary, colors.primaryDark]}
                      style={styles.payGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.payButtonText}>
                      {parsedPrice > 0 ? `Pay ${formatGHS(total)}` : "Proceed to Pay"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Payment Modal ── */}
        <Modal
            visible={showPaymentModal}
            transparent
            animationType="slide"
            onRequestClose={() => {
              if (paymentStep !== "processing") setShowPaymentModal(false);
            }}
        >
          {paymentStep === "checkout" && checkoutData ? (
              <PaystackCheckout
                  visible
                  publicKey={checkoutData.publicKey}
                  email={checkoutData.email}
                  amount={checkoutData.amount}
                  currency={checkoutData.currency}
                  reference={checkoutData.reference}
                  onSuccess={handleCheckoutSuccess}
                  onClose={handleCheckoutClose}
              />
          ) : (
              <View style={styles.modalOverlay}>
                <View style={styles.modalSheet}>

                  {/* CONFIRM step */}
                  {paymentStep === "confirm" && (
                      <>
                        <Text style={styles.modalTitle}>Confirm Payment</Text>

                        <View style={styles.modalFeeRow}>
                          <Text style={styles.modalFeeLabel}>Service</Text>
                          <Text style={styles.modalFeeValue}>{formatGHS(parsedPrice)}</Text>
                        </View>
                        <View style={styles.modalFeeRow}>
                          <Text style={styles.modalFeeLabel}>Primp Fee (8%)</Text>
                          <Text style={styles.modalFeeValue}>{formatGHS(primpFee)}</Text>
                        </View>
                        <View style={styles.modalDivider} />
                        <View style={styles.modalFeeRow}>
                          <Text style={styles.modalTotalLabel}>Total</Text>
                          <Text style={styles.modalTotalValue}>{formatGHS(total)}</Text>
                        </View>

                        <Text style={styles.momoPrompt}>
                          You'll be taken to Paystack's secure checkout to pay {formatGHS(total)}
                          {" "}by card, Mobile Money, or bank transfer.
                        </Text>

                        <TouchableOpacity
                            style={styles.confirmPayButton}
                            onPress={handleStartCheckout}
                            disabled={loading}
                        >
                          <LinearGradient
                              colors={[colors.primary, colors.primaryDark]}
                              style={styles.confirmPayGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                          >
                            {loading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.confirmPayText}>Continue to Paystack</Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelPayButton}
                            onPress={() => setShowPaymentModal(false)}
                        >
                          <Text style={styles.cancelPayText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                  )}

                  {/* PROCESSING step */}
                  {paymentStep === "processing" && (
                      <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.processingTitle}>Confirming Payment</Text>
                        <Text style={styles.processingSubtitle}>
                          Verifying your transaction with Paystack...
                        </Text>
                      </View>
                  )}

                  {/* SUCCESS step */}
                  {paymentStep === "success" && (
                      <View style={styles.successContainer}>
                        <View style={styles.successIconWrapper}>
                          <LinearGradient
                              colors={["#1E7A4A", "#145A32"]}
                              style={styles.successIcon}
                          >
                            <Text style={styles.successIconText}>✓</Text>
                          </LinearGradient>
                        </View>
                        <Text style={styles.successTitle}>Payment Confirmed!</Text>
                        <Text style={styles.successSubtitle}>
                          {formatGHS(total)} paid via Paystack
                        </Text>
                        <Text style={styles.successDetail}>
                          Your booking request has been sent to {professionalName}.
                          You will be notified when they confirm.
                        </Text>

                        <View style={styles.receiptRow}>
                          <View style={styles.receiptItem}>
                            <Text style={styles.receiptLabel}>Amount Paid</Text>
                            <Text style={styles.receiptValue}>{formatGHS(total)}</Text>
                          </View>
                          <View style={styles.receiptDivider} />
                          <View style={styles.receiptItem}>
                            <Text style={styles.receiptLabel}>Primp Fee</Text>
                            <Text style={styles.receiptValue}>{formatGHS(primpFee)}</Text>
                          </View>
                        </View>

                        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                          <LinearGradient
                              colors={[colors.primary, colors.primaryDark]}
                              style={styles.confirmPayGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                          >
                            <Text style={styles.confirmPayText}>Done</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                  )}

                </View>
              </View>
          )}
        </Modal>
      </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  backText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cardHint: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  proRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  proAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  proAvatarText: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.white,
  },
  proName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  proSpecialty: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.primary,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    flex: 2,
    textAlign: "right",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  currencyBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.sm,
  },
  currencyText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 15,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 14,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 14,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontFamily: fonts.regular,
    color: colors.error,
    fontSize: 12,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  feeBreakdown: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs + 2,
  },
  feeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  feeLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  feePill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  feePillText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.primary,
  },
  feeValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  feeDivider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  feeTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  feeTotalValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  stepText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  editButton: {
    flex: 1,
    padding: 16,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  payButton: {
    flex: 2,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payGradient: {
    padding: 16,
    alignItems: "center",
  },
  payButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  modalFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs + 2,
  },
  modalFeeLabel: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalFeeValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  modalDivider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  modalTotalLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalTotalValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primary,
  },
  momoPrompt: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginVertical: spacing.md,
  },
  confirmPayButton: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  confirmPayGradient: {
    padding: 16,
    alignItems: "center",
  },
  confirmPayText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 16,
  },
  cancelPayButton: {
    padding: spacing.md,
    alignItems: "center",
  },
  cancelPayText: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    fontSize: 15,
  },
  processingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },
  processingTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },
  processingSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  successIconWrapper: {
    marginBottom: spacing.md,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  successIconText: {
    fontSize: 36,
    color: colors.white,
    fontFamily: fonts.bold,
  },
  successTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  successSubtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  successDetail: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  receiptRow: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  receiptItem: {
    flex: 1,
    alignItems: "center",
  },
  receiptDivider: {
    width: 0.5,
    backgroundColor: colors.border,
  },
  receiptLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  receiptValue: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  doneButton: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    width: "100%",
  },
});