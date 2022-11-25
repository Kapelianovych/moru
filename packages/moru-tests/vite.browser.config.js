export default {
  test: {
    include: ["**/*.browser.test.{js,jsx}"],
    environment: "jsdom",
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "moru",
  },
  resolve: {
    conditions: ["browser"],
  },
};
