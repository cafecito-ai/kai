/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#FBF4E8",
        mist: "#EAF1EA",
        sage: "#3F8068",
        sky: "#2F7AB8",
        coral: "#D94E3F",
        plum: "#6F4D79",
        amber: "#E7A326",
        lime: "#C8DB5B",
        danger: "#B42318",
        night: "#22212B",
        graphite: "#3A3938"
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
