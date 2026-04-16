import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/store/appStore";
import { useSirenAlarm } from "@/hooks/useSirenAlarm";

export function SOSOverlay() {
  const { sosActive, cancelSOS, contacts, sosLocation } = useAppStore();
  const insets = useSafeAreaInsets();

  // 🔊 Start/stop siren alarm whenever SOS is active
  useSirenAlarm(sosActive);
  const [sirenMuted, setSirenMuted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sosContacts = contacts.filter((c) => c.sosEnabled);

  useEffect(() => {
    if (sosActive) {
      setElapsedSeconds(0);
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const border = Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(borderAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      border.start();

      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      return () => {
        pulse.stop();
        border.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      fadeAnim.setValue(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [sosActive]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel SOS",
      "Are you sure you want to cancel the emergency alert?",
      [
        { text: "Keep Active", style: "cancel" },
        {
          text: "Cancel SOS",
          style: "destructive",
          onPress: () => {
            cancelSOS();
          },
        },
      ]
    );
  };

  if (!sosActive) return null;

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,59,78,0.95)", "rgba(200,10,30,0.98)"],
  });

  return (
    <Modal visible={sosActive} transparent animationType="none">
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim, paddingTop: insets.top + 20 }]}
      >
        {/* Pulsing background glow */}
        <Animated.View
          style={[
            styles.glowBg,
            { transform: [{ scale: pulseAnim }] },
          ]}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* SOS Icon */}
          <Animated.View
            style={[styles.sosIconOuter, { transform: [{ scale: pulseAnim }] }]}
          >
            <View style={styles.sosIconInner}>
              <Ionicons name="warning" size={52} color="#fff" />
            </View>
          </Animated.View>

          <Text style={styles.sosTitle}>SOS ACTIVE</Text>
          <Text style={styles.sosDuration}>Active for {formatElapsed(elapsedSeconds)}</Text>

          {/* Mute / active siren indicator */}
          <TouchableOpacity
            style={styles.sirenRow}
            onPress={() => setSirenMuted((m) => !m)}
            activeOpacity={0.8}
          >
            <View style={styles.sirenDot} />
            <Ionicons
              name={sirenMuted ? "volume-mute" : "volume-high"}
              size={16}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.sirenText}>
              {sirenMuted ? "Alarm muted" : "🔊 Emergency alarm sounding"}
            </Text>
          </TouchableOpacity>

          {/* GPS Location */}
          {sosLocation && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={16} color="#FF8FA3" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>LIVE GPS LOCATION</Text>
                <Text style={styles.locationCoords}>
                  {sosLocation.lat.toFixed(5)}°N, {sosLocation.lng.toFixed(5)}°E
                </Text>
              </View>
              <View style={styles.locationLive}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          )}

          {/* Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#00D68F" />
              <Text style={styles.statusText}>Emergency alert sent to contacts</Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons name="shield-checkmark" size={16} color="#00D68F" />
              <Text style={styles.statusText}>Location shared with authorities</Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons name="camera" size={16} color="#00D68F" />
              <Text style={styles.statusText}>Live camera stream activated</Text>
            </View>
          </View>

          {/* Contacts being alerted */}
          <Text style={styles.contactsLabel}>ALERTING {sosContacts.length} CONTACTS</Text>
          <View style={styles.contactsRow}>
            {sosContacts.map((contact) => (
              <View key={contact.id} style={styles.contactChip}>
                <View style={[styles.contactAvatar, { backgroundColor: contact.avatarColor }]}>
                  <Text style={styles.contactInitials}>{contact.initials}</Text>
                </View>
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle" size={22} color="#FF3B4E" />
            <Text style={styles.cancelText}>Cancel SOS</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Emergency services may be automatically notified depending on your region.
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#B00020",
    paddingHorizontal: 20,
      paddingBottom: 40,
  },
  glowBg: {
    position: "absolute",
    top: "20%",
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(255,80,100,0.25)",
  },
  content: {
    alignItems: "center",
    gap: 20,
    paddingBottom: 40,
  },
  sosIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  sosIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sosTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 6,
    textAlign: "center",
  },
  sosDuration: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  locationCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  locationText: { flex: 1 },
  locationLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  locationCoords: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    marginTop: 2,
  },
  locationLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,214,143,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00D68F",
  },
  liveText: { fontSize: 10, color: "#00D68F", fontWeight: "800" },
  statusCard: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  contactsLabel: {
    alignSelf: "flex-start",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  contactsRow: { width: "100%", gap: 10 },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: { color: "#fff", fontSize: 13, fontWeight: "700" },
  contactName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactRelation: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 8,
  },
  cancelText: {
    color: "#FF3B4E",
    fontSize: 17,
    fontWeight: "800",
  },
  disclaimer: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  sirenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sirenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    opacity: 0.9,
  },
  sirenText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
  },
});
