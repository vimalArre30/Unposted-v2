import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Unposted design system
        sage:    '#A8C5A0',
        cream:   '#FDF8F0',
        lavender:'#C9BFE8',
        forest:  '#1E3A1F',
        moss:    '#4A7C59',
      },
      borderRadius: {
        card: '20px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.06)',
        card: '0 2px 16px rgba(0,0,0,0.04)',
        glow: '0 0 20px rgba(74,124,89,0.25)',
      },
      animation: {
        'gradient-shift':  'gradientShift 12s ease infinite alternate',
        'float-up':        'floatUp 6s ease-in-out infinite',
        'scale-in':        'scaleIn 0.3s ease-out',
        'slide-up':        'slideUp 0.3s ease-out',
        'record-gradient': 'recordGradient 8s ease infinite alternate',
        'progress-fill':   'progressFill 0.5s ease-out',
        'fade-in':         'fadeIn 0.4s ease-out',
      },
      keyframes: {
        gradientShift: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        recordGradient: {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        progressFill: {
          from: { width: '0%' },
          to:   { width: 'var(--progress-width)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
