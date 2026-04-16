import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";
import { BatteryIndicator } from "@/components/BatteryIndicator";
import { SignalBars } from "@/components/SignalBars";

export function ConnectionBanner() {
  const colors = useColors();
  const { device, updateDevice, disconnectDevice } = useAppStore();

  const searchAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!device.connected) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(searchAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(searchAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      searchAnim.setValue(0);
      // Connected pulse once
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [device.connected]);

  const handleToggleConnection = () => {
    if (device.connected) {
      disconnectDevice();
    } else {
      updateDevice({ connected: true });
    }
  };

  const isIOS = Platform.OS === "ios";
  const borderColor = device.connected
    ? `${colors.success}50`
    : `${colors.warning}50`;
  const bg = device.connected ? `${colors.success}12` : `${colors.warning}10`;

  const dotColor = device.connected ? colors.success : colors.warning;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: bg,
          borderColor,
          transform: [{ scale: pulseAnim }],
          opacity: fadeIn,
        },
      ]}
    >
      <View style={styles.left}>
        {/* Animated dot */}
        <View style={styles.dotWrapper}>
          <View style={[styles.dotInner, { backgroundColor: dotColor }]} />
          {!device.connected && (
            <Animated.View
              style={[
                styles.dotRing,
                {
                  borderColor: dotColor,
                  opacity: searchAnim,
                  transform: [
                    {
                      scale: searchAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.0],
                      }),
                    },
                  ],
                },
              ]}
            />
          )}
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
            {device.connected ? device.deviceName : "Pendant Disconnected"}
          </Text>
          <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>
            {device.connected
              ? `Firmware ${device.firmwareVersion}`
              : "Searching via Bluetooth..."}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {device.connected && (
          <>
            <SignalBars strength={device.signalStrength} size="sm" />
            <BatteryIndicator level={device.batteryLevel} width={32} height={12} />
          </>
        )}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              backgroundColor: device.connected
                ? `${colors.success}20`
                : `${colors.primary}20`,
              borderColor: device.connected ? colors.success : colors.primary,
            },
          ]}
          onPress={handleToggleConnection}
        >
          <Ionicons
            name={device.connected ? "bluetooth" : "bluetooth-outline"}
            size={14}
            color={device.connected ? colors.success : colors.primary}
          />
          <Text
            style={[
              styles.actionBtnText,
              {
                color: device.connected ? colors.success : colors.primary,
              },
            ]}
          >
            {device.connected ? "Connected" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  dotWrapper: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotRing: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  textBlock: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: "700" },
  bannerSub: { fontSize: 11, marginTop: 1 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 11, fontWeight: "700" },
});
