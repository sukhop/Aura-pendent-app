import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAppStore, MediaItem } from "@/store/appStore";
import { BatteryIndicator } from "@/components/BatteryIndicator";

type Tab = "all" | "photos" | "videos" | "starred";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "starred", label: "Starred" },
];

const ITEM_SIZE = (Dimensions.get("window").width - 32 - 8) / 3;

export default function GalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { media, toggleStarMedia, device } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;
  const bottomPadding = isWeb ? 34 : 0;

  const filtered = media.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab === "photos") return m.type === "photo";
    if (activeTab === "videos") return m.type === "video";
    if (activeTab === "starred") return m.starred;
    return true;
  });

  const storagePercent = (device.storageUsed / device.storageTotal) * 100;

  const renderItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={[
        styles.mediaItem,
        { backgroundColor: colors.card, width: ITEM_SIZE, height: ITEM_SIZE },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.mediaPlaceholder}>
        <Ionicons
          name={item.type === "photo" ? "camera" : "videocam"}
          size={24}
          color={colors.mutedForeground}
        />
      </View>
      <TouchableOpacity
        style={styles.starBtn}
        onPress={() => toggleStarMedia(item.id)}
      >
        <Ionicons
          name={item.starred ? "star" : "star-outline"}
          size={14}
          color={item.starred ? colors.warning : "rgba(255,255,255,0.5)"}
        />
      </TouchableOpacity>
      {item.type === "video" && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={8} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Gallery</Text>
        <TouchableOpacity
          style={[styles.cloudBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="cloud-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.tab,
              activeTab === tab.id && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.8}
          >
            {tab.id === "starred" && (
              <Ionicons
                name="star"
                size={12}
                color={activeTab === tab.id ? "#fff" : colors.warning}
              />
            )}
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.id ? "#fff" : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIconBg,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="camera-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No media yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Use the camera to capture photos and videos.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPadding + 100 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={[
          styles.storageBar,
          { backgroundColor: colors.card, borderColor: colors.border, marginBottom: bottomPadding + 90 },
        ]}
      >
        <View style={styles.storageHeader}>
          <Text style={[styles.storageCount, { color: colors.mutedForeground }]}>
            {media.filter((m) => m.type === "photo").length} PHOTOS ·{" "}
            {media.filter((m) => m.type === "video").length} VIDEOS
          </Text>
          <Text style={[styles.storageUsed, { color: colors.primary }]}>
            {device.storageUsed} GB used
          </Text>
        </View>
        <BatteryIndicator
          level={storagePercent}
          width={undefined}
          height={4}
        />
        <Text style={[styles.storageDetail, { color: colors.mutedForeground }]}>
          {device.storageUsed} GB of {device.storageTotal} GB used
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  title: { fontSize: 28, fontWeight: "800" },
  cloudBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabText: { fontSize: 13, fontWeight: "600" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  grid: { padding: 16, gap: 4 },
  row: { gap: 4, marginBottom: 4 },
  mediaItem: { borderRadius: 10, overflow: "hidden" },
  mediaPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  starBtn: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  storageBar: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storageCount: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  storageUsed: { fontSize: 11, fontWeight: "700" },
  storageDetail: { fontSize: 11 },
});
