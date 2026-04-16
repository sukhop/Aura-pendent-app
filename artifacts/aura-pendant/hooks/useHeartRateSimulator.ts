import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";

export function useHeartRateSimulator() {
  const { device, updateHealth, updateDevice } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!device.connected) return;

    intervalRef.current = setInterval(() => {
      useAppStore.setState((state) => {
        const current = state.health.heartRate;
        const delta = Math.floor(Math.random() * 5) - 2;
        const newRate = Math.max(55, Math.min(110, current + delta));
        const newHistory = [...state.health.heartRateHistory.slice(-12), newRate];
        let status: "Normal" | "Elevated" | "Low" | "Critical" = "Normal";
        if (newRate > 100) status = "Elevated";
        else if (newRate < 60) status = "Low";
        else if (newRate > 130 || newRate < 40) status = "Critical";

        const tempDelta = (Math.random() - 0.5) * 0.1;
        const newTemp = Math.max(35.5, Math.min(37.5, state.health.temperature + tempDelta));

        return {
          health: {
            ...state.health,
            heartRate: newRate,
            heartRateHistory: newHistory,
            temperature: Math.round(newTemp * 10) / 10,
            status,
          },
        };
      });
    }, 3000);

    batteryRef.current = setInterval(() => {
      useAppStore.setState((state) => {
        if (!state.device.connected) return state;
        const newBattery = state.device.batteryCharging
          ? Math.min(100, state.device.batteryLevel + 1)
          : Math.max(0, state.device.batteryLevel - 1);
        return {
          device: { ...state.device, batteryLevel: newBattery },
        };
      });
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (batteryRef.current) clearInterval(batteryRef.current);
    };
  }, [device.connected]);
}
