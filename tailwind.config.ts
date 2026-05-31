import type { Config } from "tailwindcss";

/* Tokens de diseño First30 — estética SaaS B2B (Linear/Attio/Vercel).
   Los colores apuntan a variables CSS (definidas en globals.css) para soportar
   tema claro/oscuro por clase `.dark` sin cambiar las clases en los componentes. */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        sidebar: "var(--sidebar)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        // Superficies sutiles (hovers, zebra, avatares) ahora tematizables:
        subtle: "var(--subtle)",
        "subtle-2": "var(--subtle-2)",
        "avatar-bg": "var(--avatar-bg)",
        "avatar-fg": "var(--avatar-fg)",
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          strong: "var(--accent-strong)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          soft: "var(--danger-soft)",
          strong: "var(--danger-strong)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
          strong: "var(--warn-strong)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
          strong: "var(--info-strong)",
        },
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
