import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  initials: string;
  avatarColor: string;
  sosEnabled: boolean;
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

  updateDevice: (updates: Partial<DeviceState>) => void;
  updateHealth: (updates: Partial<HealthData>) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: string) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
  markAlertRead: (id: string) => void;
  addMedia: (item: MediaItem) => void;
  toggleStarMedia: (id: string) => void;
  updateCameraSettings: (updates: Partial<CameraSettings>) => void;
  updatePrivacySettings: (updates: Partial<PrivacySettings>) => void;
  updateAlertBehavior: (updates: Partial<AlertBehavior>) => void;
  triggerSOS: () => void;
  cancelSOS: () => void;
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
    timestamp: "Apr 10, 12:20 PM",
    read: false,
  },
  {
    id: "2",
    type: "Health",
    title: "Heart rate normal",
    message: "72 BPM — all vitals stable",
    timestamp: "Apr 10, 11:55 AM",
    read: true,
  },
  {
    id: "3",
    type: "Camera",
    title: "Motion detected",
    message: "Camera triggered by motion at 10:30 AM",
    timestamp: "Apr 10, 10:30 AM",
    read: false,
  },
  {
    id: "4",
    type: "Device",
    title: "Battery low",
    message: "Pendant battery at 15% — please charge soon",
    timestamp: "Apr 9, 8:45 PM",
    read: true,
  },
  {
    id: "5",
    type: "Health",
    title: "Elevated heart rate",
    message: "Heart rate reached 112 BPM — monitor closely",
    timestamp: "Apr 9, 3:12 PM",
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
    (set) => ({
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

      updateDevice: (updates) =>
        set((state) => ({ device: { ...state.device, ...updates } })),
      updateHealth: (updates) =>
        set((state) => ({ health: { ...state.health, ...updates } })),
      addContact: (contact) =>
        set((state) => ({ contacts: [...state.contacts, contact] })),
      removeContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),
      updateContact: (id, updates) =>
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      dismissAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),
      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, read: true } : a
          ),
        })),
      addMedia: (item) =>
        set((state) => ({ media: [item, ...state.media] })),
      toggleStarMedia: (id) =>
        set((state) => ({
          media: state.media.map((m) =>
            m.id === id ? { ...m, starred: !m.starred } : m
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
      triggerSOS: () => set({ sosActive: true }),
      cancelSOS: () => set({ sosActive: false }),
    }),
    {
      name: "aura-pendant-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
