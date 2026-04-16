import { useCallback, useEffect, useRef } from "react";
import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av";

const ALARM_ASSET = require("../assets/sounds/alarm.wav");

function createWebSiren(): { stop: () => void } | null {
  if (Platform.OS !== "web") return null;

  try {
    const audioWindow = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContextCtor =
      audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

    if (!AudioContextCtor) return null;

    const ctx = new AudioContextCtor();
    ctx.resume().catch(() => undefined);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "square";
    osc2.type = "sawtooth";
    gain.gain.value = 0.6;

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.frequency.value = 660;
    osc2.frequency.value = 667;
    osc1.start();
    osc2.start();

    let sweepUp = true;
    const sweep = () => {
      const now = ctx.currentTime;
      const from = sweepUp ? 660 : 900;
      const to = sweepUp ? 900 : 660;

      osc1.frequency.cancelScheduledValues(now);
      osc2.frequency.cancelScheduledValues(now);
      osc1.frequency.setValueAtTime(from, now);
      osc1.frequency.linearRampToValueAtTime(to, now + 0.45);
      osc2.frequency.setValueAtTime(from + 7, now);
      osc2.frequency.linearRampToValueAtTime(to + 7, now + 0.45);

      sweepUp = !sweepUp;
    };

    sweep();
    const timer = setInterval(sweep, 450);

    return {
      stop: () => {
        clearInterval(timer);
        try {
          osc1.stop();
        } catch {}
        try {
          osc2.stop();
        } catch {}
        ctx.close().catch(() => undefined);
      },
    };
  } catch {
    return null;
  }
}

export function useSirenAlarm(active: boolean, muted = false) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const webRef = useRef<{ stop: () => void } | null>(null);

  const stopAlarm = useCallback(async () => {
    Vibration.cancel();

    if (webRef.current) {
      webRef.current.stop();
      webRef.current = null;
    }

    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  const startAlarm = useCallback(async () => {
    await stopAlarm();
    Vibration.vibrate([0, 300, 100, 300, 100, 600, 150], true);

    if (Platform.OS === "web") {
      webRef.current = createWebSiren();
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(ALARM_ASSET, {
        isLooping: true,
        shouldPlay: true,
        isMuted: false,
        volume: 1,
      });

      soundRef.current = sound;
      await sound.playAsync().catch(() => undefined);
    } catch (error) {
      console.warn("[useSirenAlarm] audio failed, vibration only:", error);
    }
  }, [stopAlarm]);

  useEffect(() => {
    if (active && !muted) {
      void startAlarm();
    } else {
      void stopAlarm();
    }

    return () => {
      void stopAlarm();
    };
  }, [active, muted, startAlarm, stopAlarm]);
}
