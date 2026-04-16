import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

export function SOSButton() {
  const colors = useColors();
  const { sosActive, triggerSOS, cancelSOS } = useAppStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sosActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [sosActive]);

  const startHold = () => {
    setHolding(true);
    setHoldProgress(0);
    let progress = 0;
    holdTimer.current = setInterval(() => {
      progress += 10;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(holdTimer.current!);
        setHolding(false);
        setHoldProgress(0);
        Vibration.vibrate([0, 200, 100, 200]);
        if (sosActive) {
          Alert.alert("Cancel SOS", "Are you sure you want to cancel the SOS alert?", [
            { text: "Keep Active", style: "cancel" },
            { text: "Cancel SOS", style: "destructive", onPress: cancelSOS },
          ]);
        } else {
          triggerSOS();
        }
      }
    }, 300);
  };

  const endHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    setHolding(false);
    setHoldProgress(0);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={startHold}
      onPressOut={endHold}
      style={[
        styles.container,
        {
          backgroundColor: sosActive ? `${colors.sos}25` : `${colors.sos}15`,
          borderColor: sosActive ? colors.sos : `${colors.sos}60`,
          borderWidth: 1,
        },
      ]}
    >
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View
          style={[
            styles.iconBg,
            { backgroundColor: sosActive ? colors.sos : `${colors.sos}30` },
          ]}
        >
          <Ionicons
            name={sosActive ? "warning" : "shield"}
            size={22}
            color={sosActive ? "#fff" : colors.sos}
          />
        </View>
      </Animated.View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.sos }]}>
          {sosActive ? "SOS ACTIVE — Tap to Cancel" : "SOS — Alert Contacts"}
        </Text>
        <Text style={[styles.subtitle, { color: `${colors.sos}90` }]}>
          {holding
            ? `Hold... ${Math.round(holdProgress)}%`
            : "Hold for 3 seconds to trigger"}
        </Text>
      </View>
      {holding && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${holdProgress}%`, backgroundColor: colors.sos },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {},
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "transparent",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
});
