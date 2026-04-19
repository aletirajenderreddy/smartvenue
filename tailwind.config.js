/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0B1220',
        navySec: '#111827',
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
        },
        accent: {
          DEFAULT: '#60A5FA', // Lighter blue for accents
          hover: '#93C5FD',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        cardAdmin: 'rgba(31, 41, 55, 0.8)'
      },
      fontFamily: {
        heading: ['"Google Sans"', '"Google Sans Code"', '"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif']
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        'fade-to-bottom': 'linear-gradient(180deg, rgba(11, 18, 32, 0) 0%, rgba(11, 18, 32, 1) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  }
};
