import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAppStore } from "@/store/appStore";

const RESOLUTIONS = ["720p 30fps", "1080p 30fps", "1080p 60fps", "4K 30fps"] as const;
type Resolution = typeof RESOLUTIONS[number];

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { device, cameraSettings, privacySettings, updateCameraSettings, updatePrivacySettings, updateDevice, media } =
    useAppStore();
  const [showResolutionPicker, setShowResolutionPicker] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const storagePercent = (device.storageUsed / device.storageTotal) * 100;

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
    Alert.alert(
      "Checking for Updates",
      "Searching for firmware updates...",
      [{ text: "OK" }]
    );
    setTimeout(() => {
      Alert.alert("✅ Up to Date", `Firmware ${device.firmwareVersion} is the latest version.`);
    }, 1500);
  };

  const handleEditProfile = () => {
    Alert.alert(
      "Edit Profile",
      "Profile editing is not available in this demo.",
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>John Doe</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
            john.doe@example.com
          </Text>
          <View style={[styles.proBadge, { backgroundColor: `${colors.primary}25`, borderColor: colors.primary }]}>
            <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO PLAN</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.editBtn, { borderColor: colors.border }]} onPress={handleEditProfile}>
          <Ionicons name="pencil" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DEVICE</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="hardware-chip" iconColor={colors.primary} label="Device Name" value={device.deviceName} colors={colors} />
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

        <View style={styles.row}>
          <View style={[styles.iconBg, { backgroundColor: `${colors.warning}20` }]}>
            <Ionicons name="server" size={18} color={colors.warning} />
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Storage</Text>
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
              {
                width: `${storagePercent}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <Divider colors={colors} />
        <TouchableRow icon="refresh" iconColor={colors.success} label="Check for Updates" sublabel="Firmware is up to date" onPress={handleCheckUpdates} colors={colors} />
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

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CAMERA & RECORDING</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowResolutionPicker(!showResolutionPicker)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBg, { backgroundColor: `${colors.sos}20` }]}>
            <Ionicons name="camera" size={18} color={colors.sos} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.foreground }]}>Video Resolution</Text>
          <View style={[styles.dropdownBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.dropdownText, { color: colors.foreground }]}>
              {cameraSettings.resolution}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        {showResolutionPicker && (
          <View style={[styles.picker, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            {RESOLUTIONS.map((res) => (
              <TouchableOpacity
                key={res}
                style={[
                  styles.pickerItem,
                  res === cameraSettings.resolution && { backgroundColor: `${colors.primary}20` },
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
                        res === cameraSettings.resolution ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {res}
                </Text>
                {res === cameraSettings.resolution && (
                  <Ionicons name="checkmark" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Divider colors={colors} />
        <ToggleRow icon="flash" iconColor={colors.warning} label="Flash / Torch" sublabel="Use camera flash while shooting" value={cameraSettings.flashEnabled} onToggle={() => { updateCameraSettings({ flashEnabled: !cameraSettings.flashEnabled }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <ToggleRow icon="mic" iconColor={colors.primary} label="Audio Recording" sublabel="Capture audio with videos" value={cameraSettings.audioEnabled} onToggle={() => { updateCameraSettings({ audioEnabled: !cameraSettings.audioEnabled }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <ToggleRow icon="moon" iconColor="#7C6FFF" label="Night Mode" sublabel="Enhanced low-light processing" value={cameraSettings.nightModeEnabled} onToggle={() => { updateCameraSettings({ nightModeEnabled: !cameraSettings.nightModeEnabled }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <ToggleRow icon="camera" iconColor={colors.success} label="Auto-capture on Motion" sublabel="Takes photo when motion detected" value={cameraSettings.autoCapture} onToggle={() => { updateCameraSettings({ autoCapture: !cameraSettings.autoCapture }); Haptics.selectionAsync(); }} colors={colors} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PRIVACY & SECURITY</Text>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ToggleRow icon="shield-checkmark" iconColor={colors.success} label="End-to-end Encryption" sublabel="All data encrypted in transit" value={privacySettings.e2eEncryption} onToggle={() => { updatePrivacySettings({ e2eEncryption: !privacySettings.e2eEncryption }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <ToggleRow icon="finger-print" iconColor={colors.primary} label="Biometric App Lock" sublabel={Platform.OS !== "web" ? "FaceID / Fingerprint" : "Not available on web"} value={privacySettings.biometricLock} onToggle={() => { updatePrivacySettings({ biometricLock: !privacySettings.biometricLock }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <ToggleRow icon="location" iconColor={colors.info} label="Location Sharing" sublabel="Share GPS during SOS events" value={privacySettings.locationSharing} onToggle={() => { updatePrivacySettings({ locationSharing: !privacySettings.locationSharing }); Haptics.selectionAsync(); }} colors={colors} />
        <Divider colors={colors} />
        <TouchableRow icon="nuclear" iconColor={colors.sos} label="Remote Device Wipe" sublabel="Erase all data remotely" labelColor={colors.sos} onPress={() => Alert.alert("Remote Wipe", "Are you sure? This will permanently erase all data on your pendant.", [{ text: "Cancel", style: "cancel" }, { text: "Wipe", style: "destructive" }])} colors={colors} />
      </View>
    </ScrollView>
  );
}

function Divider({ colors }: { colors: any }) {
  return <View style={[{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }]} />;
}

function SettingRow({ icon, iconColor, label, sublabel, value, valueColor, colors }: any) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBg, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
      </View>
      {value && <Text style={[styles.rowValue, { color: valueColor || colors.mutedForeground }]}>{value}</Text>}
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
        <Text style={[styles.rowLabel, { color: labelColor || colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
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
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {sublabel && <Text style={[styles.rowSublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
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
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 3 },
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
    width: 34,
    height: 34,
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
});
