<template>
    <div class="header">
        <img src="~/assets/logo_inversed_mini.svg" alt="logo">
        <div class="search">
            <input class="search-bar" type="text" placeholder="Chercher sur CDT...">
            <button class="search-btn"><span class="material-symbols-outlined">
                    search
                </span></button>
        </div>
        <button v-if="!token" class="sign-in-btn" @click="$emit('open-sign-in')">Se connecter</button>
    </div>
</template>

<script>
import { useJwtStore } from '~/stores/jwt'
const jwtStore = useJwtStore()
const token = ref(jwtStore.token)
console.log(token)
</script>

<style scoped>
.header {
    background-color: #FFA64D;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

img {
    padding-left: 2vw;
}

.search-bar {
    width: 40vw;
    height: 3.9vh;
    border-radius: 16px 0px 0px 16px;
    border: none;
    font-size: 1rem;
    padding-left: 16px;
    color: hsla(223, 21%, 27%, 1);
}

.search-bar:focus {
    outline: none;
}

.search-bar::-moz-focus-inner {
    border: 0;
}

.search-btn {
    width: 2vw;
    height: 4vh;
    border-radius: 0px 16px 16px 0px;
    border: 1px solid white;
    background-color: white;
    color: hsla(223, 21%, 27%, 1);
    font-size: 1rem;
}

.search {
    display: flex;
    justify-content: center;
    align-items: center;
    width: fit-content;
    border-radius: 16px;
}

.search:hover {
    border: 4px solid #ff9d3b;
}

.sign-in-btn {
    border-radius: 16px;
    border: none;
    background-color: transparent;
    color: white;
    font-size: 1.2rem;
    margin-right: 2vw;
    font-weight: 600;

}

.sign-in-btn:hover {
    text-decoration: overline;
}

button {
    cursor: pointer;
}
</style>