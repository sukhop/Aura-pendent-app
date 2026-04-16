import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";
import { BatteryIndicator } from "./BatteryIndicator";

export function ConnectionBanner() {
  const colors = useColors();
  const { device, updateDevice } = useAppStore();
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleToggleConnection = () => {
    updateDevice({ connected: !device.connected });
  };

  const batteryColor =
    device.batteryLevel > 50
      ? colors.battery
      : device.batteryLevel > 20
      ? colors.warning
      : colors.sos;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBg, { backgroundColor: `${colors.primary}20` }]}>
        <MaterialCommunityIcons name="chip" size={26} color={colors.primary} />
        {device.connected && (
          <Animated.View
            style={[styles.dot, { backgroundColor: colors.connected, opacity: dotAnim }]}
          />
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>{device.deviceName}</Text>
        <View style={styles.statusRow}>
          {device.connected ? (
            <>
              <Ionicons name="checkmark-circle" size={14} color={colors.connected} />
              <Text style={[styles.status, { color: colors.connected }]}>Connected</Text>
            </>
          ) : (
            <>
              <Ionicons name="close-circle" size={14} color={colors.mutedForeground} />
              <Text style={[styles.status, { color: colors.mutedForeground }]}>Disconnected</Text>
            </>
          )}
        </View>
        {device.connected && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>PHOTOS</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>0</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VIDEOS</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>0</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>TODAY</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>0</Text>
            </View>
          </View>
        )}
        <View style={styles.storageRow}>
          <MaterialCommunityIcons name="database" size={12} color={colors.mutedForeground} />
          <Text style={[styles.storageLabel, { color: colors.mutedForeground }]}>Storage</Text>
          <Text style={[styles.storageValue, { color: colors.foreground }]}>
            {device.storageUsed} / {device.storageTotal} GB
          </Text>
        </View>
        <BatteryIndicator
          level={(device.storageUsed / device.storageTotal) * 100}
          height={4}
        />
      </View>
      <View style={styles.right}>
        <View style={styles.batteryContainer}>
          <Ionicons
            name="flash"
            size={14}
            color={batteryColor}
          />
          <Text style={[styles.batteryText, { color: batteryColor }]}>
            {device.batteryLevel}%
          </Text>
        </View>
        <BatteryIndicator level={device.batteryLevel} width={60} height={4} />
        <TouchableOpacity
          onPress={handleToggleConnection}
          style={[styles.pairBtn, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}
        >
          <Ionicons
            name={device.connected ? "bluetooth" : "bluetooth-outline"}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storageLabel: {
    fontSize: 11,
    flex: 1,
  },
  storageValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  batteryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  batteryText: {
    fontSize: 15,
    fontWeight: "700",
  },
  pairBtn: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
});
