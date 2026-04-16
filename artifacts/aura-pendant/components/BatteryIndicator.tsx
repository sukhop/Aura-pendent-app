import React from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface BatteryIndicatorProps {
  level: number;
  charging?: boolean;
  width?: number;
  height?: number;
}

export function BatteryIndicator({
  level,
  charging,
  width = 120,
  height = 6,
}: BatteryIndicatorProps) {
  const colors = useColors();

  const color =
    level > 50 ? colors.battery : level > 20 ? colors.warning : colors.sos;

  return (
    <View
      style={[
        styles.track,
        { width, height, backgroundColor: colors.border, borderRadius: height / 2 },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${level}%`,
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
  },
  fill: {},
});
