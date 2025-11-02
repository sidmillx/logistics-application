// export default {
//   expo: {
//     name: "Inyatsi Fleet Management",       //  new display name
//     slug: "mobile",                          // revert to original slug
//     owner: "sidmillx",
//     version: "1.1.2",
//     orientation: "portrait",
//     icon: "./assets/images/icon.png",
//     scheme: "inyatsi-fleet",
//     userInterfaceStyle: "automatic",
//     newArchEnabled: true,

//     ios: {
//       supportsTablet: true,
//       bundleIdentifier: "com.sidmillx.mobile",  // keep original
//       buildNumber: "25",
//       infoPlist: {
//         ITSAppUsesNonExemptEncryption: false,
//         NSAppTransportSecurity: { NSAllowsArbitraryLoads: true }
//       }
//     },

//     android: {
//       adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: "#ffffff" },
//       edgeToEdgeEnabled: true,
//       package: "com.sidmillx.mobile",          // keep original
//       usesCleartextTraffic: true,
//       versionCode: 2
//     },

//     web: {
//       bundler: "metro",
//       output: "static",
//       favicon: "./assets/images/favicon.png"
//     },

//     plugins: [
//       "expo-router",
//       [
//         "expo-splash-screen",
//         {
//           image: "./assets/images/splash-icon.png",
//           imageWidth: 150,
//           resizeMode: "contain",
//           backgroundColor: "#ffffff"
//         }
//       ],
//       "expo-secure-store"
//     ],

//     experiments: { typedRoutes: true },

//     extra: {
//       router: {},
//       API_URL: process.env.API_URL,
//       eas: { projectId: "bcb70c1c-728f-499e-8a41-f3c24e611da0" }  // original project
//     },

//     runtimeVersion: { policy: "appVersion" },
//     updates: { url: "https://u.expo.dev/bcb70c1c-728f-499e-8a41-f3c24e611da0" } // original project
//   }
// };



export default {
  expo: {
    name: "Inyatsi Fleet Management",
    slug: "mobile",
    owner: "sidmillx",
    version: "1.1.6",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "inyatsi-fleet",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sidmillx.mobile",
      buildNumber: "30",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
        NSPhotoLibraryUsageDescription: "The app needs access to your photos to upload receipts.",
        NSCameraUsageDescription: "The app needs access to your camera to take receipt photos."
      }
    },

    android: {
      adaptiveIcon: { foregroundImage: "./assets/images/adaptive-icon.png", backgroundColor: "#ffffff" },
      edgeToEdgeEnabled: true,
      package: "com.sidmillx.mobile",
      usesCleartextTraffic: true,
      versionCode: 2,
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_MEDIA_LOCATION"
      ]
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
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission: "The app needs access to your photos to upload receipts.",
          cameraPermission: "The app needs access to your camera to take receipt photos."
        }
      ]
    ],

    experiments: { typedRoutes: true },

    extra: {
      router: {},
      API_URL: process.env.API_URL,
      eas: { projectId: "bcb70c1c-728f-499e-8a41-f3c24e611da0" }
    },

    runtimeVersion: { policy: "appVersion" },
    updates: { url: "https://u.expo.dev/bcb70c1c-728f-499e-8a41-f3c24e611da0" }
  }
};