const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";

  return {
    mode: argv.mode,
    devtool: isDevelopment ? "inline-source-map" : false,
    entry: {
      // ui.tsは使用せず、ui.htmlに直接スクリプトを埋め込む
      code: "./src/plugin/code.ts",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/ui/ui.html",
        filename: "ui.html",
        chunks: [], // ui.tsのエントリーポイントを削除したため、chunksは空に
        inject: false, // スクリプトは既にHTMLに埋め込まれているため、injectしない
      }),
    ],
  };
};
