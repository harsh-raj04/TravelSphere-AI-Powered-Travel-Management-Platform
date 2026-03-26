/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Mode
        light: {
          bg: {
            primary: '#F8FAFC',
            secondary: '#F1F5F9',
            tertiary: '#FFFFFF',
          },
          text: {
            primary: '#111827',
            secondary: '#6B7280',
            tertiary: '#9CA3AF',
          },
          border: '#E5E7EB',
        },
        // Dark Mode
        dark: {
          bg: {
            primary: '#0B1220',
            secondary: '#111827',
            tertiary: '#1F2937',
          },
          text: {
            primary: '#F3F4F6',
            secondary: '#D1D5DB',
            tertiary: '#9CA3AF',
          },
          border: '#374151',
        },
        // Brand Colors
        brand: {
          primary: '#2563EB',
          secondary: '#38BDF8',
          accent: '#22D3EE',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      spacing: {
        xs: '0.5rem',    // 8px
        sm: '1rem',      // 16px
        md: '1.5rem',    // 24px
        lg: '2rem',      // 32px
        xl: '3rem',      // 48px
      },
      borderRadius: {
        xs: '0.375rem',  // 6px
        sm: '0.5rem',    // 8px
        md: '0.75rem',   // 12px
        lg: '1rem',      // 16px
        xl: '1.5rem',    // 24px
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        premium: '0 20px 40px -10px rgba(37, 99, 235, 0.15)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
        'gradient-brand-dark': 'linear-gradient(135deg, #1E40AF 0%, #0369A1 100%)',
        'gradient-premium': 'linear-gradient(145deg, #2563EB 0%, #22D3EE 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
