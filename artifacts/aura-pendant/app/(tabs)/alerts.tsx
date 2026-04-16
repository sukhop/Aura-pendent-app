import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function AlertCard({ alert, onRead, onDismiss }: {
  alert: AlertType;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(1)).current;
  const icon = ALERT_ICONS[alert.type];

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss(alert.id));
  };

  return (
    <Animated.View
      style={{
        opacity: slideAnim,
        transform: [
          {
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [40, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        style={[
          styles.alertCard,
          {
            backgroundColor: colors.card,
            borderColor: !alert.read ? `${icon.color}40` : colors.border,
            borderLeftColor: icon.color,
            borderLeftWidth: 3,
          },
        ]}
        onPress={() => onRead(alert.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.alertIconBg, { backgroundColor: `${icon.color}20` }]}>
          <Ionicons name={icon.name as any} size={20} color={icon.color} />
        </View>
        <View style={styles.alertContent}>
          <View style={styles.alertTitleRow}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>
              {alert.title}
            </Text>
            {!alert.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text style={[styles.alertMessage, { color: colors.mutedForeground }]}>
            {alert.message}
          </Text>
          <Text style={[styles.alertTime, { color: colors.mutedForeground }]}>
            {timeAgo(alert.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.dismissBtn}
        >
          <Ionicons name="close" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { alerts, dismissAlert, markAlertRead, markAllAlertsRead } = useAppStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const badgeAnim = useRef(new Animated.Value(1)).current;

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const filtered = alerts.filter((a) =>
    activeFilter === "All" ? true : a.type === activeFilter
  );

  const unreadCount = alerts.filter((a) => !a.read).length;

  // Pulse unread badge when count changes
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(badgeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [unreadCount]);

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Alerts",
      "Remove all alerts from this list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => filtered.forEach((a) => dismissAlert(a.id)),
        },
      ]
    );
  };

  const iconConfig = (type: AlertType["type"]) => ALERT_ICONS[type];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 16, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Alerts
          </Text>
          {unreadCount > 0 && (
            <Animated.View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.sos, transform: [{ scale: badgeAnim }] },
              ]}
            >
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAlertsRead}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: `${colors.primary}20`,
                  borderColor: `${colors.primary}40`,
                },
              ]}
            >
              <Ionicons name="checkmark-done" size={14} color={colors.primary} />
              <Text style={[styles.headerActionText, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
          {filtered.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: `${colors.sos}15`,
                  borderColor: `${colors.sos}30`,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={14} color={colors.sos} />
              <Text style={[styles.headerActionText, { color: colors.sos }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
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
              {tab}
            </Text>
            {tab !== "All" && (
              <Text
                style={[
                  styles.filterCount,
                  {
                    color:
                      activeFilter === tab
                        ? "rgba(255,255,255,0.7)"
                        : colors.mutedForeground,
                  },
                ]}
              >
                {alerts.filter((a) => a.type === tab).length}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alert list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPadding + 110 },
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
              <Ionicons
                name="notifications-off-outline"
                size={36}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No alerts
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              All clear — no{" "}
              {activeFilter === "All"
                ? ""
                : activeFilter.toLowerCase() + " "}
              alerts right now.
            </Text>
          </View>
        ) : (
          filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={markAlertRead}
              onDismiss={dismissAlert}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 28, fontWeight: "800" },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  headerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  headerActionText: { fontSize: 12, fontWeight: "600" },
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
  filterCount: { fontSize: 11, fontWeight: "700" },
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
    flexShrink: 0,
  },
  alertContent: { flex: 1, gap: 3 },
  alertTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  alertTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  alertMessage: { fontSize: 12, lineHeight: 16 },
  alertTime: { fontSize: 11, marginTop: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dismissBtn: { padding: 4 },
});
