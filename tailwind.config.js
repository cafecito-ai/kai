/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#FFF9F0",
        mist: "#EEF7F4",
        sage: "#4E8F75",
        sky: "#3D8FD1",
        coral: "#E65F47",
        plum: "#8A4D82",
        amber: "#F0A629",
        lime: "#B9D755",
        danger: "#B42318",
        night: "#202332"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        kai: "8px"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(32, 35, 50, 0.12)"
      }
    }
  },
  plugins: []
};
