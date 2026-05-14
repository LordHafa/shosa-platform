<template>
  <div :class="theme.theme === 'dark' ? 'dark' : ''">
    <div class="app-shell min-h-[100dvh] bg-cream text-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 md:py-8">
        <router-view />
      </main>
      <Footer />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import { useThemeStore } from './stores/theme'

const theme = useThemeStore()
onMounted(() => theme.applyTheme())
</script>

