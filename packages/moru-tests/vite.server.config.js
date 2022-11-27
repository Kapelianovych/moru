export default {
  test: {
    include: ["**/*.server.test.{js,jsx}"],
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "moru",
  },
};
