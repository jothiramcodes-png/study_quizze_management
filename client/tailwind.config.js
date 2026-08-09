export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#eafcfc',
          100: '#cbf8f8',
          200: '#9df1f1',
          300: '#5ee4e4',
          400: '#23cece',
          500: '#069494', // Teal primary
          600: '#057c7c',
          700: '#086363',
          800: '#0c4f4f',
          900: '#0f4343',
          950: '#022626',
        },
        emerald: {
          50: '#eafcfc',
          100: '#cbf8f8',
          200: '#9df1f1',
          300: '#5ee4e4',
          400: '#069494', // Teal Low Risk
          500: '#069494',
          600: '#057c7c',
          700: '#086363',
          800: '#0c4f4f',
          900: '#0f4343',
        },
        amber: {
          50: '#fffef3',
          100: '#fffbe3',
          200: '#fff5b8',
          300: '#ffeb80',
          400: '#fce883', // Yellow Medium Risk
          500: '#fce883',
          600: '#e5d16d',
          700: '#bfae54',
          800: '#998a3c',
          900: '#736625',
        },
        red: {
          50: '#fff5ef',
          100: '#ffe6d8',
          200: '#ffcbaf',
          300: '#ffa77b',
          400: '#ff8243', // Coral High Risk
          500: '#ff8243',
          600: '#e56d32',
          700: '#bf5521',
          800: '#993f13',
          900: '#732a07',
        },
        pink: {
          50: '#fff5f6',
          100: '#ffe6e8',
          200: '#ffccd1',
          300: '#ffa1ac',
          400: '#ff7386',
          500: '#ffc0cb', // Pink accent
          600: '#e5aab6',
          700: '#bf8e98',
          800: '#99727a',
          900: '#73565b',
        }
      }
    }
  },
  plugins: [],
}