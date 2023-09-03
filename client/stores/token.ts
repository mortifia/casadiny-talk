import { defineStore, storeToRefs } from "pinia";

//create a pinia token store
export const useTokenStore = defineStore({
  id: "token",
  state: () => ({
    token: "",
    expiresIn : 0,
    refreshToken: "",
    refreshTokenExpiresIn: 0,
  }),
  getters: {
    getToken() : string {
      return this.token;
    },
    getTokenExpiresIn() : number {
      return this.expiresIn;
    },
    getRefreshToken() : string {
      return this.refreshToken;
    },
    getRefreshTokenExpiresIn() : number {
      return this.refreshTokenExpiresIn;
    },
  },
  actions: {
    setToken(token: string) {
      this.token = token;
    },
    setTokenExpiresIn(expiresIn: number) {
      this.expiresIn = expiresIn;
    },
    setRefreshToken(refreshToken: string) {
      this.refreshToken = refreshToken;
    },
    setRefreshTokenExpiresIn(refreshTokenExpiresIn: number) {
      this.refreshTokenExpiresIn = refreshTokenExpiresIn;
    },
    logout(){
      this.token = "";
      this.expiresIn = 0;
      this.refreshToken = "";
      this.refreshTokenExpiresIn = 0;
    }
  },
  persist: true,
});
