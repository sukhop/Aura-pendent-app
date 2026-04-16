import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";
import { SignalBars } from "@/components/SignalBars";

/**
 * Triggers biometric (FaceID / fingerprint) authentication.
 * Returns true if auth succeeded or if hardware/enrollment is unavailable
 * (so the toggle still works gracefully on simulators / web).
 */
async function authenticateBiometric(reason: string): Promise<boolean> {
  if (Platform.OS === "web") {
    Alert.alert(
      "Not Available",
      "Biometric lock is not available on web. This would work on iOS/Android."
    );
    return false;
  }
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert(
        "No Biometric Hardware",
        "Your device doesn't support biometric authentication."
      );
      return false;
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      Alert.alert(
        "No Biometrics Enrolled",
        "Please set up Face ID or fingerprint in your device settings first."
      );
      return false;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

const RESOLUTIONS = [
  "720p 30fps",
  "1080p 30fps",
  "1080p 60fps",
  "4K 30fps",
] as const;
type Resolution = (typeof RESOLUTIONS)[number];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    device,
    cameraSettings,
    privacySettings,
    profile,
    updateCameraSettings,
    updatePrivacySettings,
    updateDevice,
    updateProfile,
    media,
  } = useAppStore();
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editEmail, setEditEmail] = useState(profile.email);

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const storagePercent = (device.storageUsed / device.storageTotal) * 100;

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    const initials = editName
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    updateProfile({ name: editName.trim(), email: editEmail.trim(), initials });
    setShowEditProfile(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFormatStorage = () => {
    Alert.alert(
      "Format Device Storage",
      "This will permanently delete all local media files. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Format",
          style: "destructive",
          onPress: () => {
            updateDevice({ storageUsed: 0.1 });
            Alert.alert("✅ Storage Formatted", "All local media has been cleared.");
          },
        },
      ]
    );
  };

  const handleCheckUpdates = () => {
    Alert.alert("Checking for Updates", "Searching for firmware updates...", [
      { text: "OK" },
    ]);
    setTimeout(() => {
      Alert.alert(
        "✅ Up to Date",
        `Firmware ${device.firmwareVersion} is the latest version.`
      );
    }, 1500);
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Settings
        </Text>

        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {profile.name}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
              {profile.email}
            </Text>
            <View
              style={[
                styles.proBadge,
                {
                  backgroundColor: `${colors.primary}25`,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.proBadgeText, { color: colors.primary }]}>
                PRO PLAN
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.editBtn,
              { borderColor: colors.border, backgroundColor: `${colors.primary}10` },
            ]}
            onPress={() => {
              setEditName(profile.name);
              setEditEmail(profile.email);
              setShowEditProfile(true);
            }}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Device Section */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          DEVICE
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <SettingRow
            icon="hardware-chip"
            iconColor={colors.primary}
            label="Device Name"
            value={device.deviceName}
            colors={colors}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="information-circle"
            iconColor={colors.info}
            label="Firmware"
            sublabel="Latest version installed"
            value={device.firmwareVersion}
            valueColor={colors.success}
            colors={colors}
          />
          <Divider colors={colors} />

          {/* Signal strength row */}
          <View style={styles.row}>
            <View style={[styles.iconBg, { backgroundColor: `${colors.info}20` }]}>
              <Ionicons name="wifi" size={18} color={colors.info} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Signal Strength
              </Text>
              <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>
                {device.connected ? "Connected" : "Disconnected"}
              </Text>
            </View>
            <View style={styles.signalRow}>
              <SignalBars strength={device.signalStrength} />
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                {device.signalStrength}%
              </Text>
            </View>
          </View>
          <Divider colors={colors} />

          {/* Storage row */}
          <View style={styles.row}>
            <View style={[styles.iconBg, { backgroundColor: `${colors.warning}20` }]}>
              <Ionicons name="server" size={18} color={colors.warning} />
            </View>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Storage
              </Text>
              <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>
                {(device.storageTotal - device.storageUsed).toFixed(1)} GB free
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.foreground }]}>
              {device.storageUsed} / {device.storageTotal} GB
            </Text>
          </View>
          <View style={styles.storagePill}>
            <View
              style={[
                styles.storageFill,
                { width: `${storagePercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>

          <Divider colors={colors} />
          <TouchableRow
            icon="refresh"
            iconColor={colors.success}
            label="Check for Updates"
            sublabel="Firmware is up to date"
            onPress={handleCheckUpdates}
            colors={colors}
          />
          <Divider colors={colors} />
          <TouchableRow
            icon="trash"
            iconColor={colors.sos}
            label="Format Device Storage"
            sublabel="Clears all local media files"
            labelColor={colors.sos}
            onPress={handleFormatStorage}
            colors={colors}
          />
        </View>

        {/* Camera & Recording */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          CAMERA & RECORDING
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowResolutionPicker(!showResolutionPicker)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBg, { backgroundColor: `${colors.sos}20` }]}>
              <Ionicons name="camera" size={18} color={colors.sos} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Video Resolution
            </Text>
            <View
              style={[
                styles.dropdownBtn,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.dropdownText, { color: colors.foreground }]}>
                {cameraSettings.resolution}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.mutedForeground}
              />
            </View>
          </TouchableOpacity>

          {showResolutionPicker && (
            <View
              style={[
                styles.picker,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                },
              ]}
            >
              {RESOLUTIONS.map((res) => (
                <TouchableOpacity
                  key={res}
                  style={[
                    styles.pickerItem,
                    res === cameraSettings.resolution && {
                      backgroundColor: `${colors.primary}20`,
                    },
                  ]}
                  onPress={() => {
                    updateCameraSettings({ resolution: res as Resolution });
                    setShowResolutionPicker(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      {
                        color:
                          res === cameraSettings.resolution
                            ? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {res}
                  </Text>
                  {res === cameraSettings.resolution && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Divider colors={colors} />
          <ToggleRow
            icon="flash"
            iconColor={colors.warning}
            label="Flash / Torch"
            sublabel="Use camera flash while shooting"
            value={cameraSettings.flashEnabled}
            onToggle={() => {
              updateCameraSettings({
                flashEnabled: !cameraSettings.flashEnabled,
              });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="mic"
            iconColor={colors.primary}
            label="Audio Recording"
            sublabel="Capture audio with videos"
            value={cameraSettings.audioEnabled}
            onToggle={() => {
              updateCameraSettings({
                audioEnabled: !cameraSettings.audioEnabled,
              });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="moon"
            iconColor="#7C6FFF"
            label="Night Mode"
            sublabel="Enhanced low-light processing"
            value={cameraSettings.nightModeEnabled}
            onToggle={() => {
              updateCameraSettings({
                nightModeEnabled: !cameraSettings.nightModeEnabled,
              });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="camera"
            iconColor={colors.success}
            label="Auto-capture on Motion"
            sublabel="Takes photo when motion detected"
            value={cameraSettings.autoCapture}
            onToggle={() => {
              updateCameraSettings({ autoCapture: !cameraSettings.autoCapture });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
        </View>

        {/* Privacy & Security */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PRIVACY & SECURITY
        </Text>

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ToggleRow
            icon="shield-checkmark"
            iconColor={colors.success}
            label="End-to-end Encryption"
            sublabel="All data encrypted in transit"
            value={privacySettings.e2eEncryption}
            onToggle={() => {
              updatePrivacySettings({
                e2eEncryption: !privacySettings.e2eEncryption,
              });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="finger-print"
            iconColor={colors.primary}
            label="Biometric App Lock"
            sublabel={
              Platform.OS !== "web"
                ? privacySettings.biometricLock
                  ? "Enabled — Face ID / Fingerprint"
                  : "Tap to enable Face ID / Fingerprint lock"
                : "Not available on web — tap to preview"
            }
            value={privacySettings.biometricLock}
            onToggle={async () => {
              const action = privacySettings.biometricLock ? "disable" : "enable";
              const reason =
                action === "enable"
                  ? "Authenticate to enable Biometric App Lock"
                  : "Authenticate to disable Biometric App Lock";
              const ok = await authenticateBiometric(reason);
              if (ok) {
                updatePrivacySettings({
                  biometricLock: !privacySettings.biometricLock,
                });
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } else if (Platform.OS !== "web") {
                // Auth failed — do nothing, toggle stays as-is
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
              }
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <ToggleRow
            icon="location"
            iconColor={colors.info}
            label="Location Sharing"
            sublabel="Share GPS during SOS events"
            value={privacySettings.locationSharing}
            onToggle={() => {
              updatePrivacySettings({
                locationSharing: !privacySettings.locationSharing,
              });
              Haptics.selectionAsync();
            }}
            colors={colors}
          />
          <Divider colors={colors} />
          <TouchableRow
            icon="nuclear"
            iconColor={colors.sos}
            label="Remote Device Wipe"
            sublabel="Erase all data remotely"
            labelColor={colors.sos}
            onPress={() =>
              Alert.alert(
                "Remote Wipe",
                "Are you sure? This will permanently erase all data on your pendant.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Wipe", style: "destructive" },
                ]
              )
            }
            colors={colors}
          />
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.mutedForeground }]}>
            Aura Pendant Pro · v2.4.1
          </Text>
          <Text style={[styles.appInfoText, { color: colors.mutedForeground }]}>
            {media.length} media · {device.storageUsed} GB used
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Edit Profile
              </Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Avatar preview */}
            <View style={styles.modalAvatarRow}>
              <View
                style={[
                  styles.modalAvatar,
                  { backgroundColor: profile.avatarColor },
                ]}
              >
                <Text style={styles.modalAvatarText}>
                  {editName
                    .split(" ")
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "?"}
                </Text>
              </View>
            </View>

            <TextInput
              placeholder="Full Name"
              placeholderTextColor={colors.mutedForeground}
              value={editName}
              onChangeText={setEditName}
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor={colors.mutedForeground}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Divider({ colors }: { colors: any }) {
  return (
    <View
      style={[
        { height: 1, backgroundColor: colors.border, marginHorizontal: 14 },
      ]}
    />
  );
}

function SettingRow({ icon, iconColor, label, sublabel, value, valueColor, colors }: any) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {value && (
        <Text
          style={[
            styles.rowValue,
            { color: valueColor || colors.mutedForeground },
          ]}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function TouchableRow({ icon, iconColor, label, sublabel, labelColor, onPress, colors }: any) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[styles.rowLabel, { color: labelColor || colors.foreground }]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>
            {sublabel}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, iconColor, label, sublabel, value, onToggle, colors }: any) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>
            {sublabel}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: `${colors.primary}80` }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  pageTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileEmail: { fontSize: 12 },
  proBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  proBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 8,
  },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    minHeight: 56,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowSublabel: { fontSize: 11, marginTop: 2 },
  rowValue: { fontSize: 13, fontWeight: "500" },
  signalRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  storagePill: {
    marginHorizontal: 14,
    marginBottom: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  storageFill: { height: 4, borderRadius: 2 },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 12, fontWeight: "600" },
  picker: {
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pickerText: { fontSize: 13, fontWeight: "600" },
  appInfo: { alignItems: "center", gap: 4, paddingVertical: 8 },
  appInfoText: { fontSize: 12 },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalAvatarRow: { alignItems: "center" },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
