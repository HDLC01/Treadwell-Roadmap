/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: { DEFAULT: "var(--primary)", fg: "var(--primary-fg)" },
        accent: { DEFAULT: "var(--accent)", fg: "var(--accent-fg)" },
        destructive: { DEFAULT: "var(--destructive)", fg: "var(--destructive-fg)" },
        // status tokens
        live: "var(--live)",
        progress: "var(--progress)",
        planned: "var(--planned)",
        notstarted: "var(--notstarted)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionDuration: { DEFAULT: "200ms" },
      keyframes: {
        "pour-sheen": {
          "0%": { backgroundPosition: "-150% 0" },
          "100%": { backgroundPosition: "250% 0" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "pour-sheen": "pour-sheen 3s linear infinite",
        "fade-in": "fade-in 200ms ease-out",
      },
    },
  },
  plugins: [],
};
