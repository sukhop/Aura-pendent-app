import { useEffect, useRef, useCallback } from "react";
import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av"; // ← STATIC import (dynamic import breaks Metro)

// Local WAV file — no CDN, no network dependency
const ALARM_ASSET = require("../assets/sounds/alarm.wav");

// ─────────────────────────────────────────────────────────────────────────────
//  Web Audio API siren (web only)
// ─────────────────────────────────────────────────────────────────────────────
function createWebSiren(): { stop: () => void } | null {
  if (Platform.OS !== "web") return null;
  try {
    const AC =
      (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return null;

    const ctx = new AC() as AudioContext;
    // Resume in case context was suspended (browser autoplay policy)
    ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    gain.gain.value = 0.75;
    osc.frequency.value = 660;
    osc.start();

    // Sweep 660 → 880 → 660 Hz
    let up = true;
    const sweep = () => {
      if (!osc) return;
      const now = ctx.currentTime;
      osc.frequency.cancelScheduledValues(now);
      if (up) {
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.45);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(660, now + 0.45);
      }
      up = !up;
    };
    sweep();
    const timer = setInterval(sweep, 450);

    return {
      stop: () => {
        clearInterval(timer);
        try {
          osc.stop();
        } catch {}
        ctx.close().catch(() => {});
      },
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useSirenAlarm(active: boolean) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const webSirenRef = useRef<{ stop: () => void } | null>(null);

  const stopAlarm = useCallback(async () => {
    // Stop vibration
    Vibration.cancel();

    // Stop web siren
    if (webSirenRef.current) {
      webSirenRef.current.stop();
      webSirenRef.current = null;
    }

    // Stop native sound
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  const startAlarm = useCallback(async () => {
    // ── Vibration (all platforms) ─────────────────────────────────────────────
    Vibration.vibrate([0, 300, 120, 300, 120, 600, 200], true);

    if (Platform.OS === "web") {
      // ── Web: Web Audio API oscillator ───────────────────────────────────────
      webSirenRef.current = createWebSiren();
    } else {
      // ── Native: expo-av with local WAV (no CDN required) ───────────────────
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true, // override iPhone silent switch
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(ALARM_ASSET, {
          isLooping: true,
          volume: 1.0,
        });
        soundRef.current = sound;
        await sound.playAsync();
      } catch (e) {
        console.warn("[useSirenAlarm] expo-av failed:", e);
        // Vibration already running — that's the fallback
      }
    }
  }, []);

  useEffect(() => {
    if (active) {
      startAlarm();
    } else {
      stopAlarm();
    }
    return () => {
      stopAlarm();
    };
  }, [active]);
}
