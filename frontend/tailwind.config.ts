import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "DM Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Databricks-inspired neutrals & accent
        ink: {
          50: "#F5F5F4",
          100: "#E7E5E4",
          200: "#D6D3D1",
          300: "#A8A29E",
          400: "#78716C",
          500: "#57534E",
          600: "#44403C",
          700: "#292524",
          800: "#1C1917",
          900: "#0E0D0C",
        },
        brand: {
          50: "#FFF1EE",
          100: "#FFE0D8",
          200: "#FFB9A8",
          300: "#FF8E76",
          400: "#FF5F3D",
          500: "#FF3621", // Databricks red/orange
          600: "#E22B17",
          700: "#B41F0F",
          800: "#85160B",
          900: "#4A0C06",
        },
        // Water-sector palette
        water: {
          50: "#EFF8FF",
          100: "#DCEEFE",
          200: "#B6DCFD",
          300: "#7BC2FB",
          400: "#3FA1F2",
          500: "#1B82DB",
          600: "#1568B3",
          700: "#15528C",
          800: "#11406D",
          900: "#0B2A48",
        },
        aqua: {
          50: "#ECFDFB",
          100: "#CFF8F2",
          200: "#9DEFE5",
          300: "#5DDCD0",
          400: "#26C2B7",
          500: "#0FA59C",
          600: "#0B847E",
          700: "#0B6764",
          800: "#0B504F",
          900: "#063B3A",
        },
        catchment: {
          50: "#F2FAEC",
          100: "#E0F2D2",
          200: "#BFE3A4",
          300: "#92CD6F",
          400: "#69B147",
          500: "#4F9532",
          600: "#3D7626",
          700: "#325C20",
          800: "#28471B",
          900: "#19310F",
        },
        amberop: {
          50: "#FFF7E6",
          100: "#FFE9B8",
          200: "#FFD980",
          300: "#FFC04D",
          400: "#FFA31A",
          500: "#E68A00",
          600: "#B86E00",
          700: "#8A5300",
          800: "#5C3700",
          900: "#2E1B00",
        },
        risk: {
          DEFAULT: "#D43E2C",
          50: "#FCEEEC",
          100: "#F8D5D0",
          200: "#F0A89D",
          300: "#E67769",
          400: "#DD5040",
          500: "#D43E2C",
          600: "#A52F22",
          700: "#7A231A",
          800: "#511712",
          900: "#290A08",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,54,33,0.15), 0 12px 40px -12px rgba(255,54,33,0.25)",
        elevated: "0 1px 0 rgba(20,20,25,0.06), 0 14px 40px -10px rgba(20,20,25,0.20)",
        card: "0 1px 0 rgba(20,20,25,0.04), 0 6px 18px -6px rgba(20,20,25,0.10)",
      },
      backgroundImage: {
        "command-grad":
          "radial-gradient(1200px 700px at 0% 0%, rgba(15,165,156,0.12), transparent 60%), radial-gradient(1100px 600px at 100% 0%, rgba(255,54,33,0.08), transparent 50%), linear-gradient(180deg, #0E0D0C 0%, #15161A 60%, #1C1D22 100%)",
        "panel-grad":
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        "kpi-grad":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.00) 100%)",
        "water-grad":
          "linear-gradient(135deg, #0B2A48 0%, #15528C 60%, #0FA59C 100%)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
