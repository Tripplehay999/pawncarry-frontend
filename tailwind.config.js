/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",         
        surface: "#0f1720",    
        panel: "#0b1220",      
        accent: "#3b82f6",     
        accent2: "#06b6d4",    
        danger: "#ef4444",
        success: "#10b981",
        muted: "#94a3b8"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial"]
      },
      boxShadow: {
        "soft": "0 6px 18px rgba(2,6,23,0.6)",
        "panel": "0 10px 30px rgba(2,6,23,0.7)"
      },
    },
  },
  plugins: [],
};
