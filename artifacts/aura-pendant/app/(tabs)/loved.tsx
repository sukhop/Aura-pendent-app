import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
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
import * as Contacts from "expo-contacts";
import { useColors } from "@/hooks/useColors";
import { useAppStore, Contact } from "@/store/appStore";

const AVATAR_COLORS = [
  "#E91E63",
  "#9C27B0",
  "#2196F3",
  "#4CAF50",
  "#FF9800",
  "#00BCD4",
  "#F44336",
  "#673AB7",
];

interface DeviceContact {
  id: string;
  name: string;
  phone: string;
}

function timeAgo(ts?: string): string | null {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function ContactPickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (contact: DeviceContact) => void;
}) {
  const colors = useColors();
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const loadContacts = useCallback(async () => {
    if (Platform.OS === "web") {
      setPermissionDenied(true);
      return;
    }

    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });

      const mapped = data.flatMap((contact) => {
        if (!contact.name || !contact.phoneNumbers?.[0]?.number) return [];
        return [
          {
            id: contact.id ?? Math.random().toString(),
            name: contact.name,
            phone: contact.phoneNumbers[0].number,
          },
        ];
      });

      setDeviceContacts(mapped);
    } catch {
      setPermissionDenied(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (visible) {
      setQuery("");
      setPermissionDenied(false);
      void loadContacts();
    }
  }, [loadContacts, visible]);

  const filtered = deviceContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.phone.includes(query)
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={pickerStyles.header}>
            <Text style={[pickerStyles.title, { color: colors.foreground }]}>Choose from Contacts</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              pickerStyles.searchBar,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              placeholder="Search name or number..."
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              style={[pickerStyles.searchInput, { color: colors.foreground }]}
            />
          </View>

          {loading ? (
            <View style={pickerStyles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : permissionDenied ? (
            <View style={pickerStyles.center}>
              <Ionicons name="people-outline" size={40} color={colors.mutedForeground} />
              <Text style={[pickerStyles.hint, { color: colors.foreground }]}>Contacts access unavailable</Text>
              <Text style={[pickerStyles.subhint, { color: colors.mutedForeground }]}>
                {Platform.OS === "web"
                  ? "Use manual entry on web."
                  : "Grant contacts access in Settings or add manually."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[pickerStyles.contactRow, { borderBottomColor: colors.border }]}
                  onPress={() => onPick(item)}
                >
                  <View
                    style={[
                      pickerStyles.contactAvatar,
                      { backgroundColor: `${colors.primary}25`, borderColor: `${colors.primary}40` },
                    ]}
                  >
                    <Text style={[pickerStyles.contactInitials, { color: colors.primary }]}>
                      {item.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={pickerStyles.contactText}>
                    <Text style={[pickerStyles.contactName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[pickerStyles.contactPhone, { color: colors.mutedForeground }]}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function AddContactModal({
  visible,
  initialName,
  initialPhone,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialName: string;
  initialPhone: string;
  onClose: () => void;
  onSave: (contact: {
    name: string;
    relation: string;
    phone: string;
    color: string;
    sosEnabled: boolean;
    pushToken: string;
  }) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState(initialName);
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState(initialPhone);
  const [pushToken, setPushToken] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [sosEnabled, setSosEnabled] = useState(true);

  React.useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
  }, [initialName, initialPhone]);

  const initials =
    name
      .trim()
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing Fields", "Please enter both a name and phone number.");
      return;
    }

    onSave({
      name: name.trim(),
      relation: relation.trim() || "Contact",
      phone: phone.trim(),
      color: selectedColor,
      sosEnabled,
      pushToken: pushToken.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={addStyles.overlay}>
        <View style={[addStyles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={addStyles.header}>
            <Text style={[addStyles.title, { color: colors.foreground }]}>Add Contact</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.avatarRow}>
            <View style={[addStyles.avatar, { backgroundColor: selectedColor }]}>
              <Text style={addStyles.avatarText}>{initials}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={addStyles.colorPicker}>
              {AVATAR_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    addStyles.colorDot,
                    { backgroundColor: color },
                    selectedColor === color && addStyles.colorDotSelected,
                  ]}
                >
                  {selectedColor === color && <Ionicons name="checkmark" size={12} color="#fff" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Field label="Full Name *" value={name} onChangeText={setName} colors={colors} />
          <Field label="Relation" value={relation} onChangeText={setRelation} colors={colors} />
          <Field label="Phone Number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" colors={colors} />
          <Field
            label="Aura Push Token (optional)"
            value={pushToken}
            onChangeText={setPushToken}
            multiline
            colors={colors}
          />

          <View
            style={[
              addStyles.sosRow,
              {
                backgroundColor: sosEnabled ? `${colors.success}12` : colors.muted,
                borderColor: sosEnabled ? `${colors.success}40` : colors.border,
              },
            ]}
          >
            <View style={addStyles.sosLeft}>
              <Ionicons
                name="notifications"
                size={18}
                color={sosEnabled ? colors.success : colors.mutedForeground}
              />
              <View>
                <Text style={[addStyles.sosLabel, { color: colors.foreground }]}>Receive free Aura SOS alerts</Text>
                <Text style={[addStyles.sosSub, { color: colors.mutedForeground }]}>
                  Works when this contact has the Aura app and shares a push token
                </Text>
              </View>
            </View>
            <Switch
              value={sosEnabled}
              onValueChange={setSosEnabled}
              trackColor={{ false: colors.border, true: `${colors.success}80` }}
              thumbColor={sosEnabled ? colors.success : colors.mutedForeground}
            />
          </View>

          <TouchableOpacity
            style={[addStyles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={addStyles.saveBtnText}>Add to Loved Ones</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ReturnType<typeof useColors>;
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={[addStyles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        placeholder={label.replace(" *", "")}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[
          addStyles.input,
          multiline && addStyles.multilineInput,
          { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground },
        ]}
      />
    </View>
  );
}

export default function LovedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts, addContact, removeContact, updateContact, alertBehavior, updateAlertBehavior, profile } =
    useAppStore();

  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefillName, setPrefillName] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const auraReadyContacts = contacts.filter((contact) => contact.sosEnabled && contact.pushToken).length;

  const handleAddPress = () => {
    Alert.alert("Add Emergency Contact", "How would you like to add?", [
      { text: "Choose from Contacts", onPress: () => setShowPickerModal(true) },
      {
        text: "Add Manually",
        onPress: () => {
          setPrefillName("");
          setPrefillPhone("");
          setShowAddModal(true);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePickContact = (contact: DeviceContact) => {
    setShowPickerModal(false);
    setPrefillName(contact.name);
    setPrefillPhone(contact.phone);
    setTimeout(() => setShowAddModal(true), 250);
  };

  const handleSaveContact = (contact: {
    name: string;
    relation: string;
    phone: string;
    color: string;
    sosEnabled: boolean;
    pushToken: string;
  }) => {
    const initials = contact.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    addContact({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
      pushToken: contact.pushToken || undefined,
      initials,
      avatarColor: contact.color,
      sosEnabled: contact.sosEnabled,
    });

    setShowAddModal(false);
    setPrefillName("");
    setPrefillPhone("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemove = (contact: Contact) => {
    Alert.alert("Remove Contact", `Remove ${contact.name} from your emergency contacts?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          removeContact(contact.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  };

  const handleShareMyToken = async () => {
    if (!profile.pushToken) {
      Alert.alert(
        "Push Token Not Ready",
        "Open the app on a real device, allow notifications, and Aura will generate your free push token."
      );
      return;
    }

    await Share.share({
      message: `My Aura push token:\n\n${profile.pushToken}\n\nSave this in Aura so I can receive free SOS alerts.`,
    });
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
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Loved Ones</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {auraReadyContacts} of {contacts.length} are ready for free push SOS alerts
            </Text>
          </View>
          <TouchableOpacity onPress={handleAddPress} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="person-add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30` }]}>
          <Ionicons name="notifications" size={16} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Free SOS alerts work through Aura push notifications. Each loved one needs the Aura app and their own Aura push token saved here.
          </Text>
        </View>

        <View style={[styles.tokenCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tokenHeader}>
            <View style={styles.tokenTitleWrap}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
              <Text style={[styles.tokenTitle, { color: colors.foreground }]}>This device's Aura push token</Text>
            </View>
            <TouchableOpacity
              style={[styles.tokenAction, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` }]}
              onPress={handleShareMyToken}
            >
              <Ionicons name="share-social-outline" size={14} color={colors.primary} />
              <Text style={[styles.tokenActionText, { color: colors.primary }]}>Share</Text>
            </TouchableOpacity>
          </View>
          <Text selectable style={[styles.tokenValue, { color: colors.mutedForeground }]}>
            {profile.pushToken ?? "Not available yet. Notifications must be allowed on a real device."}
          </Text>
        </View>

        {contacts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No contacts yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Add trusted contacts and save their Aura push tokens for free emergency alerts.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => {
            const lastNotified = timeAgo(contact.notifiedAt);
            const pushReady = !!contact.pushToken;

            return (
              <View
                key={contact.id}
                style={[
                  styles.contactCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: contact.sosEnabled ? `${colors.success}30` : colors.border,
                  },
                ]}
              >
                <View style={styles.contactHeader}>
                  <View style={[styles.avatar, { backgroundColor: contact.avatarColor }]}>
                    <Text style={styles.avatarText}>{contact.initials}</Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.contactName, { color: colors.foreground }]}>{contact.name}</Text>
                      {contact.sosEnabled && (
                        <View style={[styles.sosBadge, { backgroundColor: `${colors.success}20`, borderColor: colors.success }]}>
                          <View style={[styles.sosActiveDot, { backgroundColor: colors.success }]} />
                          <Text style={[styles.sosBadgeText, { color: colors.success }]}>SOS</Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.pushBadge,
                          {
                            backgroundColor: pushReady ? `${colors.primary}20` : `${colors.warning}16`,
                            borderColor: pushReady ? `${colors.primary}40` : `${colors.warning}40`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={pushReady ? "notifications" : "warning-outline"}
                          size={11}
                          color={pushReady ? colors.primary : colors.warning}
                        />
                        <Text style={[styles.pushBadgeText, { color: pushReady ? colors.primary : colors.warning }]}>
                          {pushReady ? "Push Ready" : "No Token"}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.contactMeta, { color: colors.mutedForeground }]}>
                      {contact.relation} - {contact.phone}
                    </Text>
                    {pushReady && (
                      <Text selectable style={[styles.tokenPreview, { color: colors.mutedForeground }]}>
                        {contact.pushToken}
                      </Text>
                    )}
                    {lastNotified && (
                      <View style={styles.notifiedRow}>
                        <Ionicons name="checkmark-circle" size={11} color={colors.success} />
                        <Text style={[styles.notifiedText, { color: colors.success }]}>Notified {lastNotified}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${contact.phone.replace(/\s/g, "")}`)}
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
                      onValueChange={(value) => updateContact(contact.id, { sosEnabled: value })}
                      trackColor={{ false: colors.border, true: `${colors.success}80` }}
                      thumbColor={contact.sosEnabled ? colors.success : colors.mutedForeground}
                    />
                    <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
                      {contact.sosEnabled ? "Will receive Aura SOS alerts" : "Aura SOS alerts disabled"}
                    </Text>
                  </View>
                  <View style={styles.footerActions}>
                    <TouchableOpacity
                      onPress={() =>
                        Alert.prompt?.(
                          "Update Aura Push Token",
                          "Paste this contact's Aura push token.",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Save",
                              onPress: (value?: string) =>
                                updateContact(contact.id, { pushToken: value?.trim() || undefined }),
                            },
                          ],
                          "plain-text",
                          contact.pushToken ?? ""
                        ) ??
                        Alert.alert(
                          "Update Aura Push Token",
                          "Use Add Contact on mobile to save a push token. On platforms without prompt support, edit this contact in a future pass."
                        )
                      }
                      style={[styles.editBtn, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` }]}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.primary} />
                      <Text style={[styles.editBtnText, { color: colors.primary }]}>Token</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemove(contact)}
                      style={[styles.removeBtn, { backgroundColor: `${colors.sos}15`, borderColor: `${colors.sos}40` }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.sos} />
                      <Text style={[styles.removeBtnText, { color: colors.sos }]}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ALERT BEHAVIOR</Text>

        <View style={[styles.behaviorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {behaviorItems.map((item, index) => (
            <View key={item.key}>
              <View style={styles.behaviorItem}>
                <View style={styles.behaviorLeft}>
                  <Ionicons name={item.icon as never} size={16} color={colors.mutedForeground} />
                  <Text style={[styles.behaviorLabel, { color: colors.foreground }]}>{item.label}</Text>
                </View>
                <Switch
                  value={alertBehavior[item.key]}
                  onValueChange={(value) => updateAlertBehavior({ [item.key]: value })}
                  trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                  thumbColor={alertBehavior[item.key] ? colors.primary : colors.mutedForeground}
                />
              </View>
              {index < behaviorItems.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <ContactPickerModal
        visible={showPickerModal}
        onClose={() => setShowPickerModal(false)}
        onPick={handlePickContact}
      />

      <AddContactModal
        visible={showAddModal}
        initialName={prefillName}
        initialPhone={prefillPhone}
        onClose={() => {
          setShowAddModal(false);
          setPrefillName("");
          setPrefillPhone("");
        }}
        onSave={handleSaveContact}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: { fontSize: 28, fontWeight: "800" },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
  tokenCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  tokenHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  tokenTitleWrap: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tokenTitle: { fontSize: 14, fontWeight: "700" },
  tokenAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  tokenActionText: { fontSize: 12, fontWeight: "700" },
  tokenValue: { fontSize: 12, lineHeight: 18 },
  emptyCard: {
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  contactCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  contactHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  contactInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  contactName: { fontSize: 15, fontWeight: "700" },
  sosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  sosActiveDot: { width: 5, height: 5, borderRadius: 3 },
  sosBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pushBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  pushBadgeText: { fontSize: 9, fontWeight: "800" },
  contactMeta: { fontSize: 12, marginTop: 2 },
  tokenPreview: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  notifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  notifiedText: { fontSize: 11, fontWeight: "600" },
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleLabel: { fontSize: 12, flex: 1 },
  footerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtnText: { fontSize: 12, fontWeight: "600" },
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
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.75)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 0,
  },
  title: { fontSize: 17, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  center: { alignItems: "center", padding: 40, gap: 12 },
  hint: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  subhint: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: { fontSize: 14, fontWeight: "700" },
  contactText: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "600" },
  contactPhone: { fontSize: 12, marginTop: 1 },
});

const addStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.75)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  colorPicker: { flexDirection: "row", gap: 10, alignItems: "center" },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSelected: { borderWidth: 2, borderColor: "rgba(255,255,255,0.8)" },
  fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  multilineInput: { minHeight: 74, textAlignVertical: "top" },
  sosRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sosLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sosLabel: { fontSize: 14, fontWeight: "600" },
  sosSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
