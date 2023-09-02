<template>
  <div>
    <transition name="fade">
      <div class="modal-mask"></div>
    </transition>
    <transition name="pop">
      <form @submit.prevent="signUp">
        <button class="close-btn" type="button">
          <span class="material-symbols-outlined" @click="$emit('close')">
            close
          </span>
        </button>
        <h2>Bienvenue !</h2>
        <div class="form-group">
          <label for="username">Pseudonyme</label>
          <input
            name="username"
            type="text"
            placeholder="Pseudonyme"
            v-model="username"
          />
        </div>
        <div class="form-group">
          <label for="email">Email *</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            v-model="email"
          />
        </div>
        <div class="form-group">
          <label for="firstname">Prénom</label>
          <input
            type="text"
            placeholder="Prénom"
            v-model="firstname"
            name="firstname"
          />
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input
            type="text"
            placeholder="Nom"
            v-model="lastname"
            name="lastname"
          />
        </div>
        <div class="form-group">
          <label>Téléphone</label>
          <input
            type="text"
            placeholder="Numéro de téléphone"
            name="phone"
            v-model="phone"
          />
        </div>
        <div class="form-group">
          <label>Mot de passe *</label>
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            v-model="password"
          />
        </div>
        <span>* = champs obligatoires</span>
        <span class="error" v-if="error !== ''">{{ error }}</span>
        <input type="submit" value="S'inscrire" />
        <span class="sign-in">
          Déjà inscrit ?
          <span class="sign-in-link" @click="$emit('showSignIn')"
            >Connectez-vous!</span
          ></span
        >
      </form>
    </transition>
  </div>
</template>

<script setup lang="ts">
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const username = ref<string | null>(null);
const firstname = ref<string | null>(null);
const lastname = ref<string | null>(null);
const phone = ref<string | null>(null);
const error = ref("");

const emit = defineEmits(["close", "showSignIn"]);

const signUp = async () => {
  if (!email.value || !password.value) {
    error.value = "Veuillez remplir tous les champs requis";
    return;
  }
  const res = await fetch("http://talk.casadiny.ovh:3000/auth/signup/local", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username.value,
      email: email.value,
      firstname: firstname.value,
      lastname: lastname.value,
      phone: phone.value,
      password: password.value,
    }),
  })
    .then((r) => {
      console.log(r.status);
      return r.json();
    })
    .catch((e) => {
      console.log(e);
      error.value =
        "Une erreur est survenue. Merci de réessayer ultérieurement.";
    });
  console.log(res);
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
  padding-bottom: 2px;
}
input[type="email"],
input[type="password"],
input[type="text"] {
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

.sign-in,
.sign-in-link {
  font-size: 0.8rem;
  font-weight: 500;
}

.sign-in-link {
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
