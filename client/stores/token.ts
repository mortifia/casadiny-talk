import { defineStore, storeToRefs } from "pinia";

export const useTokenStore = defineStore("token", () =>  {
  const token = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const setToken = (newToken: string) => {
    token.value = newToken;
  }
  const setRefreshToken = (newToken: string) => {
    refreshToken.value = newToken;
  }
  const logout = () => {
    token.value = null;
    refreshToken.value = null;
  }
  return {
    token: computed(() => token.value),
    refreshToken: computed(() => refreshToken.value),
    setToken,
    setRefreshToken,
    logout
  }
});
