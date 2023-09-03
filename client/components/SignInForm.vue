<template>
  <div>
    <transition name="fade">
      <div class="modal-mask"></div>
    </transition>
    <transition name="pop">
      <form @submit.prevent="signIn">
        <button class="close-btn" type="button">
          <span class="material-symbols-outlined" @click="$emit('close')">
            close
          </span>
        </button>
        <h2>Heureux de vous voir !</h2>
        <div class="form-group">
          <label>Email</label>
          <input type="email" placeholder="Email" v-model="email" />
        </div>
        <div class="form-group">
          <label>Mot de passe</label>
          <input
            type="password"
            placeholder="Mot de passe"
            v-model="password"
          />
        </div>
        <span class="error" v-if="error !== ''">{{ error }}</span>
        <span class="success" v-if="success !== ''"> {{ success }}</span>
        <input type="submit" value="Se connecter" />
        <span class="sign-up">
          Nouveau par ici ?
          <span class="sign-up-link" @click="$emit('showSignUp')"
            >Inscrivez-vous!</span
          ></span
        >
      </form>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useTokenStore } from "~/stores/token";
const tokenStore = useTokenStore();

const email = ref("");
const password = ref("");
const error = ref("");
const success = ref<string>("");
const emit = defineEmits(["close"]);

const signIn = async () => {
  if (email.value === "" || password.value === "") {
    error.value = "Veuillez remplir tous les champs";
    return;
  }

  const res = await fetch("http://talk.casadiny.ovh:3000/auth/signin/local", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
    }),
  })
    .then((res) => {
      if (res.status === 400) {
        throw new Error("Email ou mot de passe non fourni.");
      }
      if (res.status === 500) {
        throw new Error(
          "Une erreur est survenue. Merci de réessayer plus tard."
        );
      }
      if (res.status === 401) {
        throw new Error("Email ou mot de passe incorrect.");
      }
      return res.json();
    })
    .catch((err) => {
      console.log(err);
      error.value = err.message;
    });
  console.log(res);
  tokenStore.setToken(res.acessToken);
  tokenStore.setTokenExpiresIn(res.expires_in);
  tokenStore.setRefreshToken(res.refreshToken.token);
  tokenStore.setRefreshTokenExpiresIn(res.refreshToken.expires);
  success.value = "Vous êtes connecté !";
  setTimeout(() => {
    emit("close");
  }, 2000);
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
}

.error {
  color: #ff1e1e;
}

.success {
  color: #41cc80;
}

h2 {
  background: conic-gradient(
    from 180deg at 50% 50%,
    #ff8e1c 0deg,
    #ffb366 360deg
  );
  background-clip: text;
  -webkit-background-clip: text;
  -moz-background-clip: text;
  -webkit-text-fill-color: transparent;
}

form {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  text-align: center;
  width: fit-content;
  height: fit-content;
  background-color: #fff;
  border-radius: 16px;
  padding: 1rem 2rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1em;
}

label {
  color: #696e7a;
  font-size: 1rem;
  font-weight: 500;
  display: block;
  text-align: left;
}
input[type="email"],
input[type="password"] {
  min-width: 280px;
  height: 40px;
  border-radius: 16px;
  background-color: #f1f2f2;
  border: none;
  padding-left: 16px;
}

input[type="submit"] {
  background-color: #ffa64d;
  border-radius: 16px;
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  min-width: 280px;
  height: 40px;
  cursor: pointer;
}

input[type="submit"]:hover {
  background-color: #ff9d3b;
}

.sign-up,
.sign-up-link {
  font-size: 0.8rem;
  font-weight: 500;
}

.sign-up-link {
  color: #ffa64d;
  cursor: pointer;
  font-weight: 600;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  border: none;
  background-color: transparent;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.01s linear;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-enter-active,
.pop-leave-active {
  transition: transform 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67),
    opacity 0.25s linear;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.2) translateY(-50%);
}
</style>
