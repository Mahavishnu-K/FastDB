/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      fontSize: {
        '2xs': '0.625rem', // 10px
      },
      colors: {
        // Define a consistent color palette
        // Light Mode
        'bg-light': '#ffffff',
        'fg-light': '#f8f9fa', // Slightly off-white for cards/panels
        'text-light': '#1e293b', // slate-800
        'text-muted-light': '#64748b', // slate-500
        'border-light': '#e2e8f0', // slate-200

        // Dark Mode
        'bg-dark': '#020617', // slate-950
        'fg-dark': '#0f172a', // slate-900
        'text-dark': '#cbd5e1', // slate-300
        'text-muted-dark': '#64748b', // slate-500
        'border-dark': '#334155', // slate-700
      },
      backgroundImage: {
        'dot-grid-light': 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        'dot-grid-dark': 'radial-gradient(circle, #374151 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}