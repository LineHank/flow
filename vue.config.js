const url = 'http://-gateway:9999'
const path = require("path");

module.exports = {
  lintOnSave: false,
  outputDir: "dist",
  // 开发环境显示报错位置
  productionSourceMap: true,
  runtimeCompiler: true,

  devServer: {
    disableHostCheck: true,
    port: 8000,
    proxy: {
      '/': {
        target: url,
        ws: false,
        pathRewrite: {
          '^/': '/'
        }
      }
    }
  }
}
