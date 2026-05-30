import type { Config } from "tailwindcss";

/* Tokens de diseño First30 — estética SaaS B2B (Linear/Attio/Vercel).
   Neutros cálidos + acento verde discreto. Sin estética fitness. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f6f4",
        surface: "#ffffff",
        sidebar: "#fbfbf9",
        border: "#e8e7e3",
        "border-strong": "#dcdbd6",
        ink: "#191917",
        muted: "#6c6b64",
        faint: "#9b9a92",
        accent: { DEFAULT: "#1f7a4d", soft: "#e8f3ec", strong: "#16623d" },
        danger: { DEFAULT: "#dc2626", soft: "#fdecec", strong: "#b4322f" },
        warn: { DEFAULT: "#d97706", soft: "#fdf2e3", strong: "#9a5b12" },
        info: { DEFAULT: "#5b7894", soft: "#eef2f6", strong: "#3a5168" },
      },
      fontFamily: { sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"] },
      borderRadius: { xl: "14px", "2xl": "18px" },
      boxShadow: {
        card: "0 1px 2px rgba(20,20,18,.05)",
        lift: "0 4px 18px -8px rgba(20,20,18,.18)",
      },
    },
  },
  plugins: [],
};
export default config;
