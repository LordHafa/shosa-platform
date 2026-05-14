<template>
  <div class="mx-auto max-w-md card">
    <h1 class="mb-6 text-center text-2xl font-black text-navy dark:text-gold">Unified Login</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <div><label class="label">Email</label><input v-model="email" class="input" type="email" required /></div>
      <div><label class="label">Password</label><input v-model="password" class="input" type="password" required /></div>
      <p v-if="error" class="rounded-lg bg-red-100 p-3 text-red-700">{{ error }}</p>
      <button class="btn-primary w-full" :disabled="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
    </form>
    <p class="mt-5 text-center text-sm">No account? <router-link class="font-bold text-navy dark:text-gold" to="/register">Register</router-link></p>
    <div class="mt-5 rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
      Use your registered alumni or administrator credentials to continue.
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
const router = useRouter(); const auth = useAuthStore()
const email = ref(''); const password = ref(''); const error = ref(''); const loading = ref(false)
async function submit() {
  loading.value = true; error.value = ''
  try { const data = await auth.login(email.value, password.value); router.push(data.redirect) }
  catch (e) { error.value = e.response?.data?.error || e.message || 'Login failed' }
  finally { loading.value = false }
}
</script>


