import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

// Hold duration in ms — 1.5 seconds feels instant but prevents accidental triggers
const HOLD_MS = 1500;
const TICK_MS = 50; // update progress every 50 ms (smooth bar)

export function SOSButton() {
  const colors = useColors();
  const { sosActive, triggerSOS, cancelSOS } = useAppStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [holding, setHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0-100
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (sosActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [sosActive]);

  const startHold = () => {
    if (sosActive) {
      // When SOS is active, tap-and-hold to cancel (still needs intentional gesture)
      cancelSOS();
      Vibration.vibrate([0, 100, 80, 100]);
      return;
    }

    setHolding(true);
    progressRef.current = 0;
    setHoldProgress(0);

    holdTimer.current = setInterval(() => {
      progressRef.current += (TICK_MS / HOLD_MS) * 100;
      const pct = Math.min(100, progressRef.current);
      setHoldProgress(pct);

      if (pct >= 100) {
        clearInterval(holdTimer.current!);
        holdTimer.current = null;
        setHolding(false);
        setHoldProgress(0);
        // Strong haptic burst
        Vibration.vibrate([0, 150, 80, 150, 80, 300]);
        triggerSOS(); // ← fires immediately, no confirmation dialog
      }
    }, TICK_MS);
  };

  const endHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setHolding(false);
    setHoldProgress(0);
    progressRef.current = 0;
  };

  const secsLeft = sosActive
    ? null
    : holding
    ? ((HOLD_MS * (1 - holdProgress / 100)) / 1000).toFixed(1)
    : (HOLD_MS / 1000).toFixed(1);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={startHold}
      onPressOut={endHold}
      style={[
        styles.container,
        {
          backgroundColor: sosActive ? `${colors.sos}25` : `${colors.sos}12`,
          borderColor: sosActive
            ? colors.sos
            : holding
            ? `${colors.sos}90`
            : `${colors.sos}50`,
          borderWidth: 1,
        },
      ]}
    >
      <Animated.View
        style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
      >
        <View
          style={[
            styles.iconBg,
            {
              backgroundColor: sosActive
                ? colors.sos
                : holding
                ? `${colors.sos}50`
                : `${colors.sos}25`,
            },
          ]}
        >
          <Ionicons
            name={sosActive ? "warning" : "shield"}
            size={22}
            color={sosActive || holding ? "#fff" : colors.sos}
          />
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.sos }]}>
          {sosActive ? "SOS ACTIVE" : "SOS — Emergency Alert"}
        </Text>
        <Text style={[styles.subtitle, { color: `${colors.sos}90` }]}>
          {sosActive
            ? "Tap to cancel SOS"
            : holding
            ? `Activating… (${secsLeft}s)`
            : `Hold ${HOLD_MS / 1000}s to trigger instantly`}
        </Text>
      </View>

      {/* Progress bar */}
      {holding && (
        <View style={styles.progressTrack}>
          <Animated.View
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
    borderRadius: 18,
    padding: 16,
    gap: 12,
    overflow: "hidden",
  },
  iconBg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {},
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, marginTop: 3 },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,59,78,0.15)",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
});
