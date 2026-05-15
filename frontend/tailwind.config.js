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
            primary: '#F0FDFA',
            secondary: '#CCFBF1',
            tertiary: '#FFFFFF',
          },
          text: {
            primary: '#022C22',
            secondary: '#0D6E63',
            tertiary: '#0F8970',
          },
          border: '#A7F3D0',
        },
        // Dark Mode
        dark: {
          bg: {
            primary: '#022C22',
            secondary: '#0F4C3A',
            tertiary: '#134E3A',
          },
          text: {
            primary: '#D0F0ED',
            secondary: '#A7F3D0',
            tertiary: '#6EE7B7',
          },
          border: '#14B8A6',
        },
        // Brand Colors (GREEN THEME)
        brand: {
          primary: '#0F766E',
          secondary: '#14B8A6',
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
        xs:      '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm:      '0 1px 3px 0 rgba(0,0,0,0.10), 0 1px 2px 0 rgba(0,0,0,0.06)',
        md:      '0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -1px rgba(0,0,0,0.06)',
        lg:      '0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -2px rgba(0,0,0,0.05)',
        xl:      '0 20px 25px -5px rgba(0,0,0,0.10), 0 10px 10px -5px rgba(0,0,0,0.04)',
        '2xl':   '0 25px 50px -12px rgba(0,0,0,0.25)',
        premium: '0 20px 40px -10px rgba(15, 118, 110, 0.25)',
        teal:    '0 10px 30px -10px rgba(15, 118, 110, 0.45)',
        'teal-sm':'0 4px 12px -2px rgba(15, 118, 110, 0.35)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)',
        'gradient-brand-dark': 'linear-gradient(135deg, #064E48 0%, #0D6E63 100%)',
        'gradient-premium': 'linear-gradient(145deg, #0F766E 0%, #22D3EE 100%)',
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
      fontSize: {
        // Each size stepped up one notch from Tailwind defaults.
        // Combined with html { font-size: 18px } this gives ~30-40% larger text
        // vs the original defaults, making all UI comfortably readable.
        'xs':   ['0.833rem',  { lineHeight: '1.25rem' }],  // ~15px  (default 12px)
        'sm':   ['0.944rem',  { lineHeight: '1.5rem'  }],  // ~17px  (default 14px)
        'base': ['1.056rem',  { lineHeight: '1.75rem' }],  // ~19px  (default 16px)
        'lg':   ['1.167rem',  { lineHeight: '1.875rem'}],  // ~21px  (default 18px)
        'xl':   ['1.333rem',  { lineHeight: '1.875rem'}],  // ~24px  (default 20px)
        '2xl':  ['1.667rem',  { lineHeight: '2rem'    }],  // ~30px  (default 24px)
        '3xl':  ['2rem',      { lineHeight: '2.25rem' }],  // ~36px  (default 30px)
        '4xl':  ['2.5rem',    { lineHeight: '2.5rem'  }],  // ~45px  (default 36px)
        '5xl':  ['3rem',      { lineHeight: '1'       }],  // ~54px  (default 48px)
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms',
      },
    },
  },
  plugins: [],
}
