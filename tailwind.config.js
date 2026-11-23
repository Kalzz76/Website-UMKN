module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: "#FDF5E7",
        blush: "#F1DBD0",
        dusty: "#D3A29D",
        burgundy: "#A36361",
        cherry: "#9E3B42",
        khaki: "#CDBFAA",
        sage: "#ADB697",
        ink: "#3D2B28",
        kayu: "#5A3B33",
        kayuGelap: "#3E2721",
        kuningan: "#B8925A",
      },
      fontFamily: {
        sans: ["Quicksand", "system-ui", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        coquette: ["Cinzel Decorative", "Cormorant Garamond", "serif"],
        script: ["Pinyon Script", "cursive"],
      },
    },
  },
  plugins: [],
};
