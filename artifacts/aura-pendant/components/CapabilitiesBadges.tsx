import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface Badge {
  label: string;
  iconName: string;
  iconFamily: "ionicons" | "material";
}

const capabilities: Badge[] = [
  { label: "12MP Camera", iconName: "camera", iconFamily: "ionicons" },
  { label: "4K Video", iconName: "videocam", iconFamily: "ionicons" },
  { label: "GPS", iconName: "location", iconFamily: "ionicons" },
  { label: "Temp", iconName: "thermometer", iconFamily: "ionicons" },
  { label: "Heart Rate", iconName: "heart", iconFamily: "ionicons" },
  { label: "Two-way Audio", iconName: "mic", iconFamily: "ionicons" },
  { label: "Cloud Sync", iconName: "cloud", iconFamily: "ionicons" },
  { label: "E2E Encrypted", iconName: "lock-closed", iconFamily: "ionicons" },
  { label: "LTE + Wi-Fi", iconName: "wifi", iconFamily: "ionicons" },
  { label: "SOS Flash", iconName: "flash", iconFamily: "ionicons" },
];

export function CapabilitiesBadges() {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {capabilities.map((cap) => (
        <View
          key={cap.label}
          style={[
            styles.badge,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
        >
          <Ionicons name={cap.iconName as any} size={12} color={colors.primary} />
          <Text style={[styles.label, { color: colors.foreground }]}>{cap.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
});
