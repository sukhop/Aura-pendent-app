import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";

interface HeartRateChartProps {
  data: number[];
  height?: number;
  width?: number;
}

export function HeartRateChart({ data, height = 80, width }: HeartRateChartProps) {
  const colors = useColors();
  const chartWidth = width ?? Dimensions.get("window").width - 64;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const range = max - min;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = height - ((val - min) / range) * height;
    return { x, y };
  });

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 3;
    const cpX2 = point.x - (point.x - prev.x) / 3;
    return `${acc} C ${cpX1} ${prev.y} ${cpX2} ${point.y} ${point.x} ${point.y}`;
  }, "");

  const fillD = `${pathD} L ${chartWidth} ${height} L 0 ${height} Z`;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.heartRate} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.heartRate} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>
        <Path d={fillD} fill="url(#grad)" />
        <Path
          d={pathD}
          stroke={colors.heartRate}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
