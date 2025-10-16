export default {
  expo: {
    name: "Inyatsi Fleet Management",       //  new display name
    slug: "mobile",                          // revert to original slug
    owner: "sidmillx",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "inyatsi-fleet",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sidmillx.mobile",  // keep original
      buildNumber: "13",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true }
      }
    },

    android: {
      adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: "#ffffff" },
      edgeToEdgeEnabled: true,
      package: "com.sidmillx.mobile",          // keep original
      usesCleartextTraffic: true,
      versionCode: 2
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 150,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store"
    ],

    experiments: { typedRoutes: true },

    extra: {
      router: {},
      API_URL: process.env.API_URL,
      eas: { projectId: "bcb70c1c-728f-499e-8a41-f3c24e611da0" }  // original project
    },

    runtimeVersion: { policy: "appVersion" },
    updates: { url: "https://u.expo.dev/bcb70c1c-728f-499e-8a41-f3c24e611da0" } // original project
  }
};
