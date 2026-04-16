import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { useAppStore } from "@/store/appStore";
import { useColors } from "@/hooks/useColors";

/**
 * Full-screen biometric lock overlay.
 *
 * Behaviour:
 *  - When the app comes back to foreground (AppState 'active') and
 *    biometricLock is enabled, the lock screen is shown.
 *  - Tapping "Authenticate" triggers FaceID / fingerprint.
 *  - On success the lock is dismissed; on failure it stays visible.
 *  - On web or devices without biometrics a clear message is shown.
 */
export function BiometricLockScreen() {
  const colors = useColors();
  const { privacySettings } = useAppStore();
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse the lock icon
  useEffect(() => {
    if (!locked) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [locked]);

  // Lock whenever app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasBackground =
          appStateRef.current === "background" ||
          appStateRef.current === "inactive";

        if (
          wasBackground &&
          nextState === "active" &&
          privacySettings.biometricLock
        ) {
          setLocked(true);
          setErrorMsg("");
          // Auto-kick auth after a tiny delay so the modal renders first
          setTimeout(() => handleAuthenticate(), 400);
        }
        appStateRef.current = nextState;
      }
    );
    return () => subscription.remove();
  }, [privacySettings.biometricLock]);

  const handleAuthenticate = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    setErrorMsg("");

    try {
      const hasHW = await LocalAuthentication.hasHardwareAsync();
      if (!hasHW) {
        setErrorMsg(
          "No biometric hardware found on this device.\nUnlock in Settings."
        );
        setAuthenticating(false);
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setErrorMsg(
          "No biometrics enrolled on this device.\nPlease set up Face ID or fingerprint."
        );
        setAuthenticating(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to open Aura",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLocked(false);
        setErrorMsg("");
      } else {
        setErrorMsg("Authentication failed. Please try again.");
      }
    } catch (e) {
      setErrorMsg("An error occurred. Tap to retry.");
    } finally {
      setAuthenticating(false);
    }
  };

  if (!locked) return null;

  return (
    <Modal visible={locked} transparent={false} animationType="fade">
      <View
        style={[styles.overlay, { backgroundColor: colors.background }]}
      >
        {/* Background glow */}
        <View
          style={[
            styles.glow,
            { backgroundColor: `${colors.primary}18` },
          ]}
        />

        {/* Lock Icon */}
        <Animated.View
          style={[
            styles.iconOuter,
            {
              backgroundColor: `${colors.primary}15`,
              borderColor: `${colors.primary}40`,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="lock-closed" size={48} color={colors.primary} />
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          App Locked
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Biometric authentication required to access Aura Pendant
        </Text>

        {errorMsg !== "" && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${colors.sos}15`,
                borderColor: `${colors.sos}40`,
              },
            ]}
          >
            <Ionicons name="warning" size={16} color={colors.sos} />
            <Text style={[styles.errorText, { color: colors.sos }]}>
              {errorMsg}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.authBtn,
            {
              backgroundColor: authenticating
                ? `${colors.primary}50`
                : colors.primary,
            },
          ]}
          onPress={handleAuthenticate}
          disabled={authenticating}
          activeOpacity={0.85}
        >
          <Ionicons
            name={authenticating ? "hourglass" : "finger-print"}
            size={22}
            color="#fff"
          />
          <Text style={styles.authBtnText}>
            {authenticating ? "Authenticating…" : "Authenticate"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Face ID, Touch ID or device passcode
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 40,
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: "20%",
  },
  iconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 18 },
  authBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 8,
  },
  authBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  hint: { fontSize: 12 },
});
