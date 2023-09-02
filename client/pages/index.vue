<template>
  <div class="body">
    <Header @open-sign-in="showSignIn" />
    <SignInForm
      v-if="isSignInFormOpen && !isSignUpFormOpen"
      @close="isSignInFormOpen = false"
      @showSignUp="showSignUpForm"
    />
    <SignUpForm
      v-if="!isSignInFormOpen && isSignUpFormOpen === true"
      @close="isSignUpFormOpen = false"
      @showSignIn="showSignIn"
    />
    <h1>Home</h1>
  </div>
</template>

<script setup lang="ts">
const isSignInFormOpen = ref<boolean>(false);
const isSignUpFormOpen = ref<boolean>(false);
const showSignIn = () => {
  if (isSignUpFormOpen.value === true) {
    isSignUpFormOpen.value = false;
  }
  isSignInFormOpen.value = true;
};

const showSignUpForm = () => {
  if (isSignInFormOpen.value === true) {
    isSignInFormOpen.value = false;
  }
  isSignUpFormOpen.value = true;
};
</script>

<style scoped>
.body {
  display: flex;
  flex-direction: column;
}

h1 {
  font-size: 100px;
}
</style>
