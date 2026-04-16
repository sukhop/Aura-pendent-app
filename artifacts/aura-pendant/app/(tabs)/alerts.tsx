import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore, Alert as AlertType } from "@/store/appStore";

type FilterTab = "All" | "SOS" | "Camera" | "Health" | "Device";

const FILTER_TABS: FilterTab[] = ["All", "SOS", "Camera", "Health", "Device"];

const ALERT_ICONS: Record<AlertType["type"], { name: string; color: string }> = {
  SOS: { name: "warning", color: "#FF3B4E" },
  Health: { name: "heart", color: "#FF4D6D" },
  Device: { name: "hardware-chip", color: "#7C6FFF" },
  Camera: { name: "camera", color: "#00C2FF" },
};

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, dismissAlert, markAlertRead } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const filtered = alerts.filter((a) =>
    activeFilter === "All" ? true : a.type === activeFilter
  );

  const unreadCount = alerts.filter((a) => !a.read).length;

  const iconConfig = (type: AlertType["type"]) => ALERT_ICONS[type];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 16,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.sos }]}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  activeFilter === tab ? colors.primary : colors.card,
                borderColor:
                  activeFilter === tab ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            {tab !== "All" && (
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: iconConfig(tab as AlertType["type"]).color },
                ]}
              />
            )}
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    activeFilter === tab ? "#fff" : colors.mutedForeground,
                },
              ]}
            >
              {tab === "SOS" ? "🔴 SOS" : tab === "Health" ? "❤ Health" : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding + 100 },
        ]}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="notifications-off-outline" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No alerts
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              All clear — no {activeFilter === "All" ? "" : activeFilter.toLowerCase() + " "}alerts right now.
            </Text>
          </View>
        ) : (
          filtered.map((alert) => {
            const icon = iconConfig(alert.type);
            return (
              <TouchableOpacity
                key={alert.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: !alert.read ? `${icon.color}40` : colors.border,
                    borderLeftColor: icon.color,
                    borderLeftWidth: 3,
                  },
                ]}
                onPress={() => markAlertRead(alert.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.alertIconBg,
                    { backgroundColor: `${icon.color}20` },
                  ]}
                >
                  <Ionicons name={icon.name as any} size={20} color={icon.color} />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.foreground }]}>
                    {alert.title}
                  </Text>
                  <Text style={[styles.alertMessage, { color: colors.mutedForeground }]}>
                    {alert.message}
                  </Text>
                  <Text style={[styles.alertTime, { color: colors.mutedForeground }]}>
                    {alert.timestamp}
                  </Text>
                </View>
                <View style={styles.alertRight}>
                  {!alert.read && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                  )}
                  <TouchableOpacity
                    onPress={() => dismissAlert(alert.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 28, fontWeight: "800" },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  filterScroll: { flexGrow: 0 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterDot: { width: 6, height: 6, borderRadius: 3 },
  filterText: { fontSize: 13, fontWeight: "600" },
  list: { paddingHorizontal: 16, gap: 10 },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
  },
  alertIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: { flex: 1, gap: 3 },
  alertTitle: { fontSize: 14, fontWeight: "700" },
  alertMessage: { fontSize: 12 },
  alertTime: { fontSize: 11 },
  alertRight: { alignItems: "flex-end", gap: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
