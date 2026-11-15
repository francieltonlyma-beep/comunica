export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Department badges can contain a palette saved before this build.
  safelist: [{
    pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
  }],
  theme: { extend: {} },
  plugins: [],
};
