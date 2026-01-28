/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-modal-overlay': 'var(--color-bg-modal-overlay)',
        'bg-white': 'var(--color-bg-white)',
        'bg-gray-50': 'var(--color-bg-gray-50)',
        'bg-gray-100': 'var(--color-bg-gray-100)',
        
        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-muted': 'var(--color-text-muted)',
        'text-white': 'var(--color-text-white)',
        
        // Border colors
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-accent': 'var(--color-border-accent)',
        'border-focus': 'var(--color-border-focus)',
        
        // Accent colors
        'accent-primary': 'var(--color-accent-primary)',
        'accent-primary-hover': 'var(--color-accent-primary-hover)',
        'accent-red': 'var(--color-accent-red)',
        'accent-red-hover': 'var(--color-accent-red-hover)',
        'accent-red-light': 'var(--color-accent-red-light)',
        'accent-blue': 'var(--color-accent-blue)',
        'accent-blue-hover': 'var(--color-accent-blue-hover)',
        'accent-green': 'var(--color-accent-green)',
        'accent-green-hover': 'var(--color-accent-green-hover)',
        'accent-indigo': 'var(--color-accent-indigo)',
        'accent-indigo-light': 'var(--color-accent-indigo-light)',
        
        // Legacy support
        ivory: 'var(--color-bg-primary)',
        'ivory-dark': 'var(--color-bg-secondary)',
        // Map red-600 to blue for theme consistency
        'red-600': 'var(--color-accent-red)',
      },
      backgroundColor: {
        'modal-overlay': 'var(--color-bg-modal-overlay)',
      },
    },
  },
  plugins: [],
}
