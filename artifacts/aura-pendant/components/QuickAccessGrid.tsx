import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

interface QuickItem {
  id: string;
  label: string;
  sublabel: string;
  route: string;
  iconName: string;
  iconFamily: "ionicons" | "material" | "feather";
  iconColor: string;
  bgColor: string;
}

export function QuickAccessGrid() {
  const colors = useColors();
  const router = useRouter();
  const { contacts, alerts, media } = useAppStore();

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const items: QuickItem[] = [
    {
      id: "live",
      label: "Live View",
      sublabel: "Real-time camera",
      route: "/(tabs)/live",
      iconName: "videocam",
      iconFamily: "ionicons",
      iconColor: colors.primary,
      bgColor: `${colors.primary}20`,
    },
    {
      id: "gallery",
      label: "Gallery",
      sublabel: media.length > 0 ? `${media.length} item${media.length !== 1 ? "s" : ""}` : "No media yet",
      route: "/(tabs)/gallery",
      iconName: "images",
      iconFamily: "ionicons",
      iconColor: colors.info,
      bgColor: `${colors.info}20`,
    },
    {
      id: "loved",
      label: "Loved Ones",
      sublabel: `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`,
      route: "/(tabs)/loved",
      iconName: "people",
      iconFamily: "ionicons",
      iconColor: colors.success,
      bgColor: `${colors.success}20`,
    },
    {
      id: "alerts",
      label: "Alerts",
      sublabel: unreadAlerts > 0 ? `${unreadAlerts} unread` : "All clear",
      route: "/(tabs)/alerts",
      iconName: "notifications",
      iconFamily: "ionicons",
      iconColor: unreadAlerts > 0 ? colors.sos : colors.warning,
      bgColor: unreadAlerts > 0 ? `${colors.sos}20` : `${colors.warning}20`,
    },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.item,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBg, { backgroundColor: item.bgColor }]}>
            <Ionicons name={item.iconName as any} size={24} color={item.iconColor} />
          </View>
          <Text style={[styles.label, { color: colors.foreground }]}>{item.label}</Text>
          <Text style={[styles.sublabel, { color: colors.mutedForeground }]}>
            {item.sublabel}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
  },
  sublabel: {
    fontSize: 12,
  },
});
