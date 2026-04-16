import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface LivePulseProps {
  bpm: number;
  size?: number;
}

export function LivePulse({ bpm, size = 10 }: LivePulseProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  // Pulse duration inversely proportional to BPM
  const interval = Math.max(400, Math.min(1200, Math.round(60000 / bpm)));

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.8,
            duration: interval * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: interval * 0.3,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: interval * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: interval * 0.1,
            useNativeDriver: true,
          }),
        ]),
        // hold
        Animated.delay(interval * 0.6),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [bpm]);

  return (
    <View style={[styles.wrapper, { width: size * 2.5, height: size * 2.5 }]}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderColor: colors.heartRate,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      {/* Inner solid dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.heartRate,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 2,
  },
  dot: {
    position: "absolute",
  },
});
