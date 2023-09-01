import { defineStore, createPinia, setActivePinia, storeToRefs } from "pinia";
const pinia = createPinia();


export default { store: setActivePinia(pinia) }
export const useJwtStore = defineStore("token", {
    state: () => ({
        token: storeToRefs(null),
        refreshToken: storeToRefs(null),
    }),
    getters: {
        getToken(state) {
            return state.token;
        },
        getRefreshToken(state) {
            return state.refreshToken;
        },
    },
    actions: {
        setJwt(jwt) {
            this.token = token;
        },
        setRefreshToken(refreshToken) {
            this.refreshToken = refreshToken;
        },
        logout() {
            this.token = null;
            this.refreshToken = null;
        }

    },
    persist: true,
});