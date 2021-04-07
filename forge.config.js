// module.exports = {
//   packagerConfig: {},
//   makers: [
//     {
//       name: '@electron-forge/maker-squirrel',
//       config: {
//         name: 'crawler',
//       },
//     },
//     {
//       name: '@electron-forge/maker-zip',
//       platforms: ['darwin'],
//     },
//     {
//       name: '@electron-forge/maker-deb',
//       config: {},
//     },
//     {
//       name: '@electron-forge/maker-rpm',
//       config: {},
//     },
//   ],
// }
module.exports = {
  packagerConfig: {},
  makers: [{
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "StreamLuv",
        iconUrl: "https://raw.githubusercontent.com/KlassyKat/Stream-Luv/master/buildResources/icon.ico",
        setupExe: "StreamLuv",
        setupIcon: "./build_resources/icon.ico",
        loadingGif: "./build_resources/loadingGif.gif"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      "config": {}
    }
  ]
}