/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        wechat: {
          green: '#07C160',
          bg: '#EDEDED',
          chatBg: '#F5F5F5',
          headerBg: '#EDEDED',
          inputBg: '#FFFFFF',
          bubble: '#95EC69',
          bubbleOther: '#FFFFFF',
        }
      }
    },
  },
  plugins: [],
}
