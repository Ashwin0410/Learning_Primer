/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        cream: "#faf8f4",
        ink: "#1f2233",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,34,51,0.04), 0 8px 24px -12px rgba(31,34,51,0.12)",
        lift: "0 2px 6px rgba(31,34,51,0.06), 0 18px 40px -18px rgba(79,70,229,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
