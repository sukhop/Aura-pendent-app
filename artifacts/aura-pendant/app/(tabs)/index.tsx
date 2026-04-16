import React, { useCallback, useEffect } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";
import { useHeartRateSimulator } from "@/hooks/useHeartRateSimulator";
import { GlassCard } from "@/components/GlassCard";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { SOSButton } from "@/components/SOSButton";
import { HeartRateChart } from "@/components/HeartRateChart";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { CapabilitiesBadges } from "@/components/CapabilitiesBadges";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { health, device, alerts, updateDevice } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useHeartRateSimulator();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const heartRateDiff = health.heartRateHistory.length > 1
    ? health.heartRate - health.heartRateHistory[health.heartRateHistory.length - 5]
    : 0;

  const networkStatusColor =
    device.networkStatus === "secure" ? colors.success : colors.warning;

  const unreadAlerts = alerts.filter((a) => !a.read).length;

  const handleNotifications = () => {
    router.push("/(tabs)/alerts");
  };

  const handleBluetoothPair = () => {
    if (device.connected) {
      Alert.alert(
        "Bluetooth Connection",
        `Connected to ${device.deviceName}\n\nSignal: ${device.signalStrength}%\nFirmware: ${device.firmwareVersion}`,
        [
          { text: "Disconnect", style: "destructive", onPress: () => updateDevice({ connected: false }) },
          { text: "Close", style: "cancel" },
        ]
      );
    } else {
      Alert.alert(
        "Scan for Pendant",
        "Searching for nearby Aura Pendant Pro devices via Bluetooth...",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect", onPress: () => updateDevice({ connected: true }) },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPadding + 16,
          paddingBottom: bottomPadding + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Welcome back
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Aura Dashboard
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleNotifications}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          {unreadAlerts > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: colors.sos }]}>
              <Text style={styles.notifBadgeText}>{unreadAlerts > 9 ? "9+" : unreadAlerts}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ConnectionBanner />

      <GlassCard style={styles.heartCard} accent>
        <View style={styles.heartHeader}>
          <View style={styles.heartLeft}>
            <View style={[styles.heartIconBg, { backgroundColor: `${colors.heartRate}20` }]}>
              <Ionicons name="heart" size={20} color={colors.heartRate} />
            </View>
            <View>
              <Text style={[styles.heartLabel, { color: colors.mutedForeground }]}>
                HEART RATE
              </Text>
              <View style={styles.bpmRow}>
                <Text style={[styles.bpmValue, { color: colors.heartRate }]}>
                  {health.heartRate}
                </Text>
                <Text style={[styles.bpmUnit, { color: colors.mutedForeground }]}>BPM</Text>
              </View>
            </View>
          </View>
          <View style={styles.heartRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    health.status === "Normal"
                      ? `${colors.success}20`
                      : `${colors.warning}20`,
                  borderColor:
                    health.status === "Normal" ? colors.success : colors.warning,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      health.status === "Normal" ? colors.success : colors.warning,
                  },
                ]}
              >
                {health.status}
              </Text>
            </View>
            <Text style={[styles.diffText, { color: colors.mutedForeground }]}>
              {heartRateDiff >= 0 ? "+" : ""}{heartRateDiff} vs 4 readings ago
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <HeartRateChart data={health.heartRateHistory} height={80} />
        </View>

        <View style={styles.heartStats}>
          {[
            { label: "MIN", value: `${Math.min(...health.heartRateHistory)}`, unit: "bpm" },
            { label: "AVG", value: `${Math.round(health.heartRateHistory.reduce((a, b) => a + b, 0) / health.heartRateHistory.length)}`, unit: "bpm" },
            { label: "MAX", value: `${Math.max(...health.heartRateHistory)}`, unit: "bpm" },
            { label: "TEMP", value: `${health.temperature}`, unit: "°C" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statVal, { color: colors.foreground }]}>
                {stat.value}
                <Text style={[styles.statUnit, { color: colors.mutedForeground }]}>
                  {stat.unit}
                </Text>
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <SOSButton />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          QUICK ACCESS
        </Text>
      </View>

      <QuickAccessGrid />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PENDANT CONNECTION
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.pairCard, { backgroundColor: colors.card, borderColor: device.connected ? `${colors.success}50` : colors.border }]}
        activeOpacity={0.8}
        onPress={handleBluetoothPair}
      >
        <View style={[styles.pairIconBg, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="bluetooth" size={22} color={colors.primary} />
        </View>
        <View style={styles.pairText}>
          <Text style={[styles.pairTitle, { color: colors.foreground }]}>
            {device.connected ? "Aura Pendant Pro" : "Pair Your Aura Pendant"}
          </Text>
          <Text style={[styles.pairSub, { color: colors.mutedForeground }]}>
            {device.connected
              ? "Tap to manage Bluetooth connection"
              : "Tap to scan for nearby pendant via Bluetooth"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PENDANT CAPABILITIES
        </Text>
      </View>

      <CapabilitiesBadges />

      <View
        style={[
          styles.networkCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.networkLeft}>
          <Ionicons name="wifi" size={20} color={networkStatusColor} />
          <View>
            <Text style={[styles.networkTitle, { color: colors.foreground }]}>
              Network Status
            </Text>
            <Text style={[styles.networkSub, { color: colors.mutedForeground }]}>
              Online — Wi-Fi connected
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.networkBadge,
            { backgroundColor: `${networkStatusColor}20`, borderColor: networkStatusColor },
          ]}
        >
          <Ionicons name="shield-checkmark" size={12} color={networkStatusColor} />
          <Text style={[styles.networkBadgeText, { color: networkStatusColor }]}>
            {device.networkStatus === "secure" ? "Secure" : "Unsecure"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greeting: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  title: { fontSize: 24, fontWeight: "800" },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  heartCard: { padding: 16, gap: 12 },
  heartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heartLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  heartIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heartLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  bpmRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  bpmValue: { fontSize: 36, fontWeight: "800" },
  bpmUnit: { fontSize: 13, fontWeight: "500" },
  heartRight: { alignItems: "flex-end", gap: 6 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  diffText: { fontSize: 11 },
  chartContainer: { marginHorizontal: -4 },
  heartStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  statItem: { alignItems: "center" },
  statLabel: { fontSize: 9, fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 },
  statVal: { fontSize: 15, fontWeight: "700" },
  statUnit: { fontSize: 10, fontWeight: "400" },
  sectionHeader: { marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 1 },
  pairCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  pairIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pairText: { flex: 1 },
  pairTitle: { fontSize: 15, fontWeight: "700" },
  pairSub: { fontSize: 12, marginTop: 2 },
  networkCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  networkLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  networkTitle: { fontSize: 14, fontWeight: "600" },
  networkSub: { fontSize: 11, marginTop: 2 },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  networkBadgeText: { fontSize: 11, fontWeight: "700" },
});
