<template>
  <header class="sticky top-0 z-50 bg-navy text-white shadow-lg">
    <nav class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-5">
      <router-link to="/" class="flex min-w-0 items-center gap-3" @click="closeMenu">
        <img
          src="/assets/reference/seeta-reference-logo.jpeg"
          alt="Seeta Alumni logo"
          class="h-11 w-11 shrink-0 rounded-full border-2 border-gold bg-white object-cover md:h-12 md:w-12"
        />
        <span class="min-w-0">
          <span class="block truncate text-lg font-black leading-tight md:text-xl">Seeta Alumni</span>
          <span class="block truncate text-xs font-semibold text-gold">Website + SACCO</span>
        </span>
      </router-link>

      <div class="hidden items-center gap-3 text-sm font-semibold lg:flex">
        <router-link
          v-for="item in navLinks"
          :key="item.to + item.label"
          :to="item.to"
          class="rounded-lg px-2 py-2 transition-colors hover:bg-white/10 hover:text-gold"
          active-class="text-gold"
        >
          {{ item.label }}
        </router-link>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          class="rounded-xl border border-white/30 px-3 py-2 text-sm font-bold transition hover:bg-white/10"
          type="button"
          @click="theme.toggleTheme()"
        >
          {{ theme.theme === 'light' ? 'Dark' : 'Light' }}
        </button>

        <router-link
          v-if="!auth.isLoggedIn"
          class="hidden rounded-xl bg-gold px-4 py-2 text-sm font-black text-navy shadow transition hover:scale-[1.02] md:inline-flex"
          to="/login"
        >
          Login
        </router-link>

        <button
          v-else
          class="hidden rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white shadow transition hover:scale-[1.02] md:inline-flex"
          type="button"
          @click="logout"
        >
          Logout
        </button>

        <button
          class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-sm font-black transition hover:bg-white/10 lg:hidden"
          type="button"
          :aria-expanded="mobileMenuOpen ? 'true' : 'false'"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span>Menu</span>
          <span class="flex flex-col gap-1">
            <span class="block h-0.5 w-5 rounded bg-gold"></span>
            <span class="block h-0.5 w-5 rounded bg-gold"></span>
            <span class="block h-0.5 w-5 rounded bg-gold"></span>
          </span>
        </button>
      </div>
    </nav>

    <div v-if="mobileMenuOpen" class="border-t border-white/10 bg-navy/98 lg:hidden">
      <div class="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <div class="grid gap-2">
          <router-link
            v-for="item in navLinks"
            :key="item.to + item.label"
            :to="item.to"
            :class="mobileLinkClass"
            active-class="bg-white/10 text-gold"
            @click="closeMenu"
          >
            {{ item.label }}
          </router-link>
        </div>

        <div class="grid gap-2 border-t border-white/10 pt-4">
          <router-link
            v-if="!auth.isLoggedIn"
            to="/login"
            class="flex min-h-12 items-center justify-center rounded-xl bg-gold px-4 py-3 font-black text-navy shadow"
            @click="closeMenu"
          >
            Login
          </router-link>

          <router-link
            v-if="!auth.isLoggedIn"
            to="/register"
            class="flex min-h-12 items-center justify-center rounded-xl border border-gold px-4 py-3 font-black text-gold"
            @click="closeMenu"
          >
            Join Alumni
          </router-link>

          <button
            v-if="auth.isLoggedIn"
            class="flex min-h-12 items-center justify-center rounded-xl bg-red-600 px-4 py-3 font-black text-white shadow"
            type="button"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const theme = useThemeStore()
const mobileMenuOpen = ref(false)

const mobileLinkClass =
  'flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-bold transition hover:bg-white/10 hover:text-gold'

const publicLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Store', to: '/store' },
  { label: 'SACCO', to: '/sacco/register' },
  { label: 'Contact', to: '/contact' }
]

const alumniLinks = [
  { label: 'Dashboard', to: '/alumni/dashboard' },
  { label: 'Profile', to: '/profile' },
  { label: 'SACCO', to: '/sacco/dashboard' },
  { label: 'Payments', to: '/sacco/payments' },
  { label: 'Events', to: '/events' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'Store', to: '/store' }
]

const adminLinks = [
  { label: 'Admin Dashboard', to: '/admin' },
  { label: 'Alumni', to: '/admin/alumni' },
  { label: 'Payments/SACCO', to: '/admin/payments' },
  { label: 'Gallery', to: '/admin/gallery' },
  { label: 'Documents', to: '/admin/files' },
  { label: 'Contacts', to: '/admin/contacts' },
  { label: 'Audit Logs', to: '/admin/audit-logs' }
]

const navLinks = computed(() => {
  if (auth.isAdmin) return adminLinks
  if (auth.isAlumni) return alumniLinks
  return publicLinks
})

function closeMenu() {
  mobileMenuOpen.value = false
}

function logout() {
  closeMenu()
  auth.logout()
  router.push('/')
}

watch(
  () => route.fullPath,
  () => closeMenu()
)
</script>
