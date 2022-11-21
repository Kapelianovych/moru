export default {
  test: {
    include: ["**/*.browser.test.{js,jsx}"],
    environment: "happy-dom",
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "moru",
  },
  resolve: {
    conditions: ["browser"],
  },
};
