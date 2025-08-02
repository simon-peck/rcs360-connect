/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: "app",
  serverBuildFile: "index.js",
  serverModuleFormat: "esm",
  ignoredRouteFiles: ["**/.*"],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
    v3_lazyRouteDiscovery: true,
    v3_singleFetch: false,
    v3_routeConfig: false,
  },
};