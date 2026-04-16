import React from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface SignalBarsProps {
  strength: number; // 0–100
  size?: "sm" | "md";
}

export function SignalBars({ strength, size = "md" }: SignalBarsProps) {
  const colors = useColors();
  const numBars = 5;
  const activeBars = Math.round((strength / 100) * numBars);

  const barW = size === "sm" ? 3 : 4;
  const maxH = size === "sm" ? 12 : 16;
  const gap = size === "sm" ? 2 : 3;

  const barColor =
    activeBars >= 4
      ? colors.success
      : activeBars >= 3
      ? colors.warning
      : colors.sos;

  return (
    <View style={[styles.container, { gap }]}>
      {Array.from({ length: numBars }).map((_, i) => {
        const barHeight = maxH * ((i + 1) / numBars);
        const active = i < activeBars;
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                width: barW,
                height: barHeight,
                borderRadius: barW / 2,
                backgroundColor: active
                  ? barColor
                  : "rgba(255,255,255,0.12)",
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bar: {},
});
