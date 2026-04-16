import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";

export function useHeartRateSimulator() {
  const { device, addAlert, alertBehavior, batteryAlertSent, setBatteryAlertSent } =
    useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastStatusRef = useRef<string>("Normal");
  const batteryAlertRef = useRef(batteryAlertSent);

  useEffect(() => {
    batteryAlertRef.current = batteryAlertSent;
  }, [batteryAlertSent]);

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

        // Auto-generate alert on first Critical status transition
        if (status === "Critical" && lastStatusRef.current !== "Critical") {
          const criticalAlert = {
            id: Date.now().toString() + "_hr",
            type: "Health" as const,
            title: "⚠️ Critical Heart Rate",
            message: `Heart rate at ${newRate} BPM — seek medical attention immediately.`,
            timestamp: new Date().toISOString(),
            read: false,
          };
          state.alerts = [criticalAlert, ...state.alerts];
        } else if (status === "Elevated" && lastStatusRef.current === "Normal") {
          const elevatedAlert = {
            id: Date.now().toString() + "_hr",
            type: "Health" as const,
            title: "↑ Elevated Heart Rate",
            message: `Heart rate at ${newRate} BPM — monitor closely.`,
            timestamp: new Date().toISOString(),
            read: false,
          };
          state.alerts = [elevatedAlert, ...state.alerts];
        }

        lastStatusRef.current = status;

        const tempDelta = (Math.random() - 0.5) * 0.1;
        const newTemp = Math.max(
          35.5,
          Math.min(37.5, state.health.temperature + tempDelta)
        );

        return {
          health: {
            ...state.health,
            heartRate: newRate,
            heartRateHistory: newHistory,
            temperature: Math.round(newTemp * 10) / 10,
            status,
          },
          alerts: state.alerts,
        };
      });
    }, 3000);

    batteryRef.current = setInterval(() => {
      useAppStore.setState((state) => {
        if (!state.device.connected) return state;
        const newBattery = state.device.batteryCharging
          ? Math.min(100, state.device.batteryLevel + 1)
          : Math.max(0, state.device.batteryLevel - 1);

        // Auto-alert at 15% battery (once per session)
        let newAlerts = state.alerts;
        if (
          newBattery <= 15 &&
          !batteryAlertRef.current &&
          state.alertBehavior.notifyLowBattery
        ) {
          batteryAlertRef.current = true;
          setBatteryAlertSent(true);
          newAlerts = [
            {
              id: Date.now().toString() + "_bat",
              type: "Device" as const,
              title: "🔋 Battery Low",
              message: `Pendant battery at ${newBattery}% — please charge soon.`,
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...state.alerts,
          ];
        }

        return {
          device: { ...state.device, batteryLevel: newBattery },
          alerts: newAlerts,
        };
      });
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (batteryRef.current) clearInterval(batteryRef.current);
    };
  }, [device.connected]);
}
