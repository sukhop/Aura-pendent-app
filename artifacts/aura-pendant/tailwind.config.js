/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A14",
        foreground: "#E8E8F0",
        card: "#141424",
        primary: "#7C6FFF",
        secondary: "#1E1E34",
        muted: "#1A1A2E",
        "muted-fg": "#6B6B85",
        accent: "#FF4D6D",
        border: "#2A2A45",
        input: "#1E1E34",
        success: "#00D68F",
        warning: "#FFB800",
        info: "#00C2FF",
        sos: "#FF3B4E",
        "heart-rate": "#FF4D6D",
      },
      fontFamily: {
        sans: ["InterTight-Regular"],
        tight: ["InterTight-Regular"],
      },
    },
  },
  plugins: [],
};
