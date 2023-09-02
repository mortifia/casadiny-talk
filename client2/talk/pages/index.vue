<script setup lang="ts">
import { useJwtStore } from '@/stores/jwt'
const jwtStore = useJwtStore()

//si jwtStore.jwt est vide, on set 0
if (jwtStore.jwt == null) {
    jwtStore.jwt = 0
} else {
    jwtStore.jwt = jwtStore.jwt + 1
}
</script>

<template>
    <div>
        <h1>Client 2</h1>
        <p>Client 2</p>
        //test icon avec MaterialIcon font
        <span class="material-symbols-outlined">
            home
        </span>
        <p>jwt store value : <span>
                {{ jwtStore.jwt }}
            </span></p>
    </div>
</template>

<style scoped></style>