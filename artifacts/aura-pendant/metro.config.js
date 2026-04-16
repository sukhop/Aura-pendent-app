const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure audio assets (wav, mp3, etc.) are bundled by Metro
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter((ext) => ext !== "svg"),
  "wav",
  "mp3",
  "m4a",
  "aac",
  "ogg",
  "flac",
];

module.exports = withNativeWind(config, { input: "./global.css" });
