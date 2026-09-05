import babelPlugin from "@rolldown/plugin-babel";

export default babelPlugin({
  presets: [
    {
      preset() {
        return {
          plugins: [
            ["@babel/plugin-proposal-decorators", { version: "2023-11" }],
          ],
        };
      },
      rolldown: {
        // Only run this transform if the file contains a decorator.
        filter: {
          code: "@",
        },
      },
    },
  ],
});
