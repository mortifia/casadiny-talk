// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true},
  css: ['~/assets/css/main.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/google-fonts',
    '@pinia-plugin-persistedstate/nuxt'
  ],
  googleFonts: {
    download: true,
    families: {
      Mulish: true,
    }
  }
})