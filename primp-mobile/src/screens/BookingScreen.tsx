import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createBooking } from "../services/bookingService";
import { validateRequired, validateLocation } from "../utils/validation";
import { colors, fonts, spacing, borderRadius } from "../theme";

const SERVICE_TYPES: Record<string, string[]> = {
  Braider: [
    "Box Braids",
    "Knotless Braids",
    "Senegalese Twists",
    "Cornrows",
    "Goddess Braids",
    "Fulani Braids",
  ],
  "Makeup Artist": [
    "Full Glam",
    "Natural Makeup",
    "Bridal Makeup",
    "Editorial Makeup",
    "Evening Makeup",
  ],
  Barber: ["Skin Fade", "Taper Fade", "Haircut & Beard", "Line Up", "Shave"],
  Loctician: [
    "Loc Retwist",
    "Loc Installation",
    "Loc Extensions",
    "Loc Repair",
    "Freeform Locs",
  ],
  "Nail Technician": [
    "Acrylic Nails",
    "Gel Nails",
    "Nail Art",
    "Manicure",
    "Pedicure",
    "Dip Powder",
  ],
  "Hair Stylist": [
    "Hair Relaxer",
    "Hair Coloring",
    "Blowout",
    "Hair Treatment",
    "Trim",
  ],
};

const DEFAULT_SERVICES = ["Consultation", "General Service", "Other"];

export default function BookingScreen({ navigation, route }: any) {
  const { professionalId, professionalName, specialty } = route.params;
  const [serviceType, setServiceType] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const services =
    specialty && SERVICE_TYPES[specialty]
      ? SERVICE_TYPES[specialty]
      : DEFAULT_SERVICES;

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDate(newDate);
      setShowTimePicker(true);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleNext = () => {
    const serviceErr = validateRequired(serviceType, "Service type");
    const locationErr = validateLocation(location);
    setServiceError(serviceErr || "");
    setLocationError(locationErr || "");
    if (serviceErr || locationErr) return;

    navigation.navigate("BookingConfirmation", {
      professionalId,
      professionalName,
      specialty,
      serviceType,
      preferredDate: date.toISOString().slice(0, 19),
      location,
      notes,
      formattedDate: formatDate(date),
      formattedTime: formatTime(date),
    });
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
        <Text style={styles.title}>Book a Service</Text>
        {professionalName && (
          <Text style={styles.subtitle}>with {professionalName}</Text>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Select Service *</Text>
        <View style={styles.serviceGrid}>
          {services.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.serviceButton,
                serviceType === s && styles.serviceActive,
              ]}
              onPress={() => setServiceType(s)}
            >
              <Text
                style={[
                  styles.serviceText,
                  serviceType === s && styles.serviceTextActive,
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {serviceError ? (
          <Text style={styles.errorText}>{serviceError}</Text>
        ) : null}

        <Text style={styles.label}>Preferred Date *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Preferred Time *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.dateIcon}>🕐</Text>
          <Text style={styles.dateText}>{formatTime(date)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Text style={styles.label}>Your Location *</Text>
        <TextInput
          style={[styles.input, locationError ? styles.inputError : null]}
          placeholder="e.g. Accra, East Legon"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor={colors.textMuted}
        />
        {locationError ? (
          <Text style={styles.errorText}>{locationError}</Text>
        ) : null}

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any specific requests or details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
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
              <Text style={styles.buttonText}>Review Booking →</Text>
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
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.8)",
    fontStyle: "italic",
  },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: spacing.md,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  serviceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "#FFF0F5",
  },
  serviceActive: {
    backgroundColor: colors.primary,
  },
  serviceText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  serviceTextActive: {
    color: colors.white,
  },
  dateButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 14,
    marginBottom: 4,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateIcon: {
    fontSize: 18,
  },
  dateText: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: 14,
    marginBottom: 4,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
