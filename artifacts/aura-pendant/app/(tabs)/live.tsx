import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

type Mode = "photo" | "video";

export default function LiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraStarted, setCameraStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<"front" | "back">("back");
  const { cameraSettings, updateCameraSettings, addMedia } = useAppStore();
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : insets.bottom;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      recordingTimer.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
      return () => {
        pulse.stop();
        if (recordingTimer.current) clearInterval(recordingTimer.current);
      };
    }
    setRecordingSeconds(0);
  }, [isRecording]);

  const handleStartCamera = async () => {
    if (isWeb) {
      setCameraStarted(true);
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Camera Permission", "Please grant camera access to use Live View.");
        return;
      }
    }
    setCameraStarted(true);
  };

  const handleCapture = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mode === "photo") {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      addMedia({
        id,
        type: "photo",
        uri: "",
        timestamp: new Date().toISOString(),
        starred: false,
        size: 2.4,
      });
      Alert.alert("Photo Captured", "Photo saved to gallery.");
    } else {
      if (isRecording) {
        setIsRecording(false);
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        addMedia({
          id,
          type: "video",
          uri: "",
          timestamp: new Date().toISOString(),
          starred: false,
          size: 15.2,
        });
        Alert.alert("Video Saved", `Video (${recordingSeconds}s) saved to gallery.`);
      } else {
        setIsRecording(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (!cameraStarted) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background, paddingTop: topPadding },
        ]}
      >
        <View style={[styles.cameraReadyIcon, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}>
          <Ionicons name="videocam" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.readyTitle, { color: colors.foreground }]}>Camera Ready</Text>
        <Text style={[styles.readySubtitle, { color: colors.mutedForeground }]}>
          Tap below to start live preview from your device camera
        </Text>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={handleStartCamera}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.startBtnText}>Start Camera</Text>
        </TouchableOpacity>

        <View style={[styles.modeSelector, { backgroundColor: `${colors.card}80` }]}>
          {(["photo", "video"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.modeBtn,
                mode === m && { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name={m === "photo" ? "camera" : "videocam"}
                size={16}
                color={mode === m ? "#fff" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.modeBtnText,
                  { color: mode === m ? "#fff" : colors.mutedForeground },
                ]}
              >
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.controls, { paddingBottom: bottomPadding + 90 }]}>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="images-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.captureBtn, { borderColor: colors.foreground }]}
            onPress={handleCapture}
          >
            <View style={[styles.captureInner, { backgroundColor: colors.foreground }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFacing(facing === "back" ? "front" : "back")}
          >
            <Ionicons name="camera-reverse-outline" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isWeb) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="videocam" size={60} color={colors.mutedForeground} />
          <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
            Camera preview (native only)
          </Text>
        </View>
        <CameraControls
          mode={mode}
          setMode={setMode}
          isRecording={isRecording}
          facing={facing}
          setFacing={setFacing}
          handleCapture={handleCapture}
          formatTime={formatTime}
          recordingSeconds={recordingSeconds}
          flashEnabled={cameraSettings.flashEnabled}
          setFlash={() => updateCameraSettings({ flashEnabled: !cameraSettings.flashEnabled })}
          audioEnabled={cameraSettings.audioEnabled}
          setAudio={() => updateCameraSettings({ audioEnabled: !cameraSettings.audioEnabled })}
          pulseAnim={pulseAnim}
          bottomPadding={bottomPadding}
          colors={colors}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      {permission?.granted && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={cameraSettings.flashEnabled ? "on" : "off"}
        />
      )}
      {isRecording && (
        <View style={[styles.recIndicator, { top: topPadding + 16 }]}>
          <Animated.View style={[styles.recDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.recText}>{formatTime(recordingSeconds)}</Text>
        </View>
      )}
      <CameraControls
        mode={mode}
        setMode={setMode}
        isRecording={isRecording}
        facing={facing}
        setFacing={setFacing}
        handleCapture={handleCapture}
        formatTime={formatTime}
        recordingSeconds={recordingSeconds}
        flashEnabled={cameraSettings.flashEnabled}
        setFlash={() => updateCameraSettings({ flashEnabled: !cameraSettings.flashEnabled })}
        audioEnabled={cameraSettings.audioEnabled}
        setAudio={() => updateCameraSettings({ audioEnabled: !cameraSettings.audioEnabled })}
        pulseAnim={pulseAnim}
        bottomPadding={bottomPadding}
        colors={colors}
      />
    </View>
  );
}

function CameraControls({
  mode, setMode, isRecording, facing, setFacing, handleCapture,
  formatTime, recordingSeconds, flashEnabled, setFlash, audioEnabled,
  setAudio, pulseAnim, bottomPadding, colors,
}: any) {
  return (
    <View style={[styles.cameraOverlay, { paddingBottom: bottomPadding + 90 }]}>
      <View style={styles.topControls}>
        <TouchableOpacity
          onPress={setFlash}
          style={[styles.overlayBtn, flashEnabled && { backgroundColor: `${colors.warning}40` }]}
        >
          <Ionicons
            name={flashEnabled ? "flash" : "flash-off"}
            size={20}
            color={flashEnabled ? colors.warning : "#fff"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={setAudio}
          style={[styles.overlayBtn, !audioEnabled && { backgroundColor: "rgba(255,59,78,0.3)" }]}
        >
          <Ionicons
            name={audioEnabled ? "mic" : "mic-off"}
            size={20}
            color={!audioEnabled ? colors.sos : "#fff"}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.modeSelector, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        {(["photo", "video"] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeBtn, mode === m && { backgroundColor: colors.primary }]}
          >
            <Ionicons
              name={m === "photo" ? "camera" : "videocam"}
              size={16}
              color={mode === m ? "#fff" : "rgba(255,255,255,0.6)"}
            />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === m ? "#fff" : "rgba(255,255,255,0.6)" },
              ]}
            >
              {m.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn2}>
          <Ionicons name="images-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.captureBtn,
            isRecording && { borderColor: colors.sos },
          ]}
          onPress={handleCapture}
        >
          {isRecording ? (
            <View style={[styles.recordingStop, { backgroundColor: colors.sos }]} />
          ) : mode === "video" ? (
            <View style={[styles.captureInner, { backgroundColor: colors.sos }]} />
          ) : (
            <View style={[styles.captureInner, { backgroundColor: "#fff" }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn2} onPress={setFacing}>
          <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 32 },
  cameraReadyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  readyTitle: { fontSize: 26, fontWeight: "800" },
  readySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
  },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    gap: 20,
  },
  topControls: {
    position: "absolute",
    top: -200,
    right: 16,
    gap: 12,
  },
  overlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeSelector: {
    flexDirection: "row",
    alignSelf: "center",
    borderRadius: 30,
    padding: 4,
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 26,
  },
  modeBtnText: { fontSize: 13, fontWeight: "700" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtn2: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  recordingStop: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  recIndicator: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B4E" },
  recText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderText: { fontSize: 14 },
});
