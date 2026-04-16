import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  Text,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

const TAB_CONFIG = [
  { name: "index", icon: "home", iconFill: "home", label: "Home", sfDefault: "house", sfSelected: "house.fill" },
  { name: "live", icon: "camera", iconFill: "camera", label: "Live", sfDefault: "camera", sfSelected: "camera.fill" },
  { name: "gallery", icon: "images", iconFill: "images", label: "Gallery", sfDefault: "photo", sfSelected: "photo.fill" },
  { name: "loved", icon: "people", iconFill: "people", label: "Loved", sfDefault: "person.2", sfSelected: "person.2.fill" },
  { name: "alerts", icon: "notifications", iconFill: "notifications", label: "Alerts", sfDefault: "bell", sfSelected: "bell.fill" },
  { name: "more", icon: "settings", iconFill: "settings", label: "More", sfDefault: "gearshape", sfSelected: "gearshape.fill" },
] as const;

function TabIcon({
  name,
  focused,
  tabName,
}: {
  name: string;
  focused: boolean;
  tabName: string;
}) {
  const colors = useColors();
  const { alerts } = useAppStore();
  const unread = alerts.filter((a) => !a.read).length;
  const isIOS = Platform.OS === "ios";

  const config = TAB_CONFIG.find((t) => t.name === tabName)!;
  const isAlerts = tabName === "alerts";

  return (
    <View style={tabStyles.iconWrapper}>
      {isIOS ? (
        <SymbolView
          name={focused ? config.sfSelected : config.sfDefault}
          tintColor={focused ? colors.primary : colors.mutedForeground}
          size={22}
        />
      ) : (
        <Ionicons
          name={
            (focused ? config.iconFill : config.icon) as any
          }
          size={22}
          color={focused ? colors.primary : colors.mutedForeground}
        />
      )}
      {isAlerts && unread > 0 && (
        <View style={[tabStyles.badge, { backgroundColor: colors.sos }]}>
          <Text style={tabStyles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
      {focused && (
        <View
          style={[
            tabStyles.activeDot,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
          ]}
        />
      )}
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : `${colors.card}F5`,
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: insets.bottom,
          height: isWeb ? 70 : 56 + insets.bottom,
          borderTopColor: "transparent",
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={85}
              tint={isDark ? "dark" : "light"}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: `${colors.card}F8`,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                },
              ]}
            />
          ),
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={tab.icon}
                focused={focused}
                tabName={tab.name}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 32,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  activeDot: {
    position: "absolute",
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
});
