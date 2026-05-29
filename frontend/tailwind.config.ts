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
        // Seqwater civic enterprise palette
        canvas: "#F5FAFD",
        surface: {
          DEFAULT: "#FFFFFF",
          blue: "#EAF6FC",
          blueStrong: "#D8F0FB",
          green: "#EEF8F2",
        },
        primaryBlue: "#0076BE",
        seqwaterBlue: "#00AEEF",
        deepBlue: "#004F7C",
        deepNavy: "#0A2E4D",

        seqwaterGreen: "#5FA777",
        eucalyptus: "#7FA77B",
        greenDark: "#2E7D59",

        ink: {
          DEFAULT: "#16324F",
          primary: "#16324F",
          secondary: "#334155",
          muted: "#64748B",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },

        border: {
          DEFAULT: "#D7E7F0",
          strong: "#B8D7E7",
        },

        status: {
          normal: "#2E7D59",
          monitor: "#0076BE",
          watch: "#D88A00",
          escalate: "#C2410C",
        },

        // Reserved for the Governance & Platform page only
        databricks: {
          red: "#FF3621",
          orange: "#FF8A00",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "18px",
        xl: "24px",
        "2xl": "28px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 48, 73, 0.08)",
        elevated: "0 16px 48px rgba(15, 48, 73, 0.12)",
        soft: "0 1px 2px rgba(15, 48, 73, 0.04), 0 1px 4px rgba(15, 48, 73, 0.04)",
        ring: "0 0 0 4px rgba(0, 118, 190, 0.12)",
      },
      backgroundImage: {
        "canvas-grad":
          "linear-gradient(180deg, #F5FAFD 0%, #FFFFFF 60%, #F0F8FC 100%)",
        "hero-overlay":
          "linear-gradient(90deg, rgba(10,46,77,0.78) 0%, rgba(10,46,77,0.55) 45%, rgba(10,46,77,0.15) 100%)",
        "hero-overlay-soft":
          "linear-gradient(90deg, rgba(10,46,77,0.55) 0%, rgba(10,46,77,0.25) 60%, rgba(10,46,77,0.05) 100%)",
        "posture-card":
          "linear-gradient(180deg, #FFFFFF 0%, #F8FCFE 100%)",
        "sparkline-blue":
          "linear-gradient(180deg, rgba(0,174,239,0.32) 0%, rgba(0,174,239,0.0) 100%)",
        "sparkline-green":
          "linear-gradient(180deg, rgba(95,167,119,0.32) 0%, rgba(95,167,119,0.0) 100%)",
        "sparkline-amber":
          "linear-gradient(180deg, rgba(216,138,0,0.28) 0%, rgba(216,138,0,0.0) 100%)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeUp: "fadeUp 380ms cubic-bezier(0.16,1,0.3,1) both",
        fadeIn: "fadeIn 240ms ease both",
        slideInRight: "slideInRight 320ms cubic-bezier(0.16,1,0.3,1) both",
        pulseSoft: "pulseSoft 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
