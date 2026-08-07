import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../store/authStore";
import { submitReview } from "../services/reviewService";
import { colors, fonts, spacing, borderRadius } from "../theme";

export default function ReviewScreen({ navigation, route }: any) {
  const { bookingId, revieweeId } = route.params;
  const user = useAuthStore((state) => state.user);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }
    setLoading(true);
    try {
      await submitReview({
        bookingId,
        revieweeId,
        rating,
        comment,
      });
      Alert.alert("⭐ Review Submitted!", "Thank you for your feedback.", [
        { text: "OK", onPress: () => navigation.navigate("MainTabs") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = () => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Tap a star to rate";
    }
  };

  const getRatingColor = () => {
    if (rating >= 4) return colors.success;
    if (rating === 3) return colors.accent;
    if (rating > 0) return colors.error;
    return colors.textMuted;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, "#E91E8C"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Leave a Review</Text>
        <Text style={styles.subtitle}>Share your experience</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>How was your experience?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text
                  style={[styles.star, rating >= star && styles.starActive]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabel, { color: getRatingColor() }]}>
            {getRatingLabel()}
          </Text>
        </View>

        <View style={styles.commentCard}>
          <Text style={styles.label}>Your Review</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share details about your experience..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={5}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Submit Review</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  ratingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingPrompt: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 48,
    color: colors.border,
  },
  starActive: {
    color: colors.accent,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  commentCard: {
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
  label: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 14,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    height: 120,
    textAlignVertical: "top",
    backgroundColor: colors.background,
  },
  charCount: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 6,
  },
  button: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: spacing.xl,
  },
  buttonGradient: {
    padding: 16,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.5,
  },
});
