// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/google-fonts',
  ],
  googleFonts: {
    download: true,
    families: {
      Mulish: true,
      //add material icons font
      'Material Symbols Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200': true,
    },
  }
})
