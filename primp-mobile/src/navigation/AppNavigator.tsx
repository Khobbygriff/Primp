import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import api from "../services/api";
import { syncPushTokenWithServer } from "../services/pushNotificationService";
import { colors, fonts } from "../theme";

// Auth Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

// Tab Screens
import HomeScreen from "../screens/HomeScreen";
import PortfolioFeedScreen from "../screens/PortfolioFeedScreen";
import BookingListScreen from "../screens/BookingListScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ViewProfileScreen from "../screens/ViewProfileScreen";

// Stack Screens
import DiscoveryScreen from "../screens/DiscoveryScreen";
import BookingScreen from "../screens/BookingScreen";
import BookingConfirmationScreen from "../screens/BookingConfirmationScreen";
import ReviewScreen from "../screens/ReviewScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import AddPortfolioScreen from "../screens/AddPortfolioScreen";
import MapScreen from "../screens/MapScreen";
import WorkLocationScreen from "../screens/WorkLocationScreen";
import LoyaltyScreen from "../screens/LoyaltyScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";

export type RootStackParamList = {
    MainTabs: undefined;
    Discovery: undefined;
    Booking: {
        professionalId: number;
        professionalName?: string;
        specialty?: string;
    };
    BookingConfirmation: {
        professionalId: number;
        professionalName: string;
        specialty: string;
        serviceType: string;
        preferredDate: string;
        location: string;
        notes: string;
        formattedDate: string;
        formattedTime: string;
    };
    Review: { bookingId: number; revieweeId: number };
    EditProfile: undefined;
    AddPortfolio: undefined;
    Map: undefined;
    ViewProfile: { userId: number };
    Loyalty: undefined;
    Analytics: undefined;
    WorkLocation: {
        latitude?: number;
        longitude?: number;
        serviceRadiusKm?: number;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

function TabNavigator() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, []),
  );

  const fetchUnreadCount = async () => {
    try {
      const userId = user?.id ?? 0;
      const response = await api.get(`/api/notifications/user/${userId}/count`);
      setUnreadCount(response.data);
    } catch (error) {
      console.log("Failed to fetch unread count");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: fonts.medium,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={PortfolioFeedScreen}
        options={{
          tabBarLabel: "Feed",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📸</Text>
          ),
        }}
      />
      <Tab.Screen
        name="BookingList"
        component={BookingListScreen}
        options={{
          tabBarLabel: "Bookings",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationScreen}
        options={{
          tabBarLabel: "Alerts",
          tabBarIcon: ({ color }) => (
            <View>
              <Text style={{ fontSize: 22, color }}>🔔</Text>
              <NotificationBadge count={unreadCount} />
            </View>
          ),
        }}
        listeners={{
          tabPress: () => {
            setTimeout(fetchUnreadCount, 1000);
          },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ViewProfileScreen}
        initialParams={{ userId: user?.id ?? 0 }}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>👤</Text>
          ),
          headerShown: true,
          headerTitle: "My Profile",
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontFamily: fonts.semiBold },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 16 }}
            >
              <Text
                style={{
                  color: colors.primaryLight,
                  fontSize: 14,
                  fontFamily: fonts.medium,
                }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      syncPushTokenWithServer();
    }
  }, [isAuthenticated]);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Discovery" component={DiscoveryScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen
                name="BookingConfirmation"
                component={BookingConfirmationScreen}
            />
            <Stack.Screen name="Review" component={ReviewScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="AddPortfolio" component={AddPortfolioScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="WorkLocation" component={WorkLocationScreen} />
            <Stack.Screen name="ViewProfile" component={ViewProfileScreen} />
            <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: fonts.semiBold,
  },
});