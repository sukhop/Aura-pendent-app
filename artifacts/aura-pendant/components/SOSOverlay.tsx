import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSirenAlarm } from "@/hooks/useSirenAlarm";
import { useAppStore } from "@/store/appStore";

type Coordinates = { lat: number; lng: number } | null;

function getSosApiUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_SOS_API_URL?.trim();
  const baseUrl = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/$/, "")
    : Platform.OS === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001";

  return `${baseUrl}/api/sos/notify`;
}

type PushContact = {
  name: string;
  pushToken: string;
};

export function SOSOverlay() {
  const {
    sosActive,
    sosMuted,
    cancelSOS,
    contacts,
    sosLocation,
    profile,
    privacySettings,
    alertBehavior,
    setSOSMuted,
    setSOSLocation,
  } = useAppStore();
  const insets = useSafeAreaInsets();

  useSirenAlarm(sosActive, sosMuted);

  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [deliveryMessage, setDeliveryMessage] = useState("");

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sosContacts = contacts.filter((contact) => contact.sosEnabled);
  const pushContacts: PushContact[] = sosContacts
    .filter((contact) => !!contact.pushToken)
    .map((contact) => ({
      name: contact.name,
      pushToken: contact.pushToken!,
    }));

  const resolveCurrentLocation = useCallback(async (): Promise<Coordinates> => {
    if (!privacySettings.locationSharing) {
      setSOSLocation(null);
      return null;
    }

    if (Platform.OS === "web") {
      return sosLocation;
    }

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setSOSLocation(null);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const nextLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setSOSLocation(nextLocation);
      return nextLocation;
    } catch (error) {
      console.warn("[SOS] Failed to resolve device location", error);
      setSOSLocation(null);
      return null;
    }
  }, [privacySettings.locationSharing, setSOSLocation, sosLocation]);

  const sendSMSAlerts = useCallback(
    async (location: Coordinates) => {
      if (sosContacts.length === 0) {
        setDeliveryStatus("sent");
        setDeliveryMessage("SOS is active, but no emergency contacts are enabled.");
        return;
      }

      if (pushContacts.length === 0) {
        setDeliveryStatus("failed");
        setDeliveryMessage(
          "No free push-alert tokens are saved yet. Ask trusted contacts to install Aura and share their push token."
        );
        return;
      }

      setDeliveryStatus("sending");
      setDeliveryMessage("Sending free SOS push alerts to your Aura contacts...");

      try {
        const payload = {
          contacts: pushContacts,
          senderName: profile?.name ?? "Someone",
          lat: location?.lat,
          lng: location?.lng,
        };

        const response = await fetch(getSosApiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error ?? "Automatic push delivery failed");
        }

        setDeliveryStatus("sent");
        setDeliveryMessage(
          data?.message ??
            `Free SOS push alerts sent to ${pushContacts.length} contact${pushContacts.length === 1 ? "" : "s"}.`
        );
      } catch (error) {
        console.warn("[SOS] Automatic push delivery failed", error);
        setDeliveryStatus("failed");
        setDeliveryMessage(
          "Free SOS push alerts could not be delivered right now. Make sure the API server is running and your contacts have valid Aura push tokens."
        );
      }
    },
    [profile?.name, pushContacts, sosContacts.length]
  );

  useEffect(() => {
    if (!sosActive) {
      fadeAnim.setValue(0);
      setDeliveryMessage("");
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setElapsedSeconds(0);
    setDeliveryStatus("idle");
    setDeliveryMessage("");
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
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    let cancelled = false;

    const activateSOS = async () => {
      const location = await resolveCurrentLocation();
      if (!cancelled) {
        await sendSMSAlerts(location);
      }
    };

    void activateSOS();

    return () => {
      cancelled = true;
      pulse.stop();
      border.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [borderAnim, fadeAnim, pulseAnim, resolveCurrentLocation, sendSMSAlerts, sosActive]);

  const formatElapsed = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const handleCancel = () => {
    Alert.alert("Cancel SOS", "Are you sure you want to cancel the emergency alert?", [
      { text: "Keep Active", style: "cancel" },
      {
        text: "Cancel SOS",
        style: "destructive",
        onPress: () => {
          cancelSOS();
          setDeliveryStatus("idle");
          setDeliveryMessage("");
        },
      },
    ]);
  };

  if (!sosActive) return null;

  return (
    <Modal visible={sosActive} transparent animationType="none">
      <Animated.View
        style={[styles.overlay, { opacity: fadeAnim, paddingTop: insets.top + 20 }]}
      >
        <Animated.View style={[styles.glowBg, { transform: [{ scale: pulseAnim }] }]} />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.sosIconOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.sosIconInner}>
              <Ionicons name="warning" size={52} color="#fff" />
            </View>
          </Animated.View>

          <Text style={styles.sosTitle}>SOS ACTIVE</Text>
          <Text style={styles.sosDuration}>Active for {formatElapsed(elapsedSeconds)}</Text>

          <TouchableOpacity
            style={styles.sirenRow}
            onPress={() => setSOSMuted(!sosMuted)}
            activeOpacity={0.8}
          >
            <View style={styles.sirenDot} />
            <Ionicons
              name={sosMuted ? "volume-mute" : "volume-high"}
              size={16}
              color="rgba(255,255,255,0.9)"
            />
            <Text style={styles.sirenText}>
              {sosMuted ? "Alarm muted" : "Emergency alarm sounding"}
            </Text>
          </TouchableOpacity>

          {deliveryStatus !== "idle" && (
            <View style={styles.smsStatusRow}>
              <Ionicons
                name={
                  deliveryStatus === "sending"
                    ? "hourglass-outline"
                    : deliveryStatus === "sent"
                    ? "checkmark-circle"
                    : "close-circle"
                }
                size={16}
                color={
                  deliveryStatus === "sent"
                    ? "#00D68F"
                    : deliveryStatus === "failed"
                    ? "#FF8FA3"
                    : "rgba(255,255,255,0.7)"
                }
              />
              <Text style={styles.smsStatusText}>{deliveryMessage}</Text>
            </View>
          )}

          {sosLocation && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={16} color="#FF8FA3" />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>LIVE GPS LOCATION</Text>
                <Text style={styles.locationCoords}>
                  {sosLocation.lat.toFixed(5)}, {sosLocation.lng.toFixed(5)}
                </Text>
              </View>
              <View style={styles.locationLive}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          )}

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#00D68F" />
              <Text style={styles.statusText}>Emergency mode is active on this device</Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons
                name={sosLocation ? "location" : "location-outline"}
                size={16}
                color={sosLocation ? "#00D68F" : "#FFB800"}
              />
              <Text style={styles.statusText}>
                {sosLocation
                  ? "Current location attached to the SOS alert"
                  : "Location unavailable or location sharing is turned off"}
              </Text>
            </View>
            {alertBehavior.shareLiveCamera && (
              <View style={styles.statusRow}>
                <Ionicons name="camera" size={16} color="#00D68F" />
                <Text style={styles.statusText}>Camera sharing is enabled for SOS</Text>
              </View>
            )}
          </View>

          <Text style={styles.contactsLabel}>
            ALERTING {pushContacts.length} OF {sosContacts.length} CONTACTS
          </Text>
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

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
            <Ionicons name="close-circle" size={22} color="#FF3B4E" />
            <Text style={styles.cancelText}>Cancel SOS</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Free Aura-to-Aura alerts use Expo push tokens instead of paid SMS.
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
  statusText: { color: "#fff", fontSize: 13, fontWeight: "500", flex: 1 },
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
  smsStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    width: "100%",
  },
  smsStatusText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
});
