import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  pushToken?: string;
  initials: string;
  avatarColor: string;
  sosEnabled: boolean;
  notifiedAt?: string;
}

export interface Alert {
  id: string;
  type: "SOS" | "Health" | "Device" | "Camera";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MediaItem {
  id: string;
  type: "photo" | "video";
  uri: string;
  timestamp: string;
  starred: boolean;
  size: number;
}

export interface DeviceState {
  connected: boolean;
  batteryLevel: number;
  batteryCharging: boolean;
  storageUsed: number;
  storageTotal: number;
  firmwareVersion: string;
  deviceName: string;
  networkStatus: "secure" | "unsecure" | "offline";
  signalStrength: number;
}

export interface HealthData {
  heartRate: number;
  temperature: number;
  heartRateHistory: number[];
  status: "Normal" | "Elevated" | "Low" | "Critical";
}

export interface CameraSettings {
  resolution: "720p 30fps" | "1080p 30fps" | "1080p 60fps" | "4K 30fps";
  flashEnabled: boolean;
  audioEnabled: boolean;
  nightModeEnabled: boolean;
  autoCapture: boolean;
}

export interface PrivacySettings {
  e2eEncryption: boolean;
  biometricLock: boolean;
  locationSharing: boolean;
}

export interface AlertBehavior {
  broadcastGPS: boolean;
  shareLiveCamera: boolean;
  notifyLowBattery: boolean;
  notifyDisconnect: boolean;
  dailyCheckin: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
  pushToken?: string;
}

interface AppState {
  device: DeviceState;
  health: HealthData;
  contacts: Contact[];
  alerts: Alert[];
  media: MediaItem[];
  cameraSettings: CameraSettings;
  privacySettings: PrivacySettings;
  alertBehavior: AlertBehavior;
  sosActive: boolean;
  sosMuted: boolean;
  sosLocation: { lat: number; lng: number } | null;
  profile: UserProfile;
  batteryAlertSent: boolean;

  updateDevice: (updates: Partial<DeviceState>) => void;
  updateHealth: (updates: Partial<HealthData>) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  addMedia: (item: MediaItem) => void;
  deleteMedia: (id: string) => void;
  clearAllMedia: () => void;
  toggleStarMedia: (id: string) => void;
  updateCameraSettings: (updates: Partial<CameraSettings>) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  updateAlertBehavior: (updates: Partial<AlertBehavior>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  triggerSOS: () => void;
  cancelSOS: () => void;
  setSOSMuted: (muted: boolean) => void;
  setSOSLocation: (location: { lat: number; lng: number } | null) => void;
  disconnectDevice: () => void;
  setBatteryAlertSent: (val: boolean) => void;
}

const defaultContacts: Contact[] = [
  {
    id: "1",
    name: "Priya Sharma",
    relation: "Mom",
    phone: "+91 98765 43210",
    initials: "PS",
    avatarColor: "#E91E63",
    sosEnabled: true,
  },
  {
    id: "2",
    name: "Rohan Mehta",
    relation: "Partner",
    phone: "+91 93456 78901",
    initials: "RM",
    avatarColor: "#9C27B0",
    sosEnabled: true,
  },
  {
    id: "3",
    name: "Anika Verma",
    relation: "Best friend",
    phone: "+91 87654 32109",
    initials: "AV",
    avatarColor: "#4CAF50",
    sosEnabled: true,
  },
  {
    id: "4",
    name: "Dr. Kapoor",
    relation: "Family doctor",
    phone: "+91 11234 56789",
    initials: "DK",
    avatarColor: "#2196F3",
    sosEnabled: false,
  },
];

const defaultAlerts: Alert[] = [
  {
    id: "1",
    type: "Device",
    title: "Aura Connected",
    message: "Pendant connected successfully",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "Health",
    title: "Heart rate normal",
    message: "72 BPM - all vitals stable",
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    read: true,
  },
  {
    id: "3",
    type: "Camera",
    title: "Motion detected",
    message: "Camera triggered by motion at 10:30 AM",
    timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    read: false,
  },
  {
    id: "4",
    type: "Device",
    title: "Battery low",
    message: "Pendant battery at 15% - please charge soon",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    read: true,
  },
  {
    id: "5",
    type: "Health",
    title: "Elevated heart rate",
    message: "Heart rate reached 112 BPM - monitor closely",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 33).toISOString(),
    read: true,
  },
];

const defaultMedia: MediaItem[] = [
  {
    id: "seed-1",
    type: "photo",
    uri: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    starred: true,
    size: 2.1,
  },
  {
    id: "seed-2",
    type: "video",
    uri: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    starred: false,
    size: 18.4,
  },
  {
    id: "seed-3",
    type: "photo",
    uri: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    starred: false,
    size: 1.8,
  },
  {
    id: "seed-4",
    type: "photo",
    uri: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    starred: true,
    size: 2.6,
  },
  {
    id: "seed-5",
    type: "video",
    uri: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    starred: false,
    size: 34.2,
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      device: {
        connected: true,
        batteryLevel: 84,
        batteryCharging: true,
        storageUsed: 8.3,
        storageTotal: 32,
        firmwareVersion: "v2.4.1",
        deviceName: "Aura Pendant Pro",
        networkStatus: "secure",
        signalStrength: 85,
      },
      health: {
        heartRate: 75,
        temperature: 36.3,
        heartRateHistory: [68, 70, 72, 74, 73, 75, 76, 74, 72, 75, 78, 76, 75],
        status: "Normal",
      },
      contacts: defaultContacts,
      alerts: defaultAlerts,
      media: defaultMedia,
      cameraSettings: {
        resolution: "1080p 60fps",
        flashEnabled: false,
        audioEnabled: true,
        nightModeEnabled: false,
        autoCapture: false,
      },
      privacySettings: {
        e2eEncryption: true,
        biometricLock: false,
        locationSharing: true,
      },
      alertBehavior: {
        broadcastGPS: true,
        shareLiveCamera: true,
        notifyLowBattery: true,
        notifyDisconnect: true,
        dailyCheckin: false,
      },
      sosActive: false,
      sosMuted: false,
      sosLocation: null,
      profile: {
        name: "John Doe",
        email: "john.doe@example.com",
        initials: "JD",
        avatarColor: "#7C6FFF",
      },
      batteryAlertSent: false,

      updateDevice: (updates) =>
        set((state) => ({ device: { ...state.device, ...updates } })),
      updateHealth: (updates) =>
        set((state) => ({ health: { ...state.health, ...updates } })),
      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),
      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        })),
      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id ? { ...contact, ...updates } : contact
          ),
        })),
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((alert) => alert.id !== id),
        })),
      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((alert) =>
            alert.id === id ? { ...alert, read: true } : alert
          ),
        })),
      markAllAlertsRead: () =>
        set((state) => ({
          alerts: state.alerts.map((alert) => ({ ...alert, read: true })),
        })),
      addMedia: (item) =>
        set((state) => ({ media: [item, ...state.media] })),
      deleteMedia: (id) =>
        set((state) => ({
          media: state.media.filter((item) => item.id !== id),
        })),
      clearAllMedia: () => set({ media: [] }),
      toggleStarMedia: (id) =>
        set((state) => ({
          media: state.media.map((item) =>
            item.id === id ? { ...item, starred: !item.starred } : item
          ),
        })),
      updateCameraSettings: (updates) =>
        set((state) => ({
          cameraSettings: { ...state.cameraSettings, ...updates },
        })),
      updatePrivacySettings: (updates) =>
        set((state) => ({
          privacySettings: { ...state.privacySettings, ...updates },
        })),
      updateAlertBehavior: (updates) =>
        set((state) => ({
          alertBehavior: { ...state.alertBehavior, ...updates },
        })),
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      triggerSOS: () => {
        const notifiedAt = new Date().toISOString();
        set((state) => ({
          sosActive: true,
          sosMuted: false,
          sosLocation: null,
          contacts: state.contacts.map((contact) =>
            contact.sosEnabled ? { ...contact, notifiedAt } : contact
          ),
        }));
        const state = get();
        state.addAlert({
          id: Date.now().toString(),
          type: "SOS",
          title: "SOS Activated",
          message: `Emergency mode activated for ${state.contacts.filter((contact) => contact.sosEnabled).length} contacts.`,
          timestamp: new Date().toISOString(),
          read: false,
        });
      },
      cancelSOS: () => set({ sosActive: false, sosMuted: false, sosLocation: null }),
      setSOSMuted: (muted) => set({ sosMuted: muted }),
      setSOSLocation: (location) => set({ sosLocation: location }),
      disconnectDevice: () => {
        set((state) => ({
          device: { ...state.device, connected: false },
        }));
        const state = get();
        if (state.alertBehavior.notifyDisconnect) {
          state.addAlert({
            id: Date.now().toString(),
            type: "Device",
            title: "Pendant Disconnected",
            message: "Your Aura Pendant has lost connection. Check Bluetooth.",
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      },
      setBatteryAlertSent: (val) => set({ batteryAlertSent: val }),
    }),
    {
      name: "aura-pendant-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
