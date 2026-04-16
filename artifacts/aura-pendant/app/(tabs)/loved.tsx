import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAppStore, Contact } from "@/store/appStore";

const AVATAR_COLORS = [
  "#E91E63", "#9C27B0", "#2196F3", "#4CAF50",
  "#FF9800", "#00BCD4", "#F44336", "#673AB7",
];

export default function LovedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts, addContact, removeContact, updateContact, alertBehavior, updateAlertBehavior } =
    useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
  };

  const handleMessage = (phone: string) => {
    Linking.openURL(`sms:${phone.replace(/\s/g, "")}`);
  };

  const handleRemove = (contact: Contact) => {
    Alert.alert(
      "Remove Contact",
      `Remove ${contact.name} from your emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeContact(contact.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  };

  const handleAdd = () => {
    if (!newName.trim() || !newPhone.trim()) return;
    const initials = newName
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    addContact({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      relation: newRelation.trim() || "Contact",
      phone: newPhone.trim(),
      initials,
      avatarColor: color,
      sosEnabled: true,
    });
    setShowAddModal(false);
    setNewName("");
    setNewRelation("");
    setNewPhone("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const behaviorItems = [
    { key: "broadcastGPS", icon: "location", label: "Broadcast GPS location with SOS" },
    { key: "shareLiveCamera", icon: "camera", label: "Share live camera in SOS alert" },
    { key: "notifyLowBattery", icon: "battery-dead", label: "Notify contacts on low battery" },
    { key: "notifyDisconnect", icon: "wifi-outline", label: "Notify when pendant disconnects" },
    { key: "dailyCheckin", icon: "time", label: "Daily check-in at 6:00 PM" },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 100 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Loved Ones</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {contacts.map((contact) => (
          <View
            key={contact.id}
            style={[
              styles.contactCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.contactHeader}>
              <View style={[styles.avatar, { backgroundColor: contact.avatarColor }]}>
                <Text style={styles.avatarText}>{contact.initials}</Text>
              </View>
              <View style={styles.contactInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.contactName, { color: colors.foreground }]}>
                    {contact.name}
                  </Text>
                  {contact.sosEnabled && (
                    <View style={[styles.sosBadge, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
                      <Text style={[styles.sosBadgeText, { color: colors.success }]}>SOS</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.contactMeta, { color: colors.mutedForeground }]}>
                  {contact.relation} · {contact.phone}
                </Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  onPress={() => handleMessage(contact.phone)}
                  style={[styles.actionBtn, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}40` }]}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCall(contact.phone)}
                  style={[styles.actionBtn, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}40` }]}
                >
                  <Ionicons name="call-outline" size={16} color={colors.success} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.contactFooter, { borderTopColor: colors.border }]}>
              <View style={styles.toggleRow}>
                <Switch
                  value={contact.sosEnabled}
                  onValueChange={(val) => {
                    updateContact(contact.id, { sosEnabled: val });
                    Haptics.selectionAsync();
                  }}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={contact.sosEnabled ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
                  Receive SOS alerts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemove(contact)}
                style={[styles.removeBtn, { backgroundColor: `${colors.sos}15`, borderColor: `${colors.sos}40` }]}
              >
                <Ionicons name="trash-outline" size={14} color={colors.sos} />
                <Text style={[styles.removeBtnText, { color: colors.sos }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          ALERT BEHAVIOR
        </Text>

        <View style={[styles.behaviorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {behaviorItems.map((item, idx) => (
            <View key={item.key}>
              <View style={styles.behaviorItem}>
                <View style={styles.behaviorLeft}>
                  <Ionicons name={item.icon as any} size={16} color={colors.mutedForeground} />
                  <Text style={[styles.behaviorLabel, { color: colors.foreground }]}>
                    {item.label}
                  </Text>
                </View>
                <Switch
                  value={alertBehavior[item.key]}
                  onValueChange={(val) => {
                    updateAlertBehavior({ [item.key]: val });
                    Haptics.selectionAsync();
                  }}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={alertBehavior[item.key] ? colors.primary : colors.mutedForeground}
                />
              </View>
              {idx < behaviorItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {[
              { placeholder: "Full Name", value: newName, setter: setNewName },
              { placeholder: "Relation (e.g. Mom, Partner)", value: newRelation, setter: setNewRelation },
              { placeholder: "Phone Number", value: newPhone, setter: setNewPhone },
            ].map((field) => (
              <TextInput
                key={field.placeholder}
                placeholder={field.placeholder}
                placeholderTextColor={colors.mutedForeground}
                value={field.value}
                onChangeText={field.setter}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
            ))}

            <TouchableOpacity
              style={[styles.addConfirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Text style={styles.addConfirmText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: "800" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactName: { fontSize: 15, fontWeight: "700" },
  sosBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  sosBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  contactMeta: { fontSize: 12, marginTop: 2 },
  contactActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contactFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 12 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  removeBtnText: { fontSize: 12, fontWeight: "600" },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 8,
  },
  behaviorCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  behaviorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  behaviorLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  behaviorLabel: { fontSize: 13, flex: 1 },
  divider: { height: 1, marginHorizontal: 14 },
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
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  addConfirmBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
